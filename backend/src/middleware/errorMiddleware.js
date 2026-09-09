/**
 * Centralized Error Middleware for Express
 */
export const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : (err.status || 500);
    const requestId = req.id || undefined;
    
    // Safe internal server logging with Request ID
    if (process.env.NODE_ENV !== 'production') {
        console.error(`[Error Middleware][${requestId || 'N/A'}] ${err.stack || err.message}`);
    } else {
        console.error(`[Error Middleware][${requestId || 'N/A'}] ${err.name || 'Error'}: ${err.message}`);
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(400).json({
            success: false,
            message: `Duplicate entry for ${field}. Please use a unique value.`,
            requestId
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            success: false,
            message: messages.join(', '),
            requestId
        });
    }

    // Mongoose CastError (invalid ObjectId format)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: `Resource not found or invalid ID format`,
            requestId
        });
    }

    // Sanitize production 500 error messages if generic error
    const message = (process.env.NODE_ENV === 'production' && statusCode === 500)
        ? 'Internal Server Error. Please contact support.'
        : (err.message || 'Internal Server Error');

    res.status(statusCode).json({
        success: false,
        message,
        requestId
    });
};

export default errorHandler;
