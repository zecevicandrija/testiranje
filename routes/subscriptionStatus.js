/**
 * Subscription Status Routes
 * Simple endpoint to check and update subscription status
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/token');

/**
 * GET /api/subscription/status
 * Checks user's subscription status and auto-updates if expired
 */
router.get('/status', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Dohvati subscription podatke
        const [users] = await db.query(
            'SELECT id, subscription_expires_at, subscription_status FROM korisnici WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Proveri da li je subscription istekao
        if (user.subscription_expires_at) {
            const now = new Date();
            const expiryDate = new Date(user.subscription_expires_at);

            if (expiryDate < now && user.subscription_status !== 'expired') {
                // Automatski ažuriraj status na 'expired'
                await db.query(
                    'UPDATE korisnici SET subscription_status = ? WHERE id = ?',
                    ['expired', userId]
                );

                console.log(`✅ Auto-updated subscription status to 'expired' for user ID: ${userId}`);

                return res.json({
                    subscriptionStatus: 'expired',
                    expiresAt: user.subscription_expires_at,
                    isActive: false
                });
            }

            // Subscription je aktivan
            return res.json({
                subscriptionStatus: user.subscription_status,
                expiresAt: user.subscription_expires_at,
                isActive: user.subscription_status === 'active' && expiryDate > now
            });
        }

        // Nema subscription-a
        return res.json({
            subscriptionStatus: 'none',
            expiresAt: null,
            isActive: false
        });

    } catch (error) {
        console.error('Error checking subscription status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
