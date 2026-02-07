/**
 * Subscription Check Middleware
 * Proverava da li korisnik ima aktivnu pretplatu pre pristupa zaštićenim rutama
 */

const db = require('../db');

/**
 * Middleware koji proverava subscription status
 * Poziva se NA SVAKOM ZAHTEVU za zaštićene rute
 * 
 * Provera se dešava u realnom vremenu:
 * - Ako je subscription_expires_at < trenutni datum → blokira pristup
 * - Ako je subscription_status !== 'active' → blokira pristup
 */
async function checkSubscription(req, res, next) {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Morate biti ulogovani'
            });
        }

        // Dohvati fresh subscription podatke iz baze
        const [users] = await db.query(
            'SELECT id, subscription_expires_at, subscription_status FROM korisnici WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                error: 'User not found',
                message: 'Korisnik nije pronađen'
            });
        }

        const user = users[0];

        // Provera 1: Da li uopšte ima subscription
        if (!user.subscription_expires_at) {
            return res.status(403).json({
                error: 'No active subscription',
                message: 'Nemate aktivnu pretplatu. Molimo vas da kupite pristup.',
                subscriptionStatus: 'none',
                redirectTo: '/paket'
            });
        }

        // Provera 2: Da li je subscription istekao (REALNO VREME PROVERA)
        const now = new Date();
        const expiryDate = new Date(user.subscription_expires_at);

        if (expiryDate < now) {
            // Subscription je istekao - automatski ažuriraj status ako već nije
            if (user.subscription_status !== 'expired') {
                await db.query(
                    'UPDATE korisnici SET subscription_status = ? WHERE id = ?',
                    ['expired', userId]
                );
            }

            return res.status(403).json({
                error: 'Subscription expired',
                message: `Vaša pretplata je istekla ${expiryDate.toLocaleDateString('sr-RS')}. Molimo vas da obnovite pristup.`,
                subscriptionStatus: 'expired',
                expiredAt: expiryDate.toISOString(),
                redirectTo: '/paket'
            });
        }

        // Provera 3: Da li je subscription status aktivan
        // 'cancelled' dozvoljava pristup do datuma isteka - samo 'expired' i 'payment_failed' blokiraju
        if (user.subscription_status === 'expired' || user.subscription_status === 'payment_failed') {
            return res.status(403).json({
                error: 'Subscription not active',
                message: `Vaša pretplata nije aktivna (status: ${user.subscription_status}). Molimo obnovite pristup.`,
                subscriptionStatus: user.subscription_status,
                redirectTo: '/produzivanje'
            });
        }

        // SVE JE OK - korisnik može nastaviti
        // Dodaj subscription info na request za dalje korišćenje
        req.subscription = {
            expiresAt: expiryDate,
            status: user.subscription_status,
            daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
        };

        next();

    } catch (error) {
        console.error('Error checking subscription:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Greška pri proveri pretplate'
        });
    }
}

module.exports = checkSubscription;
