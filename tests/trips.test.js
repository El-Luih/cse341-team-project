import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

describe('Trips API', () => {
  test('GET /api/trips returns status 200 and an array', async () => {
    const response = await request(app).get('/api/trips');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(6);
  });

  test('GET /api/trips/:id returns the matching trip', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      id: 'alpine-panorama',
      name: 'Alpine Panorama Express'
    }));
  });

  test('GET /api/trips/:id returns 404 for a missing trip', async () => {
    const response = await request(app).get('/api/trips/not-a-real-trip');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: 'Trip not found' });
  });

  test('GET /trips renders the hydrated list page', async () => {
    const response = await request(app).get('/trips');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="trips-list"');
    expect(response.text).not.toContain('Alpine Panorama Express');
  });

  test('GET /trips/:tripId renders trip details', async () => {
    const response = await request(app).get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Alpine Panorama Express');
  });
});
