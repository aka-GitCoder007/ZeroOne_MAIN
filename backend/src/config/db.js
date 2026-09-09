import mongoose from 'mongoose';
import seedAdminUser from '../utils/seedAdmin.js';

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.warn('WARNING: MONGODB_URI is not defined in environment variables. Database connection skipped.');
            return;
        }
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`MongoDB connected successfully to database "${mongoose.connection.name}"`);
        
        // Auto-seed default admin account if not present
        await seedAdminUser();
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        console.warn('Please make sure your MONGODB_URI in .env is valid and accessible');
    }
};

export default connectDB;
