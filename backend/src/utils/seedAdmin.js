import bcrypt from 'bcryptjs';
import User from '../models/User.js';

/**
 * Ensures at least one admin user exists in MongoDB.
 * If no user exists, creates a default admin account based on env vars or defaults.
 */
export const seedAdminUser = async () => {
    try {
        const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminPassword) {
            if (process.env.NODE_ENV === 'production') {
                console.error('[SeedAdmin] CRITICAL: ADMIN_PASSWORD env var is missing in production mode. Skipping admin creation.');
                return;
            }
            console.warn('[SeedAdmin] WARNING: ADMIN_PASSWORD not set in env. Using default development password.');
        }

        const effectivePassword = adminPassword || 'admin123';
        const existingAdmin = await User.findOne({ username: adminUsername });
        
        if (!existingAdmin) {
            const passwordHash = await bcrypt.hash(effectivePassword, 10);
            await User.create({
                username: adminUsername,
                passwordHash,
                role: 'admin'
            });
            console.log(`[SeedAdmin] Admin user created: Username="${adminUsername}"`);
        } else {
            console.log(`[SeedAdmin] Admin user "${adminUsername}" already exists.`);
        }
    } catch (error) {
        console.error('[SeedAdmin] Error seeding admin user:', error.message);
    }
};

export default seedAdminUser;
