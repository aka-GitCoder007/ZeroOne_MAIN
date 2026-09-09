import crypto from 'crypto';

/**
 * Payment Service for handling Razorpay payments architecture.
 * Environment variables: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 */

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        console.warn('[PaymentService] Razorpay keys missing in environment configuration.');
        // Returns structured order object for schema setup/testing
        return {
            id: `order_${Date.now()}_mock`,
            amount: amount * 100, // Razorpay works in paise
            currency,
            receipt: receipt || `rcpt_${Date.now()}`,
            status: 'created',
            isMock: true
        };
    }

    // When Razorpay SDK or direct REST API integration is called with active keys:
    // Razorpay API endpoint: https://api.razorpay.com/v1/orders
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    try {
        const response = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
            },
            body: JSON.stringify({
                amount: amount * 100,
                currency,
                receipt: receipt || `rcpt_${Date.now()}`
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Razorpay Order API failed: ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (err) {
        console.error('[PaymentService] Error creating Razorpay order:', err.message);
        throw err;
    }
};

/**
 * Verifies Razorpay payment signature securely using HMAC SHA256.
 */
export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
        console.warn('[PaymentService] RAZORPAY_KEY_SECRET missing. Unable to perform real signature verification.');
        return false;
    }

    const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    return generatedSignature === signature;
};

export default {
    createRazorpayOrder,
    verifyRazorpaySignature
};
