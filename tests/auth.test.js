import bcrypt from 'bcrypt';
import request from 'supertest';
import { describe, expect, test } from 'vitest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

const registerUser = (agent, overrides = {}) => agent
  .post('/register')
  .send({
    name: 'Test Customer',
    username: 'testcustomer',
    email: 'customer@example.com',
    password: 'password123',
    ...overrides
  });

describe('Core authentication', () => {
  test('login and admin page protect unauthenticated users', async () => {
    const loginPage = await request(app).get('/login');
    expect(loginPage.status).toBe(200);
    expect(loginPage.text).toContain('Log In');

    const adminPage = await request(app).get('/admin');
    expect(adminPage.status).toBe(302);
    expect(adminPage.headers.location).toBe('/login');
  });

  test('registration creates a customer and stores session user data', async () => {
    const agent = request.agent(app);
    const response = await registerUser(agent);

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/');

    const user = await User.findOne({ email: 'customer@example.com' }).populate('role');
    expect(user).not.toBeNull();
    expect(user.role.name).toBe('customer');
    expect(user.passwordHash).not.toBe('password123');

    const accountPage = await agent.get('/');
    expect(accountPage.text).toContain('Test Customer');
  });

  test('login verifies bcrypt password and logout destroys session', async () => {
    const passwordHash = await bcrypt.hash('password123', 12);
    const customerRole = await Role.findOne({ name: 'customer' });
    await User.create({
      name: 'Returning User',
      username: 'returning',
      email: 'returning@example.com',
      passwordHash,
      role: customerRole._id
    });

    const agent = request.agent(app);
    const loginResponse = await agent.post('/login').send({
      email: 'returning@example.com',
      password: 'password123'
    });
    expect(loginResponse.status).toBe(302);

    const homeResponse = await agent.get('/');
    expect(homeResponse.text).toContain('Returning User');

    const logoutResponse = await agent.post('/logout');
    expect(logoutResponse.status).toBe(302);

    const afterLogout = await agent.get('/');
    expect(afterLogout.text).not.toContain('Returning User');
  });

  test('authenticated customer receives 403 on the admin page', async () => {
    const customerRole = await Role.findOne({ name: 'customer' });
    await User.create({
      name: 'Customer Admin Attempt',
      username: 'customer-attempt',
      email: 'customer-attempt@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: customerRole._id
    });

    const agent = request.agent(app);
    await agent.post('/login').send({
      email: 'customer-attempt@example.com',
      password: 'password123'
    });

    const response = await agent.get('/admin');
    expect(response.status).toBe(403);
    expect(response.text).toContain('Forbidden');
  });

  test('admin user can open the admin dashboard', async () => {
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.create({
      name: 'Test Admin',
      username: 'test-admin',
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: adminRole._id
    });

    const agent = request.agent(app);
    await agent.post('/login').send({
      email: 'admin@example.com',
      password: 'password123'
    });

    const response = await agent.get('/admin');
    expect(response.status).toBe(200);
    expect(response.text).toContain('Welcome to the Admin Dashboard');
  });

  test('database initialization contains customer and admin roles', async () => {
    const names = await getDb().collection('roles').find({}).toArray();
    expect(names.map((role) => role.name)).toEqual(
      expect.arrayContaining(['customer', 'admin'])
    );
  });
});
