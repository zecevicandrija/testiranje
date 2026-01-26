/**
 * Subscription Renewal Routes
 * Handles automatic subscription renewal, cancellation, and management
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/token');

/**
 * GET /api/subscription/details/:userId
 * Get recurring subscription details for a user
 */
router.get('/details/:userId', authMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Security check: korisnici mogu videti samo svoju pretplatu
        if (req.user.id !== parseInt(userId) && req.user.uloga !== 'admin') {
            return res.status(403).json({ error: 'Nemate dozvolu za pristup ovim podacima' });
        }

        const [subscriptions] = await db.query(
            `SELECT rs.*, k.naziv as kurs_naziv
            FROM recurring_subscriptions rs
            LEFT JOIN kursevi k ON rs.kurs_id = k.id
            WHERE rs.korisnik_id = ?
            ORDER BY rs.created_at DESC
            LIMIT 1`,
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.json({
                hasRecurring: false,
                message: 'Nemate aktivnu recurring pretplatu'
            });
        }

        const subscription = subscriptions[0];

        res.json({
            hasRecurring: true,
            subscription: {
                id: subscription.id,
                kursNaziv: subscription.kurs_naziv,
                amount: subscription.amount,
                currency: subscription.currency,
                frequency: subscription.frequency,
                occurrence: subscription.occurrence,
                subscriptionMonths: subscription.subscription_months,
                isActive: subscription.is_active === 1,
                nextBillingDate: subscription.next_billing_date,
                lastBillingDate: subscription.last_billing_date,
                createdAt: subscription.created_at
            }
        });

    } catch (error) {
        console.error('Error fetching subscription details:', error);
        res.status(500).json({ error: 'Greška pri učitavanju detalja pretplate' });
    }
});

/**
 * POST /api/subscription/cancel
 * Cancel automatic subscription renewal
 */
router.post('/cancel', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Pronađi aktivnu recurring subscription
        const [subscriptions] = await db.query(
            'SELECT * FROM recurring_subscriptions WHERE korisnik_id = ? AND is_active = 1',
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({
                error: 'Nema aktivne recurring pretplate za otkazivanje'
            });
        }

        const subscription = subscriptions[0];

        // Deaktiviraj recurring subscription
        await db.query(
            'UPDATE recurring_subscriptions SET is_active = 0, updated_at = NOW() WHERE id = ?',
            [subscription.id]
        );

        // Ažuriraj status u korisnici tabeli
        await db.query(
            'UPDATE korisnici SET subscription_status = ? WHERE id = ?',
            ['cancelled', userId]
        );

        console.log(`✅ Subscription cancelled for user ID: ${userId}`);

        res.json({
            success: true,
            message: 'Automatsko produžavanje je uspešno otkazano. Zadržaćete pristup do isteka trenutne pretplate.',
            subscription: {
                isActive: false,
                cancelledAt: new Date()
            }
        });

    } catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({ error: 'Greška pri otkazivanju pretplate' });
    }
});

/**
 * POST /api/subscription/reactivate
 * Reactivate cancelled subscription
 */
router.post('/reactivate', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Pronađi otkazanu recurring subscription
        const [subscriptions] = await db.query(
            'SELECT * FROM recurring_subscriptions WHERE korisnik_id = ? AND is_active = 0',
            [userId]
        );

        if (subscriptions.length === 0) {
            return res.status(404).json({
                error: 'Nema otkazane pretplate za reaktivaciju'
            });
        }

        const subscription = subscriptions[0];

        // Reaktiviraj subscription
        await db.query(
            'UPDATE recurring_subscriptions SET is_active = 1, updated_at = NOW() WHERE id = ?',
            [subscription.id]
        );

        // Ažuriraj status u korisnici tabeli
        await db.query(
            'UPDATE korisnici SET subscription_status = ? WHERE id = ?',
            ['active', userId]
        );

        console.log(`✅ Subscription reactivated for user ID: ${userId}`);

        res.json({
            success: true,
            message: 'Automatsko produžavanje je ponovo aktivirano!',
            subscription: {
                isActive: true,
                nextBillingDate: subscription.next_billing_date
            }
        });

    } catch (error) {
        console.error('Error reactivating subscription:', error);
        res.status(500).json({ error: 'Greška pri reaktivaciji pretplate' });
    }
});

module.exports = router;
