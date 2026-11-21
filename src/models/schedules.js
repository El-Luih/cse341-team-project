import Schedule from './schemas/schedules.js';
import Trip from './schemas/trips.js';

export async function getSchedulesByTripId(tripId, month) {
  if (!tripId) {
    return [];
  }

  if (month !== undefined) {
    const parsedMonth = Number(month);
    const trip = await Trip.findOne({ id: tripId }).lean();

    if (!trip || !trip.operatingMonths?.includes(parsedMonth)) {
      return [];
    }
  }

  return Schedule.find({ tripId }).lean();
}
