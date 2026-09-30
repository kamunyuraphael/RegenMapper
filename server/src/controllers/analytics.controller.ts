import { Response, NextFunction } from 'express';
import { PlantingLog } from '../models/PlantingLog';
import { AuthedRequest } from '../middleware/auth';

const OTHER_SPECIES_LABEL = 'Other';
const TOP_SPECIES_COUNT = 7;

interface MonthlyRow {
  _id: string; // "YYYY-MM"
  trees: number;
}

interface SpeciesRow {
  _id: string;
  trees: number;
}

interface ZoneRow {
  zone: string;
  trees: number;
}

// All three are independent aggregations over the same collection — run them
// in parallel rather than round-tripping to Mongo three times in sequence.
export const getAnalyticsOverview = async (req: AuthedRequest, res: Response, next: NextFunction) => {
  try {
    const months = Math.min(Math.max(Number(req.query.months) || 12, 1), 60);
    const since = new Date();
    since.setDate(1); // set day to 1 first — subtracting months while day=29/30/31
    since.setMonth(since.getMonth() - (months - 1)); // can overflow into the wrong month otherwise
    since.setHours(0, 0, 0, 0);

    const [monthlyRows, speciesRows, zoneRows] = await Promise.all([
      PlantingLog.aggregate<MonthlyRow>([
        { $match: { date: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
            trees: { $sum: '$quantity' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      PlantingLog.aggregate<SpeciesRow>([
        { $group: { _id: '$species', trees: { $sum: '$quantity' } } },
        { $sort: { trees: -1 } },
      ]),
      PlantingLog.aggregate<ZoneRow>([
        { $group: { _id: '$zone', trees: { $sum: '$quantity' } } },
        {
          $lookup: {
            from: 'zones',
            localField: '_id',
            foreignField: '_id',
            as: 'zoneInfo',
          },
        },
        { $unwind: { path: '$zoneInfo', preserveNullAndEmptyArrays: true } },
        { $project: { _id: 0, zone: { $ifNull: ['$zoneInfo.name', 'Unknown zone'] }, trees: 1 } },
        { $sort: { trees: -1 } },
      ]),
    ]);

    // Fill in months with zero plantings so the line chart doesn't skip gaps,
    // and compute a running cumulative total alongside the per-month figure.
    const byMonth = new Map(monthlyRows.map(r => [r._id, r.trees]));
    const monthlyTrend: { month: string; trees: number; cumulative: number }[] = [];
    let cumulative = 0;
    const cursor = new Date(since);
    for (let i = 0; i < months; i++) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
      const trees = byMonth.get(key) || 0;
      cumulative += trees;
      monthlyTrend.push({ month: key, trees, cumulative });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // Collapse the long tail into "Other" so the species chart stays readable.
    const sortedSpecies = [...speciesRows].sort((a, b) => b.trees - a.trees);
    const topSpecies = sortedSpecies.slice(0, TOP_SPECIES_COUNT);
    const restTotal = sortedSpecies.slice(TOP_SPECIES_COUNT).reduce((sum, r) => sum + r.trees, 0);
    const bySpecies = topSpecies.map(r => ({ species: r._id, trees: r.trees }));
    if (restTotal > 0) bySpecies.push({ species: OTHER_SPECIES_LABEL, trees: restTotal });

    const byZone = zoneRows.map(r => ({ zone: r.zone, trees: r.trees }));

    res.json({ monthlyTrend, bySpecies, byZone });
  } catch (err) {
    next(err);
  }
};
