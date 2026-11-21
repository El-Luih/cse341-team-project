import { Router } from 'express';
import { trainsApi } from '../controllers/trains.js';
import { getTripById, getAllTrips } from '../controllers/trips.js';
import { getSchedulesForTrip, getSchedulesForTripAndMonth } from '../controllers/schedules.js';
import { getAllBookings, processBookingRequest } from '../controllers/bookings.js';

const router = Router();

/**
 * @swagger
 * /api/trains:
 *   get:
 *     summary: Retrieve all trains
 *     tags:
 *       - Trains
 *     responses:
 *       200:
 *         description: An object containing an array of train records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 trains:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Unexpected server or database error
 */
router.get('/api/trains', trainsApi);

/**
 * @swagger
 * /api/trips:
 *   get:
 *     summary: Retrieve all trips
 *     tags:
 *       - Trips
 *     responses:
 *       200:
 *         description: An array of trip records
 *       500:
 *         description: Unexpected server or database error
 */
router.get('/api/trips', getAllTrips);

/**
 * @swagger
 * /api/trips/{id}:
 *   get:
 *     summary: Retrieve a trip by ID
 *     tags:
 *       - Trips
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The matching trip record
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Unexpected server or database error
 */
router.get('/api/trips/:id', getTripById);

/**
 * @swagger
 * /api/trips/{id}/schedules:
 *   get:
 *     summary: Retrieve schedules for a trip
 *     description: Returns all schedules for the trip when month is omitted, or schedules applicable to the specified month when called as /api/trips/{id}/schedules?month={month}.
 *     tags:
 *       - Schedules
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 12
 *     responses:
 *       200:
 *         description: An array of schedule records
 *       400:
 *         description: Invalid month value
 *       404:
 *         description: No schedules found for the trip or month
 *       500:
 *         description: Unexpected server or database error
 */
router.get('/api/trips/:id/schedules', (req, res) => {
  if (req.query.month !== undefined) {
    return getSchedulesForTripAndMonth(req, res);
  }
  return getSchedulesForTrip(req, res);
});

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Retrieve all bookings
 *     tags:
 *       - Bookings
 *     responses:
 *       200:
 *         description: An array of booking records
 *       500:
 *         description: Unexpected server or database error
 *   post:
 *     summary: Create a booking
 *     tags:
 *       - Bookings
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - scheduleId
 *               - tripId
 *               - ticketClass
 *               - selectedDay
 *               - passengers
 *             properties:
 *               scheduleId:
 *                 type: integer
 *               tripId:
 *                 type: string
 *               ticketClass:
 *                 type: string
 *               selectedDay:
 *                 type: string
 *               passengers:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 8
 *                 items:
 *                   type: object
 *                   required: [firstName, lastName, email, phone]
 *                   properties:
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     phone:
 *                       type: string
 *     responses:
 *       201:
 *         description: Booking created
 *       400:
 *         description: Invalid booking data or references
 *       500:
 *         description: Unexpected server or database error
 */
router.get('/api/bookings', getAllBookings);
router.post('/api/bookings', processBookingRequest);

export default router;
