import { Router } from 'express';
import { renderTripDetails, renderTripsList } from '../controllers/trips.js';
import { bookingPage, processBookingRequest } from './book.js';
import confirmationPage from './confirm.js';

const router = Router();

router.get('/', renderTripsList);
router.get('/booking/:scheduleId', bookingPage);
router.post('/book', processBookingRequest);
router.get('/confirmation/:confirmationId', confirmationPage);
router.get('/:tripId', renderTripDetails);

export default router;
