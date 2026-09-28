import express from 'express';
import { getMetrics } from '../controllers/adminController.js';
import { protectAdmin, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/metrics', protectAdmin, authorizeRoles('super_admin', 'admin'), getMetrics);

export default router;
