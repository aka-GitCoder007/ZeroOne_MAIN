import express from 'express';
import { createOrder, verifyPayment, getPayments } from '../controllers/paymentController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.get('/', protectAdmin, getPayments);

export default router;
