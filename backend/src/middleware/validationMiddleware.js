import { isValidEmail, isValidPhone, isValidStars, isValidUrl, isValidObjectId, sanitizeString } from '../utils/validators.js';

/**
 * Middleware to validate quotation submission payload
 */
export const validateQuotationPayload = (req, res, next) => {
    const { fullName, email, phone, services, projectName, description, budget, timeline } = req.body;

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
        return res.status(400).json({ success: false, message: 'Full name is required' });
    }

    if (!email || !isValidEmail(email)) {
        return res.status(400).json({ success: false, message: 'Valid email address is required' });
    }

    if (!phone || !isValidPhone(phone)) {
        return res.status(400).json({ success: false, message: 'Valid phone number is required' });
    }

    if (!Array.isArray(services) || services.length === 0) {
        return res.status(400).json({ success: false, message: 'At least one service selection is required' });
    }

    if (!projectName || typeof projectName !== 'string' || !projectName.trim()) {
        return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
        return res.status(400).json({ success: false, message: 'Project description is required' });
    }

    if (description.trim().length > 1000) {
        return res.status(400).json({ success: false, message: 'Description cannot exceed 1000 characters' });
    }

    if (!budget || typeof budget !== 'string' || !budget.trim()) {
        return res.status(400).json({ success: false, message: 'Budget selection is required' });
    }

    if (!timeline || typeof timeline !== 'string' || !timeline.trim()) {
        return res.status(400).json({ success: false, message: 'Timeline selection is required' });
    }

    // Sanitize string fields
    req.body.fullName = sanitizeString(fullName, 100);
    req.body.companyName = req.body.companyName ? sanitizeString(req.body.companyName, 100) : '';
    req.body.projectName = sanitizeString(projectName, 150);
    req.body.description = sanitizeString(description, 1000);
    req.body.otherService = req.body.otherService ? sanitizeString(req.body.otherService, 100) : '';
    req.body.additionalInformation = req.body.additionalInformation ? sanitizeString(req.body.additionalInformation, 500) : '';

    next();
};

/**
 * Middleware to validate review submission payload
 */
export const validateReviewPayload = (req, res, next) => {
    const { projectId, text, stars, author } = req.body;

    if (!projectId || !isValidObjectId(projectId)) {
        return res.status(400).json({ success: false, message: 'Valid Project ID reference is required' });
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, message: 'Review text is required' });
    }

    if (text.trim().length > 500) {
        return res.status(400).json({ success: false, message: 'Review text cannot exceed 500 characters' });
    }

    if (!stars || !isValidStars(stars)) {
        return res.status(400).json({ success: false, message: 'Stars rating must be an integer between 1 and 5' });
    }

    req.body.text = sanitizeString(text, 500);
    req.body.author = author ? sanitizeString(author, 50) : 'Guest User';

    next();
};

/**
 * Middleware to validate project creation & update payload
 */
export const validateProjectPayload = (req, res, next) => {
    const { customerName, name, price, websiteUrl, status, showInWork, showInClientReviews } = req.body;

    if (req.method === 'POST') {
        if (!customerName || typeof customerName !== 'string' || !customerName.trim()) {
            if (showInClientReviews) {
                return res.status(400).json({ success: false, message: 'Customer name is required for Client Reviews' });
            } else {
                req.body.customerName = 'ZER0ONE';
            }
        }
        if (!name || typeof name !== 'string' || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Project name is required' });
        }
        if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
            return res.status(400).json({ success: false, message: 'Valid non-negative price is required' });
        }
        if (showInWork === false && showInClientReviews === false) {
            return res.status(400).json({ success: false, message: 'Project must be displayed in at least one section' });
        }
    } else if (req.method === 'PUT') {
        if (price !== undefined && (typeof price !== 'number' || price < 0)) {
            return res.status(400).json({ success: false, message: 'Price cannot be negative' });
        }
    }

    if (customerName && customerName.length > 100) {
        return res.status(400).json({ success: false, message: 'Customer name cannot exceed 100 characters' });
    }

    if (name && name.length > 100) {
        return res.status(400).json({ success: false, message: 'Project name cannot exceed 100 characters' });
    }

    if (websiteUrl && !isValidUrl(websiteUrl)) {
        return res.status(400).json({ success: false, message: 'Invalid website URL format' });
    }

    if (status && !['Pending', 'Delivered'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Status must be either Pending or Delivered' });
    }

    if (customerName) req.body.customerName = sanitizeString(customerName, 100);
    if (name) req.body.name = sanitizeString(name, 100);

    next();
};

/**
 * Middleware to validate MongoDB ObjectId route parameter (:id)
 */
export const validateObjectIdParam = (req, res, next) => {
    const { id } = req.params;
    // Allow custom prefix IDs like ZR- request IDs for quotations
    if (id && id.startsWith('ZR-')) {
        return next();
    }
    if (id && !isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'Invalid resource ID format' });
    }
    next();
};

export default {
    validateQuotationPayload,
    validateReviewPayload,
    validateProjectPayload,
    validateObjectIdParam
};
