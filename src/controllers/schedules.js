import { getSchedulesByTripId as findSchedulesByTripId } from '../models/schedules.js';

export async function getSchedulesForTrip(req, res) {
  try {
    const schedules = await findSchedulesByTripId(req.params.id);

    if (schedules.length === 0) {
      return res.status(404).json({ error: 'Schedules not found' });
    }

    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}

export async function getSchedulesForTripAndMonth(req, res) {
  try {
    const month = Number(req.query.month);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ error: 'Month must be a number from 1 to 12' });
    }

    const schedules = await findSchedulesByTripId(req.params.id, month);

    if (schedules.length === 0) {
      return res.status(404).json({ error: 'Schedules not found' });
    }

    return res.status(200).json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return res.status(500).json({ error: 'Failed to fetch schedules' });
  }
}
