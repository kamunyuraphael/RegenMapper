import { Router } from 'express';
import { getImpactStatus } from '../controllers/impact.controller';

const router = Router();

router.get('/', getImpactStatus);

export default router;
