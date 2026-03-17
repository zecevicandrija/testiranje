const express = require('express');
const router = express.Router();
const db = require('../db');
const { cacheMiddleware, invalidateCache } = require('../middleware/cacheMiddleware');
const { validate } = require('../middleware/validate');
const { completeLekcijaSchema, uncompleteLekcijaSchema } = require('../validators/ostaleSchemas');
const authMiddleware = require('../middleware/token');

// Endpoint za dobavljanje završenih lekcija po korisniku (keširano 60s)
router.get('/korisnik/:korisnikId', authMiddleware, cacheMiddleware(60), async (req, res) => {
    try {
        const korisnikId = req.params.korisnikId;

        // Dozvola samo za vlasnika ili admina
        if (req.user.uloga !== 'admin' && req.user.id !== parseInt(korisnikId)) {
            return res.status(403).json({ error: 'Zabranjen pristup. Možete videti samo sopstvene lekcije.' });
        }

        const query = 'SELECT * FROM kompletirane_lekcije WHERE korisnik_id = ?';
        const [results] = await db.query(query, [korisnikId]);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint za dodavanje nove završenog lekcije
router.post('/', authMiddleware, validate(completeLekcijaSchema), async (req, res) => {
    try {
        const { korisnik_id, kurs_id, lekcija_id } = req.body;

        // Dozvola samo za vlasnika ili admina
        if (req.user.uloga !== 'admin' && req.user.id !== parseInt(korisnik_id)) {
            return res.status(403).json({ error: 'Zabranjen pristup. Možete menjati samo sopstveni progres.' });
        }

        // Provera da li je lekcija već kompletirana da se ne duplira unos
        const checkQuery = 'SELECT id FROM kompletirane_lekcije WHERE korisnik_id = ? AND lekcija_id = ?';
        const [existing] = await db.query(checkQuery, [korisnik_id, lekcija_id]);

        if (existing.length > 0) {
            return res.status(409).json({ message: 'Lekcija je već obeležena kao završena.' });
        }

        const insertQuery = 'INSERT INTO kompletirane_lekcije (korisnik_id, kurs_id, lekcija_id) VALUES (?, ?, ?)';
        const [results] = await db.query(insertQuery, [korisnik_id, kurs_id, lekcija_id]);
        
        res.status(201).json({ message: 'Lekcija uspešno dodata', kompletiranaLekcijaId: results.insertId });
        invalidateCache('/api/kompletirane_lekcije'); // Obriši keš
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// === NOVA RUTA ZA BRISANJE (UN-CHECK) ===
// Briše zapis na osnovu korisnika i lekcije
router.delete('/', authMiddleware, validate(uncompleteLekcijaSchema), async (req, res) => {
    try {
        const { korisnik_id, lekcija_id } = req.body;

        // Dozvola samo za vlasnika ili admina
        if (req.user.uloga !== 'admin' && req.user.id !== parseInt(korisnik_id)) {
            return res.status(403).json({ error: 'Zabranjen pristup. Možete menjati samo sopstveni progres.' });
        }

        const query = 'DELETE FROM kompletirane_lekcije WHERE korisnik_id = ? AND lekcija_id = ?';
        const [results] = await db.query(query, [korisnik_id, lekcija_id]);

        if (results.affectedRows === 0) {
            // Nije greška ako zapis ne postoji, možda je korisnik brzo kliknuo dva puta.
            // Vraćamo uspeh jer je stanje na kraju ono što je korisnik želeo (lekcija nije kompletirana).
            return res.status(200).json({ message: 'Zapis nije pronađen ili je već obrisan.' });
        }

        res.status(200).json({ message: 'Lekcija uspešno obeležena kao nezavršena.' });
        invalidateCache('/api/kompletirane_lekcije'); // Obriši keš
    } catch (err) {
        console.error('Database error on un-complete:', err);
        res.status(500).json({ error: 'Greška na serveru prilikom brisanja progresa.' });
    }
});

// Endpoint za dobavljanje završenih lekcija po korisniku i kursu (keširano 60s)
router.get('/user/:korisnikId/course/:kursId', authMiddleware, cacheMiddleware(60), async (req, res) => {
    try {
        const { korisnikId, kursId } = req.params;

        // Dozvola samo za vlasnika ili admina
        if (req.user.uloga !== 'admin' && req.user.id !== parseInt(korisnikId)) {
            return res.status(403).json({ error: 'Zabranjen pristup. Možete videti samo sopstvene lekcije.' });
        }

        const query = 'SELECT lekcija_id FROM kompletirane_lekcije WHERE korisnik_id = ? AND kurs_id = ?';
        const [results] = await db.query(query, [korisnikId, kursId]);
        // Vraćamo samo niz ID-jeva lekcija radi efikasnosti na frontendu
        const lekcijeIds = results.map(item => item.lekcija_id);
        res.status(200).json(lekcijeIds);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});


module.exports = router;