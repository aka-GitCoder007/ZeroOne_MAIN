import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * @route   POST /api/v1/auth/login
 * @desc    Admin login & get token
 * @access  Public
 */
export const login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both username and password'
            });
        }

        // Find user by username (include passwordHash)
        const user = await User.findOne({ username: username.toLowerCase().trim() }).select('+passwordHash');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password match
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error('[AuthController] CRITICAL: JWT_SECRET environment variable is missing.');
            return res.status(500).json({
                success: false,
                message: 'Server authentication configuration error'
            });
        }
        const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '1d';

        const token = jwt.sign(
            { id: user._id, role: user.role },
            jwtSecret,
            { expiresIn: jwtExpiresIn }
        );

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user._id,
                    username: user.username,
                    role: user.role
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user info
 * @access  Private (Admin)
 */
export const getMe = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Authenticated user fetched successfully',
            data: {
                user: req.user
            }
        });
    } catch (error) {
        next(error);
    }
};

export default {
    login,
    getMe
};
