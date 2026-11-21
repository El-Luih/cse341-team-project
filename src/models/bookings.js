import Booking from './schemas/bookings.js';
import Schedule from './schemas/schedules.js';
import Trip from './schemas/trips.js';

class BookingReferenceError extends Error {
  constructor(message) {
    super(message);
    this.name = 'BookingReferenceError';
    this.status = 400;
  }
}

export async function createBooking(bookingData) {
  const scheduleId = Number(bookingData.scheduleId);
  const tripId = typeof bookingData.tripId === 'string' ? bookingData.tripId.trim() : '';

  if (!Number.isInteger(scheduleId) || scheduleId < 1) {
    throw new BookingReferenceError('A valid schedule ID is required.');
  }
  if (!tripId) {
    throw new BookingReferenceError('A valid trip ID is required.');
  }

  const [schedule, trip] = await Promise.all([
    Schedule.findOne({ id: scheduleId }).select('tripId').lean(),
    Trip.exists({ id: tripId })
  ]);

  if (!schedule) {
    throw new BookingReferenceError('The selected schedule does not exist.');
  }
  if (!trip) {
    throw new BookingReferenceError('The selected trip does not exist.');
  }
  if (schedule.tripId !== tripId) {
    throw new BookingReferenceError('The selected schedule does not belong to the selected trip.');
  }

  const booking = await Booking.create({ ...bookingData, scheduleId, tripId });
  return booking.toObject();
}

export async function getAllBookings() {
  return Booking.find({}).sort({ createdAt: -1 }).lean();
}

export async function getBookingById(id) {
  return Booking.findOne({ id }).lean();
}
