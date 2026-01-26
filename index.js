require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

// Uvoz svih vaših ruta
const authRouter = require('./routes/auth');
const korisniciRouter = require('./routes/korisnici');
const kurseviRouter = require('./routes/kursevi');
const lekcijeRouter = require('./routes/lekcije');
const wishlistRouter = require('./routes/wishlist');
const kupovinaRouter = require('./routes/kupovina');
const ratingsRouter = require('./routes/ratings');
const komentariRouter = require('./routes/komentari');
const kompletirane_lekcijeRouter = require('./routes/kompletirane_lekcije');
const popustiRouter = require('./routes/popusti');
const rezultatiKvizaRouter = require('./routes/rezultati_kviza');
const sekcijeRouter = require('./routes/sekcije');
// Paddle removed - using MSU/Chipcard payments
const adminRouter = require('./routes/admin');
const msuPaymentRouter = require('./routes/msuPayment');
const subscriptionStatusRouter = require('./routes/subscriptionStatus');
const subscriptionRenewalRouter = require('./routes/subscriptionRenewal');

const app = express();
const port = process.env.PORT || 5000;

// === Middleware ===

// 1. CORS se primenjuje na sve zahteve, pa ide prvi
const allowedOrigins = [
    'https://motionakademija.com',
    'https://api.motionakademija.com',
    'https://localhost:5000',
    'http://localhost:3000'
];
app.use(cors({ origin: allowedOrigins }));

// 3. ZATIM: JSON parser za sve ostale rute
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Sve ostale API rute
app.use('/api/auth', authRouter);
app.use('/api/korisnici', korisniciRouter);
app.use('/api/kursevi', kurseviRouter);
app.use('/api/lekcije', lekcijeRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/kupovina', kupovinaRouter);
app.use('/api/ratings', ratingsRouter);
app.use('/api/komentari', komentariRouter);
app.use('/api/kompletirane_lekcije', kompletirane_lekcijeRouter);
app.use('/api/popusti', popustiRouter);
app.use('/api/rezultati_kviza', rezultatiKvizaRouter);
app.use('/api/sekcije', sekcijeRouter);
// Paddle route removed - using MSU/Chipcard payments via /api/msu
app.use('/api/admin', adminRouter);
app.use('/api/msu', msuPaymentRouter);
app.use('/api/subscription', subscriptionStatusRouter);
app.use('/api/subscription', subscriptionRenewalRouter);

// === Cron Jobs ===
const { startSubscriptionCleanupJob } = require('./jobs/subscriptionCleanup');
const { startAutoRenewalJob } = require('./jobs/autoRenewalCron');

// Start server
const server = app.listen(port, () => {
    console.log(`Server running on port ${port}`);

    // Pokreni subscription cleanup job
    startSubscriptionCleanupJob();

    // Pokreni auto renewal job
    startAutoRenewalJob();
});
server.timeout = 1800000;