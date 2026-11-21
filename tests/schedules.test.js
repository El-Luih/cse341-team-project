import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';

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
    const response = await request(app).get('/api/trips/alpine-panorama/schedules');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(2);
  });

  test('GET /api/trips/:id/schedules?month= filters schedules for an operating month', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama/schedules?month=6');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  test('month outside operating months returns 404', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama/schedules?month=1');

    expect(response.status).toBe(404);
  });

  test('invalid month returns 400', async () => {
    const response = await request(app).get('/api/trips/alpine-panorama/schedules?month=13');

    expect(response.status).toBe(400);
  });

  test('missing trip schedules return 404', async () => {
    const response = await request(app).get('/api/trips/not-a-trip/schedules');

    expect(response.status).toBe(404);
  });

  test('trip details page hydrates schedules client-side', async () => {
    const response = await request(app).get('/trips/alpine-panorama');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="schedule-months"');
    expect(response.text).toContain('data-month="1" aria-pressed="false">January</button>');
    expect(response.text).toContain('data-month="12" aria-pressed="false">December</button>');
    expect(response.text).toContain('id="trip-schedules"');
    expect(response.text).toContain('id="schedules-empty"');
    expect(response.text).not.toContain('08:30');
  });
});
