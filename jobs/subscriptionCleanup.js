/**
 * Subscription Cleanup Cron Job
 * 
 * SVRHA: Jednom dnevno ažurira subscription_status za sve korisnike
 *        kojima je istekla pretplata
 * 
 * KADA SE POKREĆE: Svaki dan u 00:00 (ponoć)
 * 
 * ŠTA RADI:
 * 1. Pronalazi sve korisnike gde je subscription_expires_at < trenutni datum
 * 2. Ažurira njihov subscription_status sa 'active' na 'expired'
 * 3. Loguje koliko je korisnika ažurirano
 * 
 * NAPOMENA: Ovo je POMOĆNA funkcija - glavna provera se dešava u middleware-u!
 *           Ovaj job samo održava bazu u čistom stanju.
 */

const cron = require('node-cron');
const db = require('../db');

function startSubscriptionCleanupJob() {
    // Pokreće se svaki dan u 00:00
    // Format: '0 0 * * *' = minuta sat dan mesec dan_u_nedelji
    cron.schedule('0 0 * * *', async () => {
        try {
            console.log('🕐 Running daily subscription cleanup job...');

            // Ažuriraj sve istekle subscription-e
            const [result] = await db.query(`
                UPDATE korisnici 
                SET subscription_status = 'expired' 
                WHERE subscription_expires_at < NOW() 
                AND subscription_status = 'active'
            `);

            const updatedCount = result.affectedRows;

            if (updatedCount > 0) {
                console.log(`✅ Subscription cleanup: ${updatedCount} user(s) marked as expired`);
            } else {
                console.log('✅ Subscription cleanup: No expired subscriptions found');
            }

            // Dodatno: Loguj korisnike kojima ističe pretplata u sledećih 3 dana
            const [expiringUsers] = await db.query(`
                SELECT id, email, subscription_expires_at 
                FROM korisnici 
                WHERE subscription_expires_at BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 3 DAY)
                AND subscription_status = 'active'
            `);

            if (expiringUsers.length > 0) {
                console.log(`⚠️  ${expiringUsers.length} user(s) expiring in next 3 days:`);
                expiringUsers.forEach(user => {
                    console.log(`   - ${user.email} expires at ${user.subscription_expires_at}`);
                });
                // TODO: Ovde možeš dodati slanje email notifikacija
            }

        } catch (error) {
            console.error('❌ Error in subscription cleanup job:', error);
        }
    });

    console.log('✅ Subscription cleanup cron job started (runs daily at 00:00)');
}

module.exports = { startSubscriptionCleanupJob };
