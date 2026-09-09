import crypto from 'crypto';

/**
 * Generates a unique, human-readable Request ID for Quotation requests.
 * Format: ZR-2026-XXXX (e.g., ZR-2026-A4F2)
 * Uses crypto random bytes for collision resistance and safe uppercase alphanumeric characters.
 */
export const generateRequestId = () => {
    const year = new Date().getFullYear();
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous characters (0, O, 1, I)
    const length = 4;
    let randomPart = '';
    
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        randomPart += characters[randomBytes[i] % characters.length];
    }
    
    return `ZR-${year}-${randomPart}`;
};

export default generateRequestId;
