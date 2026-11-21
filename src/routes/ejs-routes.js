import { Router } from 'express';
import { renderTripDetails, renderTripsList } from '../controllers/trips.js';
import { aboutPage, homePage, testErrorPage } from '../controllers/pages.js';
import { trainsPage } from '../controllers/trains.js';
import {
	bookingPage,
	bookingConfirmationPage,
	bookingsAdminPage
} from '../controllers/bookings.js';

const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/500', testErrorPage);
router.get('/bookings-admin', bookingsAdminPage);

router.get('/trips', renderTripsList);
router.get('/trips/bookings/schedule/:scheduleId', bookingPage);
router.get('/trips/bookings/:bookingId', bookingConfirmationPage);
router.get('/trips/:tripId', renderTripDetails);

export default router;
