/**
 * Input validation and sanitization utility helpers.
 */

// Email regex pattern
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Basic phone number regex pattern (supports international format, spaces, hyphens, plus)
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

// Basic URL validation pattern
const URL_REGEX = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;

export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false;
    return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone) => {
    if (!phone || typeof phone !== 'string') return false;
    return PHONE_REGEX.test(phone.trim());
};

export const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return true; // Optional URLs pass if empty
    return URL_REGEX.test(url.trim());
};

export const sanitizeString = (str, maxLength = 1000) => {
    if (typeof str !== 'string') return '';
    return str.trim().substring(0, maxLength);
};

export const isValidStars = (stars) => {
    const num = Number(stars);
    return Number.isInteger(num) && num >= 1 && num <= 5;
};

export const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') return false;
    return /^[0-9a-fA-F]{24}$/.test(id.trim());
};

export default {
    isValidEmail,
    isValidPhone,
    isValidUrl,
    sanitizeString,
    isValidStars,
    isValidObjectId
};
