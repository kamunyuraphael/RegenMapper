import { Router } from 'express';
import { createPlantingLog, listPlantingLogs } from '../controllers/plantingLogs.controller';
import { attachUserIfPresent } from '../middleware/auth';

const router = Router();

// Logging a planting doesn't require an account — attachUserIfPresent just
// tags the entry with a user id when the submitter happens to be signed in.
router.post('/', attachUserIfPresent, createPlantingLog);
router.get('/', listPlantingLogs);

export default router;
