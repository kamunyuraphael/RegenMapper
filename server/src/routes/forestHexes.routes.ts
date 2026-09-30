import { Router } from 'express';
import { getForestHexes } from '../controllers/forestHexes.controller';

const router = Router();

router.get('/', getForestHexes);

export default router;
