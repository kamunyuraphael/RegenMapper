import { Router } from 'express';
import { listZones, createZone } from '../controllers/zones.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', listZones);
router.post('/', requireAuth, createZone);

export default router;
