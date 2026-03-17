/**
 * Korisnici Schemas - Validacione šeme za korisnici rute
 * 
 * Pokriva: /api/korisnici (POST, PUT)
 */

const { z } = require('zod');

// =============================================
// POST /api/korisnici - Kreiranje korisnika (admin)
// =============================================
const createKorisnikSchema = z.object({
    ime: z.string()
        .trim()
        .min(1, 'Ime je obavezno.')
        .max(255, 'Ime ne sme biti duže od 255 karaktera.'),

    prezime: z.string()
        .trim()
        .min(1, 'Prezime je obavezno.')
        .max(255, 'Prezime ne sme biti duže od 255 karaktera.'),

    email: z.string()
        .trim()
        .toLowerCase()
        .email('Neispravan email format.')
        .max(100, 'Email ne sme biti duži od 100 karaktera.'),

    sifra: z.string()
        .min(6, 'Šifra mora imati najmanje 6 karaktera.')
        .max(255, 'Šifra ne sme biti duža od 255 karaktera.'),

    uloga: z.enum(['korisnik', 'admin', 'instruktor'], {
        errorMap: () => ({ message: 'Uloga mora biti "korisnik", "admin" ili "instruktor".' })
    }),

    subscription_expires_at: z.string()
        .refine((val) => !isNaN(new Date(val).getTime()), {
            message: 'Neispravan datum format za subscription_expires_at.'
        })
        .optional()
        .nullable(),

    subscription_status: z.enum(['active', 'expired', 'cancelled', 'payment_failed'], {
        errorMap: () => ({ message: 'Status mora biti "active", "expired", "cancelled" ili "payment_failed".' })
    }).optional()
}).strict();

// =============================================
// PUT /api/korisnici/:id - Ažuriranje korisnika (admin)
// =============================================
const updateKorisnikSchema = z.object({
    ime: z.string()
        .trim()
        .min(1, 'Ime ne sme biti prazan string.')
        .max(255, 'Ime ne sme biti duže od 255 karaktera.')
        .optional(),

    prezime: z.string()
        .trim()
        .min(1, 'Prezime ne sme biti prazan string.')
        .max(255, 'Prezime ne sme biti duže od 255 karaktera.')
        .optional(),

    email: z.string()
        .trim()
        .toLowerCase()
        .email('Neispravan email format.')
        .max(100)
        .optional(),

    sifra: z.string()
        .min(6, 'Šifra mora imati najmanje 6 karaktera.')
        .max(255, 'Šifra ne sme biti duža od 255 karaktera.')
        .optional(),

    subscription_expires_at: z.string()
        .refine((val) => !val || !isNaN(new Date(val).getTime()), {
            message: 'Neispravan datum format za subscription_expires_at.'
        })
        .optional()
        .nullable(),

    subscription_status: z.enum(['active', 'expired', 'cancelled', 'payment_failed']).optional()
}).strict();

module.exports = {
    createKorisnikSchema,
    updateKorisnikSchema
};
