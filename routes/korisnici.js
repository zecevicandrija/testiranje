const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/token');
const requireAdmin = require('../middleware/requireAdmin');
const { validate } = require('../middleware/validate');
const { createKorisnikSchema, updateKorisnikSchema } = require('../validators/korisniciSchemas');

// Endpoint za dobavljanje svih korisnika (SAMO ADMIN)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
    try {
        // Iz bezbednosnih razloga, nikada ne šaljemo lozinke na frontend
        const query = 'SELECT id, ime, prezime, email, uloga, subscription_expires_at, subscription_status FROM korisnici';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

// Endpoint za dodavanje novog korisnika (SAMO ADMIN)
router.post('/', authMiddleware, requireAdmin, validate(createKorisnikSchema), async (req, res) => {
    const { ime, prezime, email, sifra, uloga, subscription_expires_at, subscription_status } = req.body;

    try {

        const hashedPassword = await bcrypt.hash(sifra, 10);
        
        const query = 'INSERT INTO korisnici (ime, prezime, email, sifra, uloga, subscription_expires_at, subscription_status) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [results] = await db.query(query, [
            ime, prezime, email, hashedPassword, uloga,
            subscription_expires_at || null,
            subscription_status || 'active'
        ]);
        
        res.status(201).json({ message: 'Korisnik uspešno dodat', userId: results.insertId });
    } catch (error) {
        // Bolje rukovanje greškom ako email već postoji
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Korisnik sa datim email-om već postoji.' });
        }
        console.error('Greška u bazi podataka:', error);
        res.status(500).json({ error: 'Greška na serveru' });
    }
});

// Endpoint za ažuriranje korisnika (ADMIN ili vlasnik profila)
router.put('/:id', authMiddleware, validate(updateKorisnikSchema), async (req, res) => {
    try {
        const userId = req.params.id;

        // Proveravamo da li je korisnik admin ili ažurira svoj profil
        if (req.user.uloga !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ message: 'Nemate dozvolu za ovu akciju. Potrebna je admin uloga ili da ažurirate sopstveni profil.' });
        }

        const { ime, prezime, email, sifra, subscription_expires_at, subscription_status } = req.body;

        const fieldsToUpdate = {};

        // Proveravamo svako polje i dodajemo ga u objekat za ažuriranje samo ako postoji
        if (ime) fieldsToUpdate.ime = ime;
        if (prezime) fieldsToUpdate.prezime = prezime;
        
        // Email i pretplatu može da menja samo admin
        if (req.user.uloga === 'admin') {
            if (email) fieldsToUpdate.email = email;
            if (subscription_expires_at !== undefined) fieldsToUpdate.subscription_expires_at = subscription_expires_at;
            if (subscription_status !== undefined) fieldsToUpdate.subscription_status = subscription_status;
        }
        
        // Lozinku hešujemo samo ako je poslata nova
        if (sifra) {
            fieldsToUpdate.sifra = await bcrypt.hash(sifra, 10);
        }

        // Ako nijedno polje nije poslato za ažuriranje, vraćamo grešku
        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ message: 'Nema podataka za ažuriranje.' });
        }

        // Dinamički kreiramo SQL upit
        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const queryValues = Object.values(fieldsToUpdate);

        const query = `UPDATE korisnici SET ${setClauses} WHERE id = ?`;
        queryValues.push(userId); // Dodajemo ID korisnika na kraj parametara

        const [results] = await db.query(query, queryValues);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: `Korisnik sa ID-jem ${userId} nije pronađen.` });
        }

        res.status(200).json({ message: `Profil korisnika je uspešno ažuriran.` });

    } catch (error) {
        console.error('Database error during update:', error);
        res.status(500).json({ error: 'Greška na serveru.' });
    }
});


// Endpoint za brisanje korisnika (SAMO ADMIN)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    const connection = await db.getConnection();
    try {
        const userId = req.params.id;
        
        await connection.beginTransaction();

        // Brisanje povezanih podataka prvo
        await connection.query('DELETE FROM msu_transakcije WHERE korisnik_id = ?', [userId]);
        await connection.query('DELETE FROM recurring_subscriptions WHERE korisnik_id = ?', [userId]);
        await connection.query('DELETE FROM kupovina WHERE korisnik_id = ?', [userId]);

        const query = 'DELETE FROM korisnici WHERE id = ?';
        const [results] = await connection.query(query, [userId]);

        // Proveravamo da li je red uopšte obrisan
        if (results.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ message: `Korisnik sa ID-jem ${userId} nije pronađen.` });
        }

        await connection.commit();
        res.status(200).json({ message: `Korisnik sa ID-jem ${userId} uspešno obrisan.` });
    } catch (err) {
        await connection.rollback();
        console.error('Database error:', err);
        res.status(500).json({ error: 'Greška na serveru' });
    } finally {
        connection.release();
    }
});

module.exports = router;