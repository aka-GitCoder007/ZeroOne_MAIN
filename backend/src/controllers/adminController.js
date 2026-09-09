import Project from '../models/Project.js';
import Review from '../models/Review.js';
import Quotation from '../models/Quotation.js';
import Payment from '../models/Payment.js';

/**
 * @route   GET /api/v1/admin/metrics
 * @desc    Get dashboard metrics across all system domains
 * @access  Private (Admin)
 */
export const getMetrics = async (req, res, next) => {
    try {
        const [
            totalProjects,
            deliveredProjects,
            reviewProjects,
            totalReviews,
            avgRatingResult,
            newQuotations,
            quotedQuotations,
            convertedQuotations,
            totalPayments,
            paidPayments,
            failedPayments
        ] = await Promise.all([
            Project.countDocuments(),
            Project.countDocuments({ status: 'Delivered' }),
            Project.countDocuments({ showInClientReviews: true }),
            Review.countDocuments(),
            Review.aggregate([
                { $group: { _id: null, avgStars: { $avg: '$stars' } } }
            ]),
            Quotation.countDocuments({ status: 'New' }),
            Quotation.countDocuments({ status: 'Quoted' }),
            Quotation.countDocuments({ status: 'Converted' }),
            Payment.countDocuments(),
            Payment.countDocuments({ status: 'Paid' }),
            Payment.countDocuments({ status: 'Failed' })
        ]);

        const averageRating = avgRatingResult.length > 0
            ? Math.round(avgRatingResult[0].avgStars * 10) / 10
            : 0;

        res.status(200).json({
            success: true,
            message: 'Dashboard metrics calculated successfully',
            data: {
                projects: {
                    total: totalProjects,
                    delivered: deliveredProjects,
                    reviewProjects
                },
                reviews: {
                    total: totalReviews,
                    averageRating
                },
                quotations: {
                    new: newQuotations,
                    quoted: quotedQuotations,
                    converted: convertedQuotations
                },
                payments: {
                    total: totalPayments,
                    paid: paidPayments,
                    failed: failedPayments
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getMetrics
};
