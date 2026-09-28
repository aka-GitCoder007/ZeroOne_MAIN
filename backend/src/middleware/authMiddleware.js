import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const VALID_ADMIN_ROLES = [
    'super_admin',
    'admin',
    'innovation_manager',
    'client_review_manager',
    'catalog_manager'
];

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

        if (!VALID_ADMIN_ROLES.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: Valid administrative role required'
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

/**
 * Authorize middleware factory: Restricts route access to specific roles.
 * super_admin and admin always bypass role restriction.
 */
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }

        const role = req.user.role;

        if (role === 'super_admin' || role === 'admin') {
            return next();
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions'
            });
        }

        next();
    };
};

export default {
    protectAdmin,
    authorizeRoles
};
