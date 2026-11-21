import { getDb } from '../db/connect.js';
import { generateBookingReference } from '../includes/helpers.js';
import { getAllBookings as findAllBookings, getBookingById as findBookingById, createBooking } from '../models/bookings.js';
import Schedule from '../models/schemas/schedules.js';
import Trip from '../models/schemas/trips.js';

export async function bookingPage(req, res, next) {
  try {
    const schedule = await Schedule.findOne({ id: Number(req.params.scheduleId) }).lean();
    if (!schedule) {
      const error = new Error('Schedule Not Found');
      error.status = 404;
      throw error;
    }

    const trip = await Trip.findOne({ id: schedule.tripId }).lean();
    if (!trip) {
      const error = new Error('Trip Not Found');
      error.status = 404;
      throw error;
    }

    const ticketClasses = await getDb().collection('ticketClasses').find({}).toArray();
    const ticketOptions = ticketClasses.map((ticketClass) => ({
      class: ticketClass.class,
      name: ticketClass.name,
      price: trip.distance * ticketClass.pricePerKm,
      amenities: ticketClass.amenities,
      description: ticketClass.description
    }));

    return res.render('trips/book', {
      title: 'Book Trip',
      schedule,
      ticketOptions
    });
  } catch (error) {
    return next(error);
  }
}

export async function processBookingRequest(req, res) {
  try {
    const submittedPassengers = req.body.passengers;
    const passengers = Array.isArray(submittedPassengers)
      ? submittedPassengers
      : Object.values(submittedPassengers || {});

    const booking = await createBooking({
      id: generateBookingReference(),
      createdAt: new Date(),
      scheduleId: Number(req.body.scheduleId),
      tripId: req.body.tripId,
      ticketClass: req.body.ticketClass,
      selectedDay: req.body.selectedDay,
      passengers
    });

    return res.status(201).json(booking);
  } catch (error) {
    if (error.name === 'BookingReferenceError' || error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }

    console.error('Error creating booking:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
}

export async function getAllBookings(req, res) {
  try {
    const bookings = await findAllBookings();
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}

export function bookingsAdminPage(req, res) {
  return res.render('bookings', { title: 'Bookings Admin' });
}

export async function bookingConfirmationPage(req, res, next) {
  try {
    const booking = await findBookingById(req.params.bookingId);
    if (!booking) {
      const error = new Error('Booking Not Found');
      error.status = 404;
      throw error;
    }

    return res.render('trips/confirm', {
      title: 'Booking Confirmation',
      confirmation: booking
    });
  } catch (error) {
    return next(error);
  }
}
