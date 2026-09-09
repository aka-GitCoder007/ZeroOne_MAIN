import express from 'express';
import { getMetrics } from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/metrics', protectAdmin, getMetrics);

export default router;
