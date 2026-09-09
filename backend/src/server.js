import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import errorHandler from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy — required for Render.com (and similar reverse proxies)
// Uses 'loopback' in dev, 1 hop in production (Render's single-layer proxy)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Security Middleware
app.use(helmet());


// Request Correlation ID Middleware
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] || `REQ-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    req.id = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
});

const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URL?.replace(/\/$/, ''),
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin or explicitly allowed origins
        if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
            return callback(null, true);
        }
        if (process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error('CORS policy violation: Origin not allowed.'));
    },
    credentials: true
}));

// General API Rate Limiting (100 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', generalLimiter);

// Body Parser Middleware (Max 5MB limit for base64 project image payloads)
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Database Connection
connectDB();

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'ZER0ONE API is running smoothly',
        timestamp: new Date().toISOString()
    });
});

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);

// Central Error Handler Middleware
app.use(errorHandler);

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('HTTP server closed.');
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed cleanly.');
            process.exit(0);
        } catch (err) {
            console.error('Error closing MongoDB connection:', err.message);
            process.exit(1);
        }
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
