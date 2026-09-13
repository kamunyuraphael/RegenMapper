import { Response, NextFunction } from 'express';
import { PlantingLog } from '../models/PlantingLog';
import { AuthedRequest } from '../middleware/auth';

export const createPlantingLog = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { species, quantity, zone, latitude, longitude, date, notes } = req.body;

    if (!species || !zone || latitude === undefined || longitude === undefined || !date) {
      return res.status(400).json({ error: 'species, zone, latitude, longitude and date are required' });
    }

    const log = await PlantingLog.create({
      species,
      quantity: Number(quantity) || 0,
      zone,
      latitude,
      longitude,
      date,
      notes,
      user: req.user?.userId,
    });

    const populated = await log.populate('zone', 'name');

    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

export const listPlantingLogs = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { zone, species, dateFrom, dateTo } = req.query;

    const filter: Record<string, unknown> = {};
    if (zone) filter.zone = zone;
    if (species) filter.species = { $regex: String(species), $options: 'i' };
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {};
      if (dateFrom) dateFilter.$gte = new Date(String(dateFrom));
      if (dateTo) dateFilter.$lte = new Date(String(dateTo));
      filter.date = dateFilter;
    }

    const logs = await PlantingLog.find(filter)
      .populate('zone', 'name')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
