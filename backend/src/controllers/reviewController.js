import Review from '../models/Review.js';
import Project from '../models/Project.js';

/**
 * @route   GET /api/v1/reviews
 * @desc    Get all reviews, with optional filtering by projectId
 * @access  Public
 */
export const getReviews = async (req, res, next) => {
    try {
        const { projectId, isApproved } = req.query;
        const query = {};

        if (projectId) {
            query.projectId = projectId;
        }

        if (isApproved !== undefined) {
            query.isApproved = isApproved === 'true';
        } else {
            // By default return approved reviews to public visitors
            query.isApproved = true;
        }

        const reviews = await Review.find(query)
            .populate('projectId', 'name customerName showInClientReviews image')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Reviews fetched successfully',
            count: reviews.length,
            data: reviews
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/reviews
 * @desc    Submit a review for a project
 * @access  Public (Rate limited)
 */
export const createReview = async (req, res, next) => {
    try {
        const { projectId, text, author, stars } = req.body;

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Referenced project not found'
            });
        }

        // Project exists — any project can receive reviews from visitors

        const review = await Review.create({
            projectId,
            text,
            author: author || 'Guest User',
            stars,
            isApproved: true
        });

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/v1/reviews/:id
 * @desc    Update review (e.g. approve/reject or edit)
 * @access  Private (Admin)
 */
export const updateReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Review updated successfully',
            data: review
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/v1/reviews/:id
 * @desc    Delete a review
 * @access  Private (Admin)
 */
export const deleteReview = async (req, res, next) => {
    try {
        const review = await Review.findByIdAndDelete(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Review deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getReviews,
    createReview,
    updateReview,
    deleteReview
};

