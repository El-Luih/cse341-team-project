import { Router } from 'express';
import { trainsApi } from './trains.js';
import { getTripById, getAllTrips } from '../controllers/trips.js';

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

export default router;
