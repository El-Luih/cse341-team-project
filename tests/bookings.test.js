import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';
import { createBooking } from '../src/models/bookings.js';

describe('Bookings', () => {
  test('GET /api/bookings returns an array', async () => {
    const response = await request(app).get('/api/bookings');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.body).toBeInstanceOf(Array);
    expect(response.body).toHaveLength(0);
  });

  test('GET /bookings-admin renders a client-hydrated shell', async () => {
    const response = await request(app).get('/bookings-admin');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id="bookings-list"');
    expect(response.text).toContain('id="booking-row-template"');
    expect(response.text).not.toContain('JR');
  });

  test('GET /trips/bookings/schedule/:scheduleId renders the booking form', async () => {
    const response = await request(app).get('/trips/bookings/schedule/1');

    expect(response.status).toBe(200);
    expect(response.text).toContain('action="/api/bookings"');
    expect(response.text).toContain('<script src="/js/booking.js" defer></script>');
    expect(response.text).not.toContain('const maxPassengers');
  });

  test('booking submission stores a booking and keeps confirmation reachable', async () => {
    const response = await request(app)
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

    const bookingsResponse = await request(app).get('/api/bookings');
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
});
