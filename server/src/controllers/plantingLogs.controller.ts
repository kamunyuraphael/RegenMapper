import { Response, NextFunction } from 'express';
import { PlantingLog } from '../models/PlantingLog';
import { AuthedRequest } from '../middleware/auth';

export const createPlantingLog = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { species, quantity, location, date, notes } = req.body;

    if (!species || !location || !date) {
      return res.status(400).json({ error: 'species, location and date are required' });
    }

    const log = await PlantingLog.create({
      species,
      quantity: Number(quantity) || 0,
      location,
      date,
      notes,
      user: req.user?.userId,
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
};

export const listPlantingLogs = async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const logs = await PlantingLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    next(err);
  }
};
