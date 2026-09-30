import { Response, NextFunction, Request } from 'express';
import fs from 'fs/promises';
import path from 'path';

// Read fresh each request rather than caching at startup — the file is ~40KB
// and this way swapping in real Hansen-derived data is just replacing the
// file, no redeploy needed.
const DATA_PATH = path.join(__dirname, '..', '..', 'data', 'forest_hexes.geojson');

export const getForestHexes = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    res.type('application/json').send(raw);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({
        error: 'No forest-hex data generated yet. See ml-service/scripts/README.md.',
      });
    }
    next(err);
  }
};
