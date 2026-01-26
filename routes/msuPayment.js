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

        // Generiši jedinstveni merchantPaymentId
        const customerIdentifier = korisnikId || customerEmail;
        const merchantPaymentId = `ORDER_${Date.now()}_${Buffer.from(String(customerIdentifier)).toString('base64').substring(0, 10)}_${itemId}`;

        // Kreiranje CIT MSU session tokena (za recurring payments)
        const sessionData = {
            customerId: (korisnikId || customerEmail).toString(),
            customerEmail,
            customerName,
            customerPhone: customerPhone || '',
            merchantPaymentId,
            amount: totalAmount,
            orderItems,
            returnUrl: 'https://api.motionakademija.com/api/msu/callback-redirect'
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
 * POST /api/msu/callback-redirect
 * Receives POST callback from MSU, processes payment, and redirects to frontend
 */
router.post('/callback-redirect', async (req, res) => {
    try {
        const responseData = req.body;
        console.log('=== MSU Callback Redirect received ===');
        console.log('Response data:', JSON.stringify(responseData, null, 2));

        const merchantPaymentId = responseData.merchantPaymentId;
        const responseCode = responseData.responseCode;
        const responseMsg = responseData.responseMsg;

        if (!merchantPaymentId) {
            console.error('Missing merchantPaymentId in callback');
            return res.redirect(`https://motionakademija.com/placanje/rezultat?error=missing_payment_id`);
        }

        // Pronađi transakciju u bazi
        const [transactions] = await db.query(
            'SELECT * FROM msu_transakcije WHERE merchant_payment_id = ?',
            [merchantPaymentId]
        );

        if (transactions.length === 0) {
            console.error('Transaction not found:', merchantPaymentId);
            return res.redirect(`https://motionakademija.com/placanje/rezultat?error=transaction_not_found`);
        }

        const transaction = transactions[0];
        const status = responseCode === '00' ? 'APPROVED' : 'FAILED';

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
                JSON.stringify(responseData),
                merchantPaymentId
            ]
        );

        // Ako je plaćanje uspešno
        if (status === 'APPROVED') {
            let userId = transaction.korisnik_id;

            // Ako je guest checkout (korisnik_id je NULL)
            if (!userId) {
                try {
                    // raw_response može biti objekat ili JSON string
                    let rawData;
                    if (typeof transaction.raw_response === 'string') {
                        rawData = JSON.parse(transaction.raw_response);
                    } else {
                        rawData = transaction.raw_response || {};
                    }
                    const customerEmail = rawData.customerEmail;
                    const customerName = rawData.customerName || 'Korisnik';

                    console.log('Processing guest checkout for:', customerEmail);

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

                            if (rawData.packageData && rawData.packageData.id) {
                                if (rawData.packageData.id.includes('3M')) {
                                    subscriptionMonths = 3;
                                } else if (rawData.packageData.id.includes('1M')) {
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
                            if (rawData.packageData && rawData.packageData.id) {
                                // STANDARD_1M = 1 mesec, PRO_3M = 3 meseca
                                if (rawData.packageData.id.includes('3M')) {
                                    subscriptionMonths = 3;
                                } else if (rawData.packageData.id.includes('1M')) {
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
                                await sendMsuWelcomeEmail(customerEmail, password, ime);
                                console.log(`✅ Welcome email sent to ${customerEmail}`);
                            } catch (emailErr) {
                                console.warn('⚠️ Failed to send welcome email:', emailErr);
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
                    // Dohvati package podatke iz raw_response
                    let rawData;
                    if (typeof transaction.raw_response === 'string') {
                        rawData = JSON.parse(transaction.raw_response);
                    } else {
                        rawData = transaction.raw_response || {};
                    }

                    // Odredi trajanje subscription-a
                    let subscriptionMonths = 1; // Default 1 mesec

                    if (rawData.packageData && rawData.packageData.id) {
                        if (rawData.packageData.id.includes('3M')) {
                            subscriptionMonths = 3;
                        } else if (rawData.packageData.id.includes('1M')) {
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

                        // Dohvati subscription podatke
                        let rawData;
                        if (typeof transaction.raw_response === 'string') {
                            rawData = JSON.parse(transaction.raw_response);
                        } else {
                            rawData = transaction.raw_response || {};
                        }

                        let subscriptionMonths = 1;
                        if (rawData.packageData && rawData.packageData.id) {
                            if (rawData.packageData.id.includes('3M')) {
                                subscriptionMonths = 3;
                            } else if (rawData.packageData.id.includes('1M')) {
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
            return res.redirect(`https://motionakademija.com/profil?payment=success`);
        } else {
            // Plaćanje nije uspelo
            return res.redirect(`https://motionakademija.com/placanje/rezultat?merchantPaymentId=${merchantPaymentId}&status=failed&message=${encodeURIComponent(responseMsg)}`);
        }

    } catch (error) {
        console.error('Error handling MSU callback redirect:', error);
        return res.redirect(`https://motionakademija.com/placanje/rezultat?error=server_error`);
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
