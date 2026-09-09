import Payment from '../models/Payment.js';
import { createRazorpayOrder, verifyRazorpaySignature } from '../services/paymentService.js';

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create a new payment order
 * @access  Public
 */
export const createOrder = async (req, res, next) => {
    try {
        const { amount, currency } = req.body;

        if (!amount || typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'A valid positive numerical payment amount is required'
            });
        }

        const razorpayOrder = await createRazorpayOrder({
            amount,
            currency: currency || 'INR'
        });

        const payment = await Payment.create({
            orderId: razorpayOrder.id,
            amount,
            currency: currency || 'INR',
            status: 'Created'
        });

        res.status(201).json({
            success: true,
            message: 'Payment order created successfully',
            data: {
                order: razorpayOrder,
                paymentRecord: payment
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify payment signature and update status
 * @access  Public
 */
export const verifyPayment = async (req, res, next) => {
    try {
        const { orderId, paymentId, signature } = req.body;

        if (!orderId || !paymentId) {
            return res.status(400).json({
                success: false,
                message: 'orderId and paymentId are required'
            });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Payment order record not found'
            });
        }

        // Verify signature if signature is provided
        const isVerified = signature ? verifyRazorpaySignature({ orderId, paymentId, signature }) : false;

        if (isVerified) {
            payment.paymentId = paymentId;
            payment.status = 'Paid';
            await payment.save();

            return res.status(200).json({
                success: true,
                message: 'Payment verified successfully',
                data: payment
            });
        } else {
            payment.paymentId = paymentId;
            payment.status = 'Failed';
            await payment.save();

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed or invalid signature',
                data: payment
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/payments
 * @desc    Get all payment records
 * @access  Private (Admin)
 */
export const getPayments = async (req, res, next) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Payment records fetched successfully',
            count: payments.length,
            data: payments
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createOrder,
    verifyPayment,
    getPayments
};
