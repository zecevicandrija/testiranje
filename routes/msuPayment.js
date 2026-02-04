/**
 * MSU Payment Routes
 * Handles all MSU payment-related endpoints with guest checkout support
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db');
const msuService = require('../utils/msuService');
const generateRandomPassword = require('../utils/passwordGenerator');
const { sendMsuWelcomeEmail } = require('../utils/msuEmailHelper');

/**
 * POST /api/msu/create-session
 * Creates a new MSU payment session - supports both logged-in and guest users
 */
router.post('/create-session', async (req, res) => {
    try {
        const { korisnikId, kursId: reqKursId, customerEmail, customerName, customerPhone, packageData } = req.body;

        // Validacija - samo email i ime su obavezni za guest checkout
        if (!customerEmail || !customerName) {
            return res.status(400).json({
                error: 'Missing required fields: customerEmail, customerName'
            });
        }

        let orderItems = [];
        let totalAmount = 0;
        let itemId = null;
        let itemType = 'course';
        let kursId = reqKursId; // Use let so it can be reassigned for packages

        // Ako je prosleđen kursId, dohvati iz baze
        if (kursId) {
            const [kursevi] = await db.query(
                'SELECT id, naziv, cena, opis FROM kursevi WHERE id = ?',
                [kursId]
            );

            if (kursevi.length === 0) {
                return res.status(404).json({ error: 'Kurs nije pronađen' });
            }

            const kurs = kursevi[0];
            itemId = kurs.id;
            totalAmount = parseFloat(kurs.cena);

            orderItems = [{
                code: kurs.id.toString(),
                name: kurs.naziv,
                description: kurs.opis || kurs.naziv,
                quantity: 1,
                amount: totalAmount
            }];
        }
        // Ako je prosleđen packageData
        else if (packageData) {
            itemId = packageData.id || 'PACKAGE_' + Date.now();
            itemType = 'package';
            totalAmount = parseFloat(packageData.amount);

            // Paketi uvek daju pristup kursu ID=1
            kursId = 1;

            orderItems = [{
                code: packageData.code || itemId,
                name: packageData.name,
                description: packageData.description || packageData.name,
                quantity: 1,
                amount: totalAmount
            }];
        } else {
            return res.status(400).json({
                error: 'Either kursId or packageData is required'
            });
        }

        // Generiši kraći jedinstveni merchantPaymentId (max 20 karaktera za Intesa/Raiffeisen)
        // Format: ORD-{timestamp poslednjih 9 cifara}-{random 3 karaktera}
        // Primer: ORD-173792012-ABC
        const timestamp = Date.now().toString().slice(-9);
        const randomChars = Math.random().toString(36).substring(2, 5).toUpperCase();
        const merchantPaymentId = `ORD-${timestamp}-${randomChars}`;

        // Kreiranje CIT MSU session tokena (za recurring payments)
        const sessionData = {
            customerId: (korisnikId || customerEmail).toString(),
            customerEmail,
            customerName,
            customerPhone: customerPhone || '',
            merchantPaymentId,
            amount: totalAmount,
            orderItems,
            returnUrl: 'https://test-api.zecevicdev.com/api/msu/callback-redirect'
        };

        // Koristi CIT session za automatic recurring payments
        const msuResponse = await msuService.createCITSession(sessionData);

        if (msuResponse.responseCode !== '00') {
            console.error('MSU session creation failed:', msuResponse);
            return res.status(500).json({
                error: 'Kreiranje sesije plaćanja nije uspelo',
                details: msuResponse.responseMsg || 'Unknown error'
            });
        }

        const sessionToken = msuResponse.sessionToken;

        // Sačuvaj transakciju - korisnik_id može biti NULL za guest
        let finalKorisnikId = korisnikId;
        if (!finalKorisnikId) {
            const [existingUsers] = await db.query(
                'SELECT id FROM korisnici WHERE email = ? LIMIT 1',
                [customerEmail]
            );

            if (existingUsers.length > 0) {
                finalKorisnikId = existingUsers[0].id;
                console.log(`Found existing user with email ${customerEmail}, using ID=${finalKorisnikId}`);
            }
        }

        await db.query(
            `INSERT INTO msu_transakcije 
            (korisnik_id, kurs_id, merchant_payment_id, session_token, amount, currency, status, response_code, response_msg, raw_response) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                finalKorisnikId || null,
                kursId,
                merchantPaymentId,
                sessionToken,
                totalAmount,
                'RSD',
                'PENDING',
                msuResponse.responseCode,
                msuResponse.responseMsg,
                JSON.stringify({ customerEmail, customerName, itemType, packageData })
            ]
        );

        const redirectUrl = msuService.buildHppUrl(sessionToken);

        res.status(200).json({
            success: true,
            redirectUrl,
            merchantPaymentId,
            sessionToken
        });

    } catch (error) {
        console.error('Error creating MSU session:', error);
        res.status(500).json({
            error: 'Greška pri kreiranju sesije plaćanja',
            details: error.message
        });
    }
});

/**
 * GET + POST /api/msu/callback-redirect
 * Receives callback from MSU (supports both GET and POST), processes payment, and redirects to frontend
 */
router.all('/callback-redirect', async (req, res) => {
    try {
        // Support both GET (query params) and POST (body) from 3D Secure
        const responseData = { ...req.query, ...req.body };

        console.log('\n========================================');
        console.log('=== MSU CALLBACK REDIRECT RECEIVED ===');
        console.log('========================================');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Method:', req.method);
        console.log('\n--- Request Headers ---');
        console.log(JSON.stringify(req.headers, null, 2));
        console.log('\n--- Query Params ---');
        console.log(JSON.stringify(req.query, null, 2));
        console.log('\n--- Body ---');
        console.log(JSON.stringify(req.body, null, 2));
        console.log('\n--- Merged Response Data ---');
        console.log(JSON.stringify(responseData, null, 2));
        console.log('========================================\n');

        const merchantPaymentId = responseData.merchantPaymentId;
        const responseCode = responseData.responseCode;
        const responseMsg = responseData.responseMsg;

        if (!merchantPaymentId) {
            console.error('❌ Missing merchantPaymentId in callback');
            console.error('Available keys:', Object.keys(responseData));

            // Pokušaj pronaći transakciju po drugim parametrima
            let transaction = null;

            if (responseData.pgTranId) {
                console.log('Attempting to find by pgTranId:', responseData.pgTranId);
                const [txns] = await db.query(
                    'SELECT * FROM msu_transakcije WHERE pg_tran_id = ?',
                    [responseData.pgTranId]
                );
                if (txns.length > 0) transaction = txns[0];
            }

            if (!transaction && responseData.sessionToken) {
                console.log('Attempting to find by sessionToken:', responseData.sessionToken);
                const [txns] = await db.query(
                    'SELECT * FROM msu_transakcije WHERE session_token = ?',
                    [responseData.sessionToken]
                );
                if (txns.length > 0) transaction = txns[0];
            }

            if (!transaction) {
                return res.redirect(`https://localhost:3000/placanje/rezultat?error=missing_payment_id`);
            }

            console.log('✅ Found transaction via fallback method:', transaction.merchant_payment_id);
            // Continue processing with found transaction
        }

        // Pronađi transakciju u bazi
        const [transactions] = await db.query(
            'SELECT * FROM msu_transakcije WHERE merchant_payment_id = ?',
            [merchantPaymentId]
        );

        if (transactions.length === 0) {
            console.error('❌ Transaction not found:', merchantPaymentId);
            console.error('Attempting to query database for similar transactions...');

            // Pokušaj pronaći bilo koju nedavnu pending transakciju
            const [recentTxns] = await db.query(
                `SELECT * FROM msu_transakcije 
                WHERE status = 'PENDING' 
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY created_at DESC 
                LIMIT 5`
            );

            console.log(`Found ${recentTxns.length} recent pending transactions:`);
            recentTxns.forEach(tx => {
                console.log(`  - ${tx.merchant_payment_id} (created: ${tx.created_at})`);
            });

            return res.redirect(`https://localhost:3000/placanje/rezultat?error=transaction_not_found&id=${encodeURIComponent(merchantPaymentId)}`);
        }

        const transaction = transactions[0];
        console.log('✅ Transaction found in database:', {
            id: transaction.id,
            merchantPaymentId: transaction.merchant_payment_id,
            status: transaction.status,
            korisnikId: transaction.korisnik_id
        });

        const status = responseCode === '00' ? 'APPROVED' : 'FAILED';

        // ⚠️ VAŽNO: Merge existing raw_response with new responseData
        // Ne smeš da prepišeš raw_response jer ćeš izgubiti customerEmail, customerName, packageData!
        let existingRawData = {};
        if (transaction.raw_response) {
            if (typeof transaction.raw_response === 'string') {
                try {
                    existingRawData = JSON.parse(transaction.raw_response);
                } catch (err) {
                    console.warn('Failed to parse existing raw_response:', err);
                }
            } else {
                existingRawData = transaction.raw_response;
            }
        }

        // ⚠️ KRITIČNO: Merge OBRNUTO - callback podaci prvo, pa originals preko njih!
        // Ovo osigurava da customerEmail, customerName, packageData NIKAD ne budu overwrite-ovani
        const mergedRawData = {
            ...responseData,      // Callback podaci (pgTranId, cardToken, bankResponseExtras...)
            // Originals overwrite-uju sve što je možda prazno u callback-u
            customerEmail: existingRawData.customerEmail || responseData.customerEmail,
            customerName: existingRawData.customerName || responseData.customerName,
            itemType: existingRawData.itemType,
            packageData: existingRawData.packageData
        };

        console.log('📦 Merged raw_response will contain:', {
            hasCustomerEmail: !!mergedRawData.customerEmail,
            customerEmail: mergedRawData.customerEmail,
            hasCustomerName: !!mergedRawData.customerName,
            customerName: mergedRawData.customerName,
            hasCardToken: !!mergedRawData.cardToken,
            hasBankResponseExtras: !!mergedRawData.bankResponseExtras
        });

        // Ažuriraj transakciju
        await db.query(
            `UPDATE msu_transakcije 
            SET pg_tran_id = ?, pg_order_id = ?, pg_tran_appr_code = ?, 
                status = ?, response_code = ?, response_msg = ?, 
                raw_response = ?, updated_at = NOW()
            WHERE merchant_payment_id = ?`,
            [
                responseData.pgTranId || null,
                responseData.pgOrderId || null,
                responseData.pgTranApprCode || null,
                status,
                responseCode,
                responseMsg,
                JSON.stringify(mergedRawData),  // ✅ Merge-ovani podaci
                merchantPaymentId
            ]
        );

        // Ako je plaćanje uspešno
        if (status === 'APPROVED') {
            let userId = transaction.korisnik_id;

            // Ako je guest checkout (korisnik_id je NULL)
            if (!userId) {
                try {
                    // ✅ Koristi mergedRawData koji je upravo kreiran i ima sve podatke
                    const customerEmail = mergedRawData.customerEmail;
                    const customerName = mergedRawData.customerName || 'Korisnik';

                    console.log('🔍 Processing guest checkout for:', customerEmail);

                    if (customerEmail) {
                        // Proveri da li user već postoji
                        const [existing] = await db.query(
                            'SELECT id FROM korisnici WHERE email = ?',
                            [customerEmail]
                        );

                        if (existing.length > 0) {
                            userId = existing[0].id;
                            console.log(`✅ Existing user found: ID=${userId}`);

                            // Ažuriraj subscription za postojećeg korisnika
                            const now = new Date();
                            let subscriptionMonths = 1;

                            if (mergedRawData.packageData && mergedRawData.packageData.id) {
                                if (mergedRawData.packageData.id.includes('3M')) {
                                    subscriptionMonths = 3;
                                } else if (mergedRawData.packageData.id.includes('1M')) {
                                    subscriptionMonths = 1;
                                }
                            }

                            const expiryDate = new Date(now);
                            expiryDate.setMonth(expiryDate.getMonth() + subscriptionMonths);

                            await db.query(
                                'UPDATE korisnici SET subscription_expires_at = ?, subscription_status = ? WHERE id = ?',
                                [expiryDate, 'active', userId]
                            );

                            console.log(`✅ Subscription extended to: ${expiryDate.toISOString()}`);
                        } else {
                            // Kreiraj novog korisnika
                            const password = generateRandomPassword();
                            const hashedPassword = await bcrypt.hash(password, 10);
                            const [ime, ...prezimeParts] = customerName.split(/\s+/);
                            const prezime = prezimeParts.join(' ') || ime;

                            // Izračunaj datum isteka pretplate
                            const now = new Date();
                            let subscriptionMonths = 1; // Default 1 mesec

                            // Provjeri package podatke da odrediš trajanje
                            if (mergedRawData.packageData && mergedRawData.packageData.id) {
                                // STANDARD_1M = 1 mesec, PRO_3M = 3 meseca
                                if (mergedRawData.packageData.id.includes('3M')) {
                                    subscriptionMonths = 3;
                                } else if (mergedRawData.packageData.id.includes('1M')) {
                                    subscriptionMonths = 1;
                                }
                            }

                            const expiryDate = new Date(now);
                            expiryDate.setMonth(expiryDate.getMonth() + subscriptionMonths);

                            const [insertRes] = await db.query(
                                `INSERT INTO korisnici (ime, prezime, email, sifra, uloga, subscription_expires_at, subscription_status) 
                                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                                [ime, prezime, customerEmail, hashedPassword, 'korisnik', expiryDate, 'active']
                            );

                            userId = insertRes.insertId;

                            // VAŽNO: Ispis passworda i subscription info u konzolu
                            console.log('========================================');
                            console.log('✅ NEW USER CREATED:');
                            console.log(`   ID: ${userId}`);
                            console.log(`   Email: ${customerEmail}`);
                            console.log(`   Password: ${password}`);
                            console.log(`   Subscription Expires: ${expiryDate.toISOString()}`);
                            console.log(`   Duration: ${subscriptionMonths} month(s)`);
                            console.log('========================================');

                            // Pošalji welcome email sa šifrom
                            try {
                                console.log('📧 Attempting to send welcome email...');
                                console.log(`   To: ${customerEmail}`);
                                console.log(`   Name: ${ime}`);
                                console.log(`   Has RESEND_API_KEY: ${!!process.env.RESEND_API_KEY}`);

                                const emailResult = await sendMsuWelcomeEmail(customerEmail, password, ime);

                                if (emailResult) {
                                    console.log(`✅ Welcome email sent successfully to ${customerEmail}`);
                                } else {
                                    console.warn(`⚠️ Email function returned false for ${customerEmail}`);
                                }
                            } catch (emailErr) {
                                console.error('❌ Failed to send welcome email:');
                                console.error('   Error:', emailErr.message);
                                console.error('   Stack:', emailErr.stack);
                            }
                        }

                        // Ažuriraj transakciju sa korisnikId
                        await db.query(
                            'UPDATE msu_transakcije SET korisnik_id = ? WHERE merchant_payment_id = ?',
                            [userId, merchantPaymentId]
                        );
                    }
                } catch (userCreationErr) {
                    console.error('❌ Error creating user from guest checkout:', userCreationErr);
                }
            }

            // ✅ VAŽNO: Ažuriraj subscription za SVE korisnike (nove i postojeće)
            if (userId && transaction.kurs_id) {
                try {
                    // Odredi trajanje subscription-a iz mergedRawData
                    let subscriptionMonths = 1; // Default 1 mesec

                    if (mergedRawData.packageData && mergedRawData.packageData.id) {
                        if (mergedRawData.packageData.id.includes('3M')) {
                            subscriptionMonths = 3;
                        } else if (mergedRawData.packageData.id.includes('1M')) {
                            subscriptionMonths = 1;
                        }
                    }

                    // Izračunaj novi datum isteka
                    const now = new Date();
                    const expiryDate = new Date(now);
                    expiryDate.setMonth(expiryDate.getMonth() + subscriptionMonths);

                    // Ažuriraj subscription za korisnika
                    await db.query(
                        'UPDATE korisnici SET subscription_expires_at = ?, subscription_status = ? WHERE id = ?',
                        [expiryDate, 'active', userId]
                    );

                    console.log('========================================');
                    console.log('✅ SUBSCRIPTION EXTENDED:');
                    console.log(`   User ID: ${userId}`);
                    console.log(`   New Expiry: ${expiryDate.toISOString()}`);
                    console.log(`   Duration: ${subscriptionMonths} month(s)`);
                    console.log('========================================');

                } catch (subscriptionErr) {
                    console.error('❌ Error extending subscription:', subscriptionErr);
                }
            }

            // Dodaj kurs u kupovine ako postoji korisnik i kurs
            if (userId && transaction.kurs_id) {
                try {
                    await db.query(
                        'INSERT INTO kupovina (korisnik_id, kurs_id, popust_id) VALUES (?, ?, ?)',
                        [userId, transaction.kurs_id, null]
                    );
                    console.log(`✅ Course added to purchases: user_id=${userId}, kurs_id=${transaction.kurs_id}`);
                } catch (purchaseErr) {
                    if (purchaseErr.code !== 'ER_DUP_ENTRY') {
                        console.warn('Failed to add purchase:', purchaseErr.message);
                    }
                }
            }


            // ✅ NOVO: Kreiraj recurring subscription entry za automatsko produžavanje
            console.log('\n🔍 DEBUG: Checking for recurring subscription creation...');
            console.log(`   userId: ${userId}`);
            console.log(`   responseData.cardToken: ${responseData.cardToken ? 'EXISTS' : 'MISSING'}`);
            console.log(`   responseData keys: ${Object.keys(responseData).join(', ')}`);

            if (userId && responseData.cardToken) {
                console.log('✅ Both userId and cardToken present - proceeding...');
                try {
                    // Izvuci traceID iz bankResponseExtras
                    let traceID = null;
                    console.log(`   bankResponseExtras type: ${typeof responseData.bankResponseExtras}`);
                    console.log(`   bankResponseExtras value: ${JSON.stringify(responseData.bankResponseExtras)}`);

                    if (responseData.bankResponseExtras) {
                        let bankExtras;
                        if (typeof responseData.bankResponseExtras === 'string') {
                            try {
                                // VAŽNO: Prvo dekoduj URL-encoded string, pa onda parsuj JSON
                                const decodedExtras = decodeURIComponent(responseData.bankResponseExtras);
                                console.log(`   Decoded bankResponseExtras: ${decodedExtras}`);
                                bankExtras = JSON.parse(decodedExtras);
                            } catch (parseErr) {
                                console.warn('Failed to parse bankResponseExtras:', parseErr);
                                bankExtras = {};
                            }
                        } else {
                            bankExtras = responseData.bankResponseExtras;
                        }

                        console.log(`   Parsed bankExtras: ${JSON.stringify(bankExtras)}`);
                        traceID = bankExtras.TRACEID || null;
                        console.log(`   Extracted traceID: ${traceID}`);
                    }

                    if (traceID) {
                        console.log('✅ TraceID found - creating recurring subscription...');

                        // Koristi mergedRawData za subscription podatke
                        let subscriptionMonths = 1;
                        if (mergedRawData.packageData && mergedRawData.packageData.id) {
                            if (mergedRawData.packageData.id.includes('3M')) {
                                subscriptionMonths = 3;
                            } else if (mergedRawData.packageData.id.includes('1M')) {
                                subscriptionMonths = 1;
                            }
                        }

                        // Izračunaj next billing date
                        const now = new Date();
                        const nextBillingDate = new Date(now);
                        nextBillingDate.setMonth(nextBillingDate.getMonth() + subscriptionMonths);

                        // Proveri da li već postoji recurring subscription za ovog korisnika
                        const [existingRecurring] = await db.query(
                            'SELECT id FROM recurring_subscriptions WHERE korisnik_id = ? AND is_active = 1',
                            [userId]
                        );

                        if (existingRecurring.length === 0) {
                            // Kreiraj recurring subscription
                            await db.query(
                                `INSERT INTO recurring_subscriptions 
                                (korisnik_id, kurs_id, card_token, trace_id, amount, currency, 
                                frequency, occurrence, subscription_months, is_active, next_billing_date, last_billing_date) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                                [
                                    userId,
                                    transaction.kurs_id,
                                    responseData.cardToken,
                                    traceID,
                                    transaction.amount,
                                    transaction.currency || 'RSD',
                                    1, // frequency
                                    'MONTH', // occurrence
                                    subscriptionMonths,
                                    1, // is_active = true
                                    nextBillingDate
                                ]
                            );

                            console.log('========================================');
                            console.log('✅ RECURRING SUBSCRIPTION CREATED:');
                            console.log(`   User ID: ${userId}`);
                            console.log(`   Card Token: ${responseData.cardToken.substring(0, 10)}...`);
                            console.log(`   Trace ID: ${traceID}`);
                            console.log(`   Next Billing: ${nextBillingDate.toISOString()}`);
                            console.log('========================================');
                        } else {
                            console.log(`⚠️ Recurring subscription already exists for user ${userId}`);
                        }
                    } else {
                        console.warn('⚠️ TraceID not found in response - skipping recurring subscription creation');
                        console.warn('   This means bankResponseExtras did not contain TRACEID field');
                    }
                } catch (recurringErr) {
                    console.error('❌ Error creating recurring subscription:', recurringErr);
                }
            } else {
                console.warn('⚠️ Skipping recurring subscription creation:');
                if (!userId) console.warn('   - userId is missing');
                if (!responseData.cardToken) console.warn('   - cardToken is missing from response');
            }


            // Redirect na profil stranicu
            return res.redirect(`https://localhost:3000/profil?payment=success`);
        } else {
            // Plaćanje nije uspelo
            return res.redirect(`https://localhost:3000/placanje/rezultat?merchantPaymentId=${merchantPaymentId}&status=failed&message=${encodeURIComponent(responseMsg)}`);
        }

    } catch (error) {
        console.error('Error handling MSU callback redirect:', error);
        return res.redirect(`https://localhost:3000/placanje/rezultat?error=server_error`);
    }
});

/**
 * POST /api/msu/callback
 * MSU Notification Service callback (server-to-server)
 * This is different from callback-redirect which is browser-based
 */
router.post('/callback', async (req, res) => {
    try {
        console.log('\n========================================');
        console.log('=== MSU NOTIFICATION CALLBACK ===');
        console.log('========================================');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Body:', JSON.stringify(req.body, null, 2));
        console.log('========================================\n');

        const {
            merchantBusinessId,
            status,
            merchantPaymentId,
            amount,
            notificationType,
            transactionType,
            pgTransactionId,
            customer
        } = req.body;

        if (!merchantPaymentId) {
            console.error('❌ Missing merchantPaymentId in notification callback');
            return res.status(400).json({ error: 'merchantPaymentId is required' });
        }

        console.log(`📥 Notification: ${notificationType} for ${merchantPaymentId}`);

        // Pronađi transakciju
        const [transactions] = await db.query(
            'SELECT * FROM msu_transakcije WHERE merchant_payment_id = ?',
            [merchantPaymentId]
        );

        if (transactions.length === 0) {
            console.error(`❌ Transaction not found: ${merchantPaymentId}`);
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = transactions[0];
        console.log(`✅ Found transaction ID: ${transaction.id}`);

        // Ažuriraj status transakcije
        const msuStatus = status === 'AP' ? 'APPROVED' : 'FAILED';
        await db.query(
            `UPDATE msu_transakcije 
            SET pg_tran_id = ?, status = ?, raw_response = ?, updated_at = NOW()
            WHERE merchant_payment_id = ?`,
            [
                pgTransactionId,
                msuStatus,
                JSON.stringify(req.body),
                merchantPaymentId
            ]
        );

        console.log(`✅ Transaction ${merchantPaymentId} updated to status: ${msuStatus}`);

        // Vrati success response serveru MSU
        return res.status(200).json({ success: true, message: 'Notification received' });

    } catch (error) {
        console.error('❌ Error handling MSU notification callback:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/msu/status/:merchantPaymentId
 * Check the status of a payment transaction
 */
router.get('/status/:merchantPaymentId', async (req, res) => {
    try {
        const { merchantPaymentId } = req.params;

        const [transactions] = await db.query(
            `SELECT t.*, k.naziv as kurs_naziv 
            FROM msu_transakcije t
            LEFT JOIN kursevi k ON t.kurs_id = k.id
            WHERE t.merchant_payment_id = ?`,
            [merchantPaymentId]
        );

        if (transactions.length === 0) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transaction = transactions[0];

        res.status(200).json({
            success: true,
            transaction: {
                merchantPaymentId: transaction.merchant_payment_id,
                status: transaction.status,
                amount: transaction.amount,
                currency: transaction.currency,
                kursNaziv: transaction.kurs_naziv,
                responseCode: transaction.response_code,
                responseMsg: transaction.response_msg,
                createdAt: transaction.created_at,
                updatedAt: transaction.updated_at
            }
        });

    } catch (error) {
        console.error('Error checking payment status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
