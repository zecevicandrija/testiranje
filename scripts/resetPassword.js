require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const db = require('../db');
const generateRandomPassword = require('../utils/passwordGenerator');

const TARGET_EMAIL = 'zecevicdev@gmail.com';

async function resetPassword() {
    console.log('----------------------------------------');
    console.log('🔐 Password Reset Script');
    console.log('----------------------------------------');

    try {
        // 1. Generate new password
        const newPassword = generateRandomPassword(12);
        console.log(`Generated new password: ${newPassword}`);

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // 3. Update database
        console.log(`Updating password for user: ${TARGET_EMAIL}...`);

        const [result] = await db.query(
            'UPDATE korisnici SET sifra = ? WHERE email = ?',
            [hashedPassword, TARGET_EMAIL]
        );

        if (result.affectedRows === 0) {
            console.error('❌ User not found!');
            console.log('Please check the email address and try again.');
        } else {
            console.log('✅ Password successfully updated in database!');
            console.log('----------------------------------------');
            console.log('USER:', TARGET_EMAIL);
            console.log('NEW PASSWORD:', newPassword);
            console.log('----------------------------------------');
            console.log('Please copy this password immediately.');
        }

    } catch (error) {
        console.error('❌ Error resetting password:', error);
    } finally {
        // Close database connection
        // Note: db.js exports a pool, so we end it to exit the script
        await db.end();
        process.exit();
    }
}

resetPassword();
