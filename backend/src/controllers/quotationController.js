import Quotation from '../models/Quotation.js';
import { generateRequestId } from '../utils/generateRequestId.js';
import { sendQuotationEmail } from '../services/emailService.js';

/**
 * @route   POST /api/v1/quotations
 * @desc    Submit a new quotation enquiry
 * @access  Public
 */
export const createQuotation = async (req, res, next) => {
    try {
        const {
            fullName,
            companyName,
            email,
            phone,
            services,
            otherService,
            projectName,
            description,
            hasExistingWebsite,
            websiteUrl,
            budget,
            timeline,
            contactPreference,
            additionalInformation
        } = req.body;

        // Generate unique backend request ID (ZR-2026-XXXX)
        let requestId = generateRequestId();
        
        // Ensure collision resistance against rare duplicate ID
        let existing = await Quotation.findOne({ requestId });
        let attempts = 0;
        while (existing && attempts < 5) {
            requestId = generateRequestId();
            existing = await Quotation.findOne({ requestId });
            attempts++;
        }

        const quotation = await Quotation.create({
            requestId,
            fullName,
            companyName,
            email,
            phone,
            services,
            otherService,
            projectName,
            description,
            hasExistingWebsite: !!hasExistingWebsite,
            websiteUrl,
            budget,
            timeline,
            contactPreference: contactPreference || ['Email'],
            additionalInformation,
            status: 'New'
        });

        // Trigger email service (non-blocking log handling inside emailService)
        sendQuotationEmail(quotation).catch(err => {
            console.error('[QuotationController] Background email trigger failed:', err.message);
        });

        res.status(201).json({
            success: true,
            message: 'Quotation request submitted successfully',
            data: quotation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/quotations
 * @desc    Get all quotation requests
 * @access  Private (Admin)
 */
export const getQuotations = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) {
            query.status = status;
        }

        const quotations = await Quotation.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Quotations fetched successfully',
            count: quotations.length,
            data: quotations
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/quotations/:id
 * @desc    Get single quotation by ID or Request ID
 * @access  Private (Admin)
 */
export const getQuotationById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let quotation;

        if (id.startsWith('ZR-')) {
            quotation = await Quotation.findOne({ requestId: id.toUpperCase() });
        } else {
            quotation = await Quotation.findById(id);
        }

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation request not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Quotation details fetched successfully',
            data: quotation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   PUT /api/v1/quotations/:id
 * @desc    Update quotation status
 * @access  Private (Admin)
 */
export const updateQuotationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        
        const validStatuses = ['New', 'Contacted', 'Quoted', 'Converted', 'Closed'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Status must be one of: ${validStatuses.join(', ')}`
            });
        }

        const quotation = await Quotation.findByIdAndUpdate(
            req.params.id,
            req.body,
            { returnDocument: 'after', runValidators: true }
        );

        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation request not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Quotation updated successfully',
            data: quotation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   DELETE /api/v1/quotations/:id
 * @desc    Delete quotation request
 * @access  Private (Admin)
 */
export const deleteQuotation = async (req, res, next) => {
    try {
        const quotation = await Quotation.findByIdAndDelete(req.params.id);
        if (!quotation) {
            return res.status(404).json({
                success: false,
                message: 'Quotation request not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Quotation deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

export default {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotationStatus,
    deleteQuotation
};
