import express from 'express';
import rateLimit from 'express-rate-limit';
import { createQuotation, getQuotations, getQuotationById, updateQuotationStatus, deleteQuotation } from '../controllers/quotationController.js';
import { protectAdmin } from '../middleware/authMiddleware.js';
import { validateQuotationPayload, validateObjectIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Rate limiter for quotation submission: 10 requests per 1 hour per IP
const quotationSubmissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Too many quotation requests submitted from this IP. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/', quotationSubmissionLimiter, validateQuotationPayload, createQuotation);
router.get('/', protectAdmin, getQuotations);
router.get('/:id', protectAdmin, validateObjectIdParam, getQuotationById);
router.put('/:id', protectAdmin, validateObjectIdParam, updateQuotationStatus);
router.delete('/:id', protectAdmin, validateObjectIdParam, deleteQuotation);

export default router;
