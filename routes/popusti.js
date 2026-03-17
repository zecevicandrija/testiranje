const express = require('express');
const router = express.Router();
const db = require('../db');
const { validate } = require('../middleware/validate');
const authMiddleware = require('../middleware/token');
const requireAdmin = require('../middleware/requireAdmin');
const { createPopustSchema, updatePopustSchema, applyPopustSchema } = require('../validators/ostaleSchemas');

// Endpoint for applying a discount code (sada je zastareo, /validate je bolji)
router.post('/apply', validate(applyPopustSchema), async (req, res) => {
    try {
        const { code } = req.body;
        const query = 'SELECT procenat FROM popusti WHERE kod = ?';
        const [results] = await db.query(query, [code]);

        if (results.length === 0) {
            return res.status(404).json({ valid: false, message: 'Kod za popust nije pronađen.' });
        }
        res.status(200).json({ valid: true, discountPercent: results[0].procenat });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Endpoint for getting all discount codes (ADMIN ONLY)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const query = 'SELECT * FROM popusti ORDER BY id DESC';
        const [results] = await db.query(query);
        res.status(200).json(results);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Greška pri povlačenju popusta.' });
    }
});

// Endpoint for creating a discount code (ADMIN ONLY)
router.post('/create', authMiddleware, requireAdmin, validate(createPopustSchema), async (req, res) => {
    try {
        const { code, discountPercent, datum_isteka, status } = req.body;

        const query = 'INSERT INTO popusti (kod, procenat, datum_isteka, status) VALUES (?, ?, ?, ?)';
        await db.query(query, [code, discountPercent, datum_isteka || null, status || 'aktivan']);

        res.status(201).json({ success: true, message: 'Popust kod je uspešno kreiran.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Ovaj kod za popust već postoji.' });
        }
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Greška pri kreiranju popusta' });
    }
});

// Endpoint for updating a discount code (ADMIN ONLY)
router.put('/:id', authMiddleware, requireAdmin, validate(updatePopustSchema), async (req, res) => {
    try {
        const discountId = req.params.id;
        const { code, discountPercent, datum_isteka, status } = req.body;

        const fieldsToUpdate = {};
        if (code) fieldsToUpdate.kod = code;
        if (discountPercent) fieldsToUpdate.procenat = discountPercent;
        if (datum_isteka !== undefined) fieldsToUpdate.datum_isteka = datum_isteka;
        if (status) fieldsToUpdate.status = status;

        if (Object.keys(fieldsToUpdate).length === 0) {
            return res.status(400).json({ success: false, message: 'Nema podataka za ažuriranje.' });
        }

        const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const queryValues = Object.values(fieldsToUpdate);
        
        const query = `UPDATE popusti SET ${setClauses} WHERE id = ?`;
        queryValues.push(discountId);

        const [results] = await db.query(query, queryValues);

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: `Popust sa ID-jem ${discountId} nije pronađen.` });
        }

        res.status(200).json({ success: true, message: 'Popust je uspešno ažuriran.' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ success: false, message: 'Popust sa ovim kodom već postoji.' });
        }
        console.error('Database error during update:', error);
        res.status(500).json({ success: false, message: 'Greška na serveru.' });
    }
});

// Endpoint for deleting a discount code (ADMIN ONLY)
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
    try {
        const discountId = req.params.id;
        const query = 'DELETE FROM popusti WHERE id = ?';
        const [results] = await db.query(query, [discountId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ success: false, message: `Popust sa ID-jem ${discountId} nije pronađen.` });
        }

        res.status(200).json({ success: true, message: 'Popust je uspešno obrisan.' });
    } catch (error) {
        // Obično popusti mogu biti vezani za kupovine, ako imamo foreign key constraints onda bi to palo
        // Ako postoji foreign key CONSTRAINT, treba handle-ovati ER_ROW_IS_REFERENCED_2
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ success: false, message: 'Ne možete obrisati ovaj popust jer je već korišćen u kupovinama. Umesto brisanja, razmislite o izmeni koda.' });
        }
        console.error('Database error:', error);
        res.status(500).json({ success: false, message: 'Greška pri brisanju popusta.' });
    }
});

// Endpoint for validating a discount code
router.post('/validate', validate(applyPopustSchema), async (req, res) => {
    try {
        const { code } = req.body;

        const query = 'SELECT * FROM popusti WHERE kod = ?';
        const [results] = await db.query(query, [code.trim().toUpperCase()]);

        if (results.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Neispravan kod za popust.'
            });
        }

        const discount = results[0];

        if (discount.status === 'neaktivan') {
            return res.status(400).json({
                success: false,
                message: 'Ovaj kod za popust nije više aktivan.'
            });
        }

        if (discount.datum_isteka && new Date(discount.datum_isteka) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Ovaj kod za popust je istekao.'
            });
        }

        res.json({
            success: true,
            discountPercent: discount.procenat,
            discountId: discount.id,
            code: discount.kod
        });

    } catch (error) {
        console.error('Error validating discount code:', error);
        res.status(500).json({ success: false, message: 'Greška pri validaciji koda.' });
    }
});

module.exports = router;