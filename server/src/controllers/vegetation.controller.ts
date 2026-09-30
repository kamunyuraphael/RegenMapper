import { Response, NextFunction } from 'express';
import { Zone } from '../models/Zone';
import { AuthedRequest } from '../middleware/auth';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const getZoneVegetation = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ error: 'Zone not found' });
    }

    const months = Number(req.query.months) || 24;

    const response = await fetch(`${ML_SERVICE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: zone.latitude,
        longitude: zone.longitude,
        months,
      }),
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      return res.status(502).json({ error: (data.detail as string) || 'Vegetation analysis service failed' });
    }

    res.json({ zone: { id: zone.id, name: zone.name }, ...data });
  } catch (err) {
    next(err);
  }
};
