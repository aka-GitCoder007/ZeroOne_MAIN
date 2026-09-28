import express from 'express';
import rateLimit from 'express-rate-limit';
import { getReviews, createReview, updateReview, deleteReview } from '../controllers/reviewController.js';
import { validateReviewPayload, validateObjectIdParam } from '../middleware/validationMiddleware.js';
import { protectAdmin, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for review submission: 10 requests per 1 hour per IP
const reviewSubmissionLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Too many reviews submitted from this IP. Please try again after an hour.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

router.get('/', getReviews);
router.post('/', reviewSubmissionLimiter, validateReviewPayload, createReview);
router.put('/:id', protectAdmin, authorizeRoles('client_review_manager'), validateObjectIdParam, updateReview);
router.delete('/:id', protectAdmin, authorizeRoles('client_review_manager'), validateObjectIdParam, deleteReview);

export default router;

