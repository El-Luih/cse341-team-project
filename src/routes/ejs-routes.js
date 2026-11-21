import { Router } from 'express';
import { renderTripDetails, renderTripsList } from '../controllers/trips.js';
import { aboutPage, homePage, testErrorPage } from '../controllers/pages.js';
import { trainsPage } from '../controllers/trains.js';
import { bookingPage, processBookingRequest } from './book.js';
import confirmationPage from './confirm.js';

const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/500', testErrorPage);

router.get('/trips', renderTripsList);
router.get('/trips/booking/:scheduleId', bookingPage);
router.post('/trips/book', processBookingRequest);
router.get('/trips/confirmation/:confirmationId', confirmationPage);
router.get('/trips/:tripId', renderTripDetails);

export default router;
