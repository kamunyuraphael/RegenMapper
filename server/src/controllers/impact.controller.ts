import { Response, NextFunction } from 'express';
import { PlantingLog } from '../models/PlantingLog';
import { AuthedRequest } from '../middleware/auth';

// Computed on the fly from PlantingLog rather than kept in a separate
// synced table — one less place for the numbers to drift out of sync.
export const getImpactStatus = async (_req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const [result] = await PlantingLog.aggregate([
      {
        $group: {
          _id: null,
          trees_planted: { $sum: '$quantity' },
          zones: { $addToSet: '$zone' },
          contributors: { $addToSet: '$user' },
        },
      },
    ]);

    res.json({
      trees_planted: result?.trees_planted || 0,
      zones_mapped: result?.zones?.length || 0,
      contributors: (result?.contributors || []).filter(Boolean).length,
    });
  } catch (err) {
    next(err);
  }
};
