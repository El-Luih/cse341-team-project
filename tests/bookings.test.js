import { describe, expect, test } from 'vitest';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { createBooking } from '../src/models/bookings.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

describe('Bookings', () => {
  test('GET /api/bookings returns 401 when unauthenticated', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'Authentication required' });
  });

  test('GET /api/bookings returns 403 for an authenticated customer', async () => {
    const customerRole = await Role.findOne({ name: 'customer' });
    await User.create({
      name: 'Bookings Customer',
      username: 'bookings-customer',
      email: 'bookings-customer@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: customerRole._id
    });

    const customerAgent = request.agent(app);
    await customerAgent.post('/login').send({
      email: 'bookings-customer@example.com',
      password: 'password123'
    });

    const response = await customerAgent.get('/api/bookings');
    expect(response.status).toBe(403);
    expect(response.body).toEqual({ error: 'Forbidden' });
  });

  test('GET /bookings-admin redirects anonymous users to login', async () => {
    const response = await request(app).get('/bookings-admin');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/login');
  });

  test('GET /trips/bookings/schedule/:scheduleId renders the booking form', async () => {
    const response = await request(app).get('/trips/bookings/schedule/1');

    expect(response.status).toBe(200);
    expect(response.text).toContain('action="/api/bookings"');
    expect(response.text).toContain('<script src="/js/booking.js" defer></script>');
    expect(response.text).not.toContain('const maxPassengers');
  });

  test('booking submission stores a booking and keeps confirmation reachable', async () => {
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.create({
      name: 'Booking Test Admin',
      username: 'booking-test-admin',
      email: 'booking-test-admin@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: adminRole._id
    });
    const adminAgent = request.agent(app);
    await adminAgent.post('/login').send({
      email: 'booking-test-admin@example.com',
      password: 'password123'
    });

    const response = await adminAgent
      .post('/api/bookings')
      .send({
        scheduleId: 1,
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'monday',
        passengers: [{
          firstName: 'Test',
          lastName: 'Passenger',
          email: 'test@example.com',
          phone: '+81 90 0000 0000'
        }]
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toMatch(/^JR[A-Z0-9]+$/);

    const booking = await getDb().collection('bookings').findOne({});
    expect(booking).toEqual(expect.objectContaining({
      tripId: 'alpine-panorama',
      scheduleId: 1,
      ticketClass: 'standard',
      selectedDay: 'monday'
    }));
    expect(booking.passengers).toEqual([
      expect.objectContaining({
        firstName: 'Test',
        lastName: 'Passenger',
        email: 'test@example.com'
      })
    ]);

    const bookingsResponse = await adminAgent.get('/api/bookings');
    expect(bookingsResponse.status).toBe(200);
    expect(bookingsResponse.body).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: booking.id })])
    );

    const confirmationResponse = await request(app).get(`/trips/bookings/${booking.id}`);
    expect(confirmationResponse.status).toBe(200);
    expect(confirmationResponse.text).toContain(booking.id);
  });

  test('createBooking rejects a schedule ID that does not exist', async () => {
    await expect(createBooking({
      id: 'JRINVALID1',
      scheduleId: 999,
      tripId: 'alpine-panorama',
      ticketClass: 'standard',
      selectedDay: 'monday',
      passengers: [{
        firstName: 'Test',
        lastName: 'Passenger',
        email: 'test@example.com',
        phone: '+81 90 0000 0000'
      }]
    })).rejects.toThrow('The selected schedule does not exist.');
  });

  test('POST /api/bookings returns 400 for an invalid schedule reference', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({
        scheduleId: 999,
        tripId: 'alpine-panorama',
        ticketClass: 'standard',
        selectedDay: 'monday',
        passengers: [{
          firstName: 'Test',
          lastName: 'Passenger',
          email: 'test@example.com',
          phone: '+81 90 0000 0000'
        }]
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('The selected schedule does not exist.');
  });

  test('createBooking rejects a trip ID that does not exist', async () => {
    await expect(createBooking({
      id: 'JRINVALID2',
      scheduleId: 1,
      tripId: 'not-a-trip',
      ticketClass: 'standard',
      selectedDay: 'monday',
      passengers: [{
        firstName: 'Test',
        lastName: 'Passenger',
        email: 'test@example.com',
        phone: '+81 90 0000 0000'
      }]
    })).rejects.toThrow('The selected trip does not exist.');
  });

  test('createBooking rejects a schedule that belongs to another trip', async () => {
    await expect(createBooking({
      id: 'JRINVALID3',
      scheduleId: 1,
      tripId: 'coastal-breeze',
      ticketClass: 'standard',
      selectedDay: 'monday',
      passengers: [{
        firstName: 'Test',
        lastName: 'Passenger',
        email: 'test@example.com',
        phone: '+81 90 0000 0000'
      }]
    })).rejects.toThrow('The selected schedule does not belong to the selected trip.');
  });

  test('database initialization does not use a confirmations collection', async () => {
    const collections = await getDb().listCollections().toArray();
    expect(collections.map((collection) => collection.name)).not.toContain('confirmations');
  });

  test('GET /api/bookings requires an authenticated admin', async () => {
    const adminRole = await Role.findOne({ name: 'admin' });
    await User.create({
      name: 'Bookings API Admin',
      username: 'bookings-api-admin',
      email: 'bookings-api-admin@example.com',
      passwordHash: await bcrypt.hash('password123', 12),
      role: adminRole._id
    });

    const adminAgent = request.agent(app);
    await adminAgent.post('/login').send({
      email: 'bookings-api-admin@example.com',
      password: 'password123'
    });

    const response = await adminAgent.get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
  });
});
