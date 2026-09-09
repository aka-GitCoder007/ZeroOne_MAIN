import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Protect middleware: Verifies JWT bearer token and attaches user to request object.
 */
export const protectAdmin = async (req, res, next) => {
    try {
        let token;
        
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token provided'
            });
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('[AuthMiddleware] CRITICAL: JWT_SECRET environment variable is missing.');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error'
            });
        }
        const decoded = jwt.verify(token, jwtSecret);

        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User associated with token no longer exists'
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Admin role required'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized, token validation failed'
        });
    }
};

export default {
    protectAdmin
};
