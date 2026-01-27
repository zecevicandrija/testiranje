/**
 * Auto Renewal Cron Job
 * Runs daily to automatically renew subscriptions using MIT transactions
 */

const cron = require('node-cron');
const db = require('../db');
const msuService = require('../utils/msuService');
const { sendSubscriptionRenewalEmail, sendSubscriptionPaymentFailedEmail } = require('../utils/msuEmailHelper');

/**
 * Process a single subscription renewal
 */
async function processRenewal(subscription) {
    const {
        id: subscriptionId,
        korisnik_id: userId,
        kurs_id: kursId,
        card_token: cardToken,
        trace_id: traceID,
        amount: rawAmount,  // Dolazi kao string iz MySQL-a
        subscription_months: subscriptionMonths
    } = subscription;

    // VAŽNO: Parsiraj amount u Number jer MySQL vraća DECIMAL kao string
    const amount = parseFloat(rawAmount);

    console.log(`\n🔄 Processing renewal for subscription ID: ${subscriptionId}, User ID: ${userId}`);
    console.log(`   Amount to charge: ${amount} (type: ${typeof amount})`);

    try {
        // Dohvati korisnika
        const [users] = await db.query(
            'SELECT id, ime, email FROM korisnici WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            console.error(`❌ User not found: ${userId}`);
            return;
        }

        const user = users[0];

        // Generiši unique merchantPaymentId za renewal
        const merchantPaymentId = `RENEW_${Date.now()}_${userId}_${subscriptionId}`;

        // Pozovi MIT SALE API
        const mitResponse = await msuService.executeMITSale({
            customerId: userId.toString(),
            merchantPaymentId,
            amount,  // Sada je Number
            cardToken,
            traceID
        });

        console.log('MIT Response:', JSON.stringify(mitResponse, null, 2));

        // Proveri da li je naplata uspela
        if (mitResponse.responseCode === '00') {
            // ✅ Uspešna naplata
            console.log(`✅ Payment SUCCESS for user ${userId}`);

            // Sačuvaj MIT transakciju u bazi
            await db.query(
                `INSERT INTO msu_transakcije 
                (korisnik_id, kurs_id, merchant_payment_id, pg_tran_id, pg_order_id, 
                pg_tran_appr_code, amount, currency, status, response_code, response_msg, raw_response) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    kursId,
                    merchantPaymentId,
                    mitResponse.pgTranId || null,
                    mitResponse.pgOrderId || null,
                    mitResponse.pgTranApprCode || null,
                    amount,
                    'RSD',
                    'APPROVED',
                    mitResponse.responseCode,
                    mitResponse.responseMsg,
                    JSON.stringify(mitResponse)
                ]
            );

            // Produži subscription_expires_at
            const now = new Date();
            const newExpiryDate = new Date(now);
            newExpiryDate.setMonth(newExpiryDate.getMonth() + subscriptionMonths);

            await db.query(
                'UPDATE korisnici SET subscription_expires_at = ?, subscription_status = ? WHERE id = ?',
                [newExpiryDate, 'active', userId]
            );

            // Ažuriraj recurring_subscriptions
            const nextBillingDate = new Date(newExpiryDate);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + subscriptionMonths);

            await db.query(
                `UPDATE recurring_subscriptions 
                SET last_billing_date = NOW(), next_billing_date = ?, updated_at = NOW() 
                WHERE id = ?`,
                [nextBillingDate, subscriptionId]
            );

            console.log('========================================');
            console.log('✅ SUBSCRIPTION RENEWED:');
            console.log(`   User: ${user.email}`);
            console.log(`   New Expiry: ${newExpiryDate.toISOString()}`);
            console.log(`   Next Billing: ${nextBillingDate.toISOString()}`);
            console.log(`   Amount: ${amount} RSD`);
            console.log('========================================');

            // Pošalji email korisniku
            try {
                await sendSubscriptionRenewalEmail(
                    user.email,
                    user.ime,
                    newExpiryDate,
                    amount
                );
                console.log(`✅ Renewal email sent to ${user.email}`);
            } catch (emailErr) {
                console.warn('⚠️ Failed to send renewal email:', emailErr);
            }

        } else {
            // ❌ Neuspešna naplata
            console.error(`❌ Payment FAILED for user ${userId}: ${mitResponse.responseMsg}`);

            // Sačuvaj failed transakciju
            await db.query(
                `INSERT INTO msu_transakcije 
                (korisnik_id, kurs_id, merchant_payment_id, amount, currency, status, response_code, response_msg, raw_response) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    kursId,
                    merchantPaymentId,
                    amount,
                    'RSD',
                    'FAILED',
                    mitResponse.responseCode,
                    mitResponse.responseMsg,
                    JSON.stringify(mitResponse)
                ]
            );

            // Ažuriraj subscription_status na payment_failed
            await db.query(
                'UPDATE korisnici SET subscription_status = ? WHERE id = ?',
                ['payment_failed', userId]
            );

            // Deaktiviraj recurring subscription nakon failed payment
            await db.query(
                'UPDATE recurring_subscriptions SET is_active = 0, updated_at = NOW() WHERE id = ?',
                [subscriptionId]
            );

            console.log(`⚠️ Subscription deactivated for user ${userId}`);

            // Pošalji email sa upozorenjem
            try {
                await sendSubscriptionPaymentFailedEmail(user.email, user.ime);
                console.log(`✅ Payment failed email sent to ${user.email}`);
            } catch (emailErr) {
                console.warn('⚠️ Failed to send payment failed email:', emailErr);
            }
        }

    } catch (error) {
        console.error(`❌ Error processing renewal for subscription ${subscriptionId}:`, error);

        // Pokušaj deaktivirati subscription zbog greške
        try {
            await db.query(
                'UPDATE recurring_subscriptions SET is_active = 0, updated_at = NOW() WHERE id = ?',
                [subscriptionId]
            );
            await db.query(
                'UPDATE korisnici SET subscription_status = ? WHERE id = ?',
                ['payment_failed', userId]
            );
        } catch (updateErr) {
            console.error('Failed to update subscription after error:', updateErr);
        }
    }
}

/**
 * Main cron job function - runs daily
 */
async function runAutoRenewalJob() {
    console.log('\n========================================');
    console.log('🕐 AUTO RENEWAL JOB STARTED');
    console.log(`   Time: ${new Date().toISOString()}`);
    console.log('========================================\n');

    try {
        // Pronađi sve recurring subscriptions koje treba da se renewal-uju
        const [subscriptions] = await db.query(
            `SELECT * FROM recurring_subscriptions 
            WHERE is_active = 1 
            AND next_billing_date <= NOW()
            ORDER BY next_billing_date ASC`
        );

        console.log(`📊 Found ${subscriptions.length} subscription(s) due for renewal\n`);

        if (subscriptions.length === 0) {
            console.log('✅ No subscriptions to process');
            return;
        }

        // Process each subscription sequentially
        for (const subscription of subscriptions) {
            await processRenewal(subscription);

            // Wait 2 seconds between renewals to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        console.log('\n========================================');
        console.log('✅ AUTO RENEWAL JOB COMPLETED');
        console.log(`   Processed: ${subscriptions.length} subscription(s)`);
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error in auto renewal job:', error);
    }
}

/**
 * Start the cron job
 * Runs every day at 3:00 AM
 */
function startAutoRenewalJob() {
    // Cron format: second minute hour day month weekday
    // '32 15 * * *' = Every day at 15:32 (3:32 PM)
    const cronSchedule = '51 17 * * *';

    console.log('🕐 Auto Renewal Cron Job initialized');
    console.log(`   Schedule: Every day at 15:32 (3:32 PM)`);
    console.log(`   Cron: ${cronSchedule}\n`);

    cron.schedule(cronSchedule, () => {
        runAutoRenewalJob();
    });

    // Za testiranje: Opciono pokreni odmah kada server startuje
    // Odkomentiraj sledeću liniju ako želiš da testiraš
    // setTimeout(() => runAutoRenewalJob(), 5000); // Run after 5 seconds
}

module.exports = {
    startAutoRenewalJob,
    runAutoRenewalJob // Export za manuelno testiranje
};
