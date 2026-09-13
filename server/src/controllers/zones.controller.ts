import { Response, NextFunction } from 'express';
import { Zone } from '../models/Zone';
import { AuthedRequest } from '../middleware/auth';

export const listZones = async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const zones = await Zone.find().sort({ name: 1 });
    res.json(zones);
  } catch (err) {
    next(err);
  }
};

export const createZone = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const { name, description, latitude, longitude, targetTrees } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'name, latitude and longitude are required' });
    }

    const existing = await Zone.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ error: 'A zone with this name already exists' });
    }

    const zone = await Zone.create({
      name,
      description,
      latitude,
      longitude,
      targetTrees,
    });

    res.status(201).json(zone);
  } catch (err) {
    next(err);
  }
};
