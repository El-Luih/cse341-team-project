import { beforeAll, describe, expect, test } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../app.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

const createCustomerAgent = async () => {
  const role = await Role.findOne({ name: 'customer' });
  await User.create({
    name: 'Schedule API Customer',
    username: 'schedule-api-customer',
    email: 'schedule-api-customer@example.com',
    passwordHash: await bcrypt.hash('password123', 12),
    role: role._id
  });
  const agent = request.agent(app);
  await agent.post('/login').send({
    email: 'schedule-api-customer@example.com',
    password: 'password123'
  });
  return agent;
};

describe('Trip schedules API', () => {
  test('Swagger exposes only the trip-nested schedules route', async () => {
    const response = await request(app).get('/api-docs.json');

    expect(response.status).toBe(200);
    expect(response.body.paths).toHaveProperty('/api/trips/{id}/schedules');
    expect(response.body.paths).not.toHaveProperty('/api/schedules/trip/{tripId}');
    expect(response.body.paths).not.toHaveProperty('/api/schedules/trip/{tripId}/month/{month}');
    expect(response.body.paths['/api/trips/{id}/schedules'].get.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          in: 'query',
          name: 'month',
          required: false
        })
      ])
    );
  });

  test('GET /api/trips/:id/schedules returns all schedules', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
  });

  test('GET /api/trips/:id/schedules?month= filters schedules for an operating month', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/alpine-panorama/schedules?month=6');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('month outside operating months returns 404', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/alpine-panorama/schedules?month=1');

    expect(response.status).toBe(404);
  });

  test('invalid month returns 400', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/alpine-panorama/schedules?month=13');

    expect(response.status).toBe(400);
  });

  test('missing trip schedules return 404', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/api/trips/not-a-trip/schedules');

    expect(response.status).toBe(404);
  });

  test('trip details page hydrates schedules client-side', async () => {
    const agent = await createCustomerAgent();
    const response = await agent.get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="schedule-months"');
    expect(response.text).toContain('data-month="1" aria-pressed="false">January</button>');
    expect(response.text).toContain('data-month="12" aria-pressed="false">December</button>');
    expect(response.text).toContain('id="trip-schedules"');
    expect(response.text).toContain('id="schedules-empty"');
    expect(response.text).not.toContain('08:30');
  });

  describe('Authentication', () => {
    let agent;

    beforeAll(async () => {
      agent = await createCustomerAgent();
    });

    test('Authenticated user can access their schedules', async () => {
      const response = await agent.get('/api/trips/alpine-panorama/schedules');

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body).toHaveLength(2);
    });

    test('Authenticated user can filter schedules by month', async () => {
      const response = await agent.get('/api/trips/alpine-panorama/schedules?month=6');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });

    test('Authenticated user receives 404 for month outside operating months', async () => {
      const response = await agent.get('/api/trips/alpine-panorama/schedules?month=1');

      expect(response.status).toBe(404);
    });

    test('Authenticated user receives 400 for invalid month', async () => {
      const response = await agent.get('/api/trips/alpine-panorama/schedules?month=13');

      expect(response.status).toBe(400);
    });

    test('Authenticated user receives 404 for missing trip schedules', async () => {
      const response = await agent.get('/api/trips/not-a-trip/schedules');

      expect(response.status).toBe(404);
    });
  });

  test('schedule APIs return 401 when unauthenticated', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });
});
