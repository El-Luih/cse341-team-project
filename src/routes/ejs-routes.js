import { Router } from 'express';
import { renderTripDetails, renderTripsList } from '../controllers/trips.js';
import { aboutPage, homePage, testErrorPage } from '../controllers/pages.js';
import { trainsPage } from '../controllers/trains.js';
import {
	bookingPage,
	bookingConfirmationPage,
	bookingsAdminPage
} from '../controllers/bookings.js';
import {
	adminDashboard,
	login,
	loginPage,
	logout,
	register,
	registerPage
} from '../controllers/auth.js';
import { requirePageLogin, requirePageRole } from '../middleware/auth.js';

const router = Router();

router.get('/', homePage);
router.get('/about', aboutPage);
router.get('/trains', trainsPage);
router.get('/500', testErrorPage);
router.get('/bookings-admin', requirePageRole('admin'), bookingsAdminPage);
router.get('/admin', requirePageRole('admin'), adminDashboard);

router.get('/trips', requirePageLogin, renderTripsList);
router.get('/trips/bookings/schedule/:scheduleId', bookingPage);
router.get('/trips/bookings/:bookingId', bookingConfirmationPage);
router.get('/trips/:tripId', requirePageLogin, renderTripDetails);

router.get('/login', loginPage);
router.post('/login', login);
router.post('/logout', logout);
router.get('/register', registerPage);
router.post('/register', register);

export default router;
