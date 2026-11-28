import { describe, expect, test } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../app.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

const createCustomerAgent = async () => {
  const role = await Role.findOne({ name: 'customer' });
  await User.create({
    name: 'Trip API Customer',
    username: 'trip-api-customer',
    email: 'trip-api-customer@example.com',
    passwordHash: await bcrypt.hash('password123', 12),
    role: role._id
  });
  const agent = request.agent(app);
  await agent.post('/login').send({
    email: 'trip-api-customer@example.com',
    password: 'password123'
  });
  return agent;
};

describe('Trips API', () => {
  test('GET /api/trips returns status 200 and an array', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(6);
  });

  test('GET /api/trips/:id returns the matching trip', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      id: 'alpine-panorama',
      name: 'Alpine Panorama Express'
    }));
  });

  test('GET /api/trips/:id returns 404 for a missing trip', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/not-a-real-trip');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
  });

  test('GET /trips renders the hydrated list page', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/trips');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="trips-list"');
    expect(response.text).not.toContain('Alpine Panorama Express');
  });

  test('GET /trips/:tripId renders trip details', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Alpine Panorama Express');
  });

  test('trip APIs return 401 when unauthenticated', async () => {
    const allTrips = await request(app).get('/api/trips');
    const oneTrip = await request(app).get('/api/trips/alpine-panorama');

    expect(allTrips.status).toBe(401);
    expect(allTrips.body).toEqual({ error: 'Authentication required' });
    expect(oneTrip.status).toBe(401);
    expect(oneTrip.body).toEqual({ error: 'Authentication required' });
  });
});
