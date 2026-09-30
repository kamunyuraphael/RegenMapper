import { Router } from 'express';
import { listZones, createZone } from '../controllers/zones.controller';
import { getZoneVegetation } from '../controllers/vegetation.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listZones);
router.post('/', requireAuth, createZone);
router.get('/:id/vegetation', getZoneVegetation);

export default router;
