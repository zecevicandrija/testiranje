/**
 * Ostale Schemas - Validacione šeme za komentari, ratings, kupovina,
 * kompletirane_lekcije, popusti, rezultati_kviza, sekcije
 */

const { z } = require('zod');

// =============================================
// POST /api/komentari
// =============================================
const createKomentarSchema = z.object({
    korisnik_id: z.number({ invalid_type_error: 'korisnik_id mora biti broj.' })
        .int()
        .positive('korisnik_id mora biti pozitivan broj.'),

    kurs_id: z.number({ invalid_type_error: 'kurs_id mora biti broj.' })
        .int()
        .positive('kurs_id mora biti pozitivan broj.'),

    komentar: z.string()
        .trim()
        .min(1, 'Komentar je obavezan.')
        .max(2000, 'Komentar ne sme biti duži od 2000 karaktera.'),

    rating: z.number({ invalid_type_error: 'Rating mora biti broj.' })
        .int()
        .min(1, 'Ocena mora biti najmanje 1.')
        .max(5, 'Ocena ne sme biti veća od 5.')
        .optional()
        .nullable()
}).strict();

// =============================================
// POST /api/ratings
// =============================================
const createRatingSchema = z.object({
    korisnik_id: z.number({ invalid_type_error: 'korisnik_id mora biti broj.' })
        .int()
        .positive('korisnik_id mora biti pozitivan broj.'),

    kurs_id: z.number({ invalid_type_error: 'kurs_id mora biti broj.' })
        .int()
        .positive('kurs_id mora biti pozitivan broj.'),

    ocena: z.number({ invalid_type_error: 'Ocena mora biti broj.' })
        .int()
        .min(1, 'Ocena mora biti između 1 i 5.')
        .max(5, 'Ocena mora biti između 1 i 5.')
}).strict();

// =============================================
// POST /api/kupovina (admin)
// =============================================
const createKupovinaSchema = z.object({
    korisnik_id: z.number({ invalid_type_error: 'korisnik_id mora biti broj.' })
        .int()
        .positive(),

    kurs_id: z.number({ invalid_type_error: 'kurs_id mora biti broj.' })
        .int()
        .positive(),

    popust_id: z.number({ invalid_type_error: 'popust_id mora biti broj.' })
        .int()
        .positive()
        .optional()
        .nullable()
}).strict();

// =============================================
// POST /api/kompletirane_lekcije
// =============================================
const completeLekcijaSchema = z.object({
    korisnik_id: z.number({ invalid_type_error: 'korisnik_id mora biti broj.' })
        .int()
        .positive(),

    kurs_id: z.number({ invalid_type_error: 'kurs_id mora biti broj.' })
        .int()
        .positive(),

    lekcija_id: z.number({ invalid_type_error: 'lekcija_id mora biti broj.' })
        .int()
        .positive()
}).strict();

// =============================================
// DELETE /api/kompletirane_lekcije
// =============================================
const uncompleteLekcijaSchema = z.object({
    korisnik_id: z.number({ invalid_type_error: 'korisnik_id mora biti broj.' })
        .int()
        .positive(),

    lekcija_id: z.number({ invalid_type_error: 'lekcija_id mora biti broj.' })
        .int()
        .positive()
}).strict();

// =============================================
// POST /api/popusti/create
// =============================================
const createPopustSchema = z.object({
    code: z.string()
        .trim()
        .min(1, 'Kod je obavezan.')
        .max(50, 'Kod ne sme biti duži od 50 karaktera.'),

    discountPercent: z.number({ invalid_type_error: 'Popust mora biti broj.' })
        .min(1, 'Popust mora biti najmanje 1%.')
        .max(100, 'Popust ne sme biti veći od 100%.'),

    datum_isteka: z.string().optional().nullable(),
    
    status: z.enum(['aktivan', 'neaktivan']).optional().default('aktivan')
}).strict();

// =============================================
// PUT /api/popusti/:id
// =============================================
const updatePopustSchema = z.object({
    code: z.string()
        .trim()
        .min(1, 'Kod je obavezan.')
        .max(50, 'Kod ne sme biti duži od 50 karaktera.')
        .optional(),

    discountPercent: z.number({ invalid_type_error: 'Popust mora biti broj.' })
        .min(1, 'Popust mora biti najmanje 1%.')
        .max(100, 'Popust ne sme biti veći od 100%.')
        .optional(),

    datum_isteka: z.string().optional().nullable(),
    
    status: z.enum(['aktivan', 'neaktivan']).optional()
}).strict();

// =============================================
// POST /api/popusti/apply & /api/popusti/validate
// =============================================
const applyPopustSchema = z.object({
    code: z.string()
        .trim()
        .min(1, 'Kod za popust je obavezan.')
        .max(50, 'Kod ne sme biti duži od 50 karaktera.')
}).strict();

// =============================================
// POST /api/rezultati_kviza/submit
// =============================================
const submitKvizSchema = z.object({
    user_id: z.number({ invalid_type_error: 'user_id mora biti broj.' })
        .int()
        .positive(),

    lesson_id: z.number({ invalid_type_error: 'lesson_id mora biti broj.' })
        .int()
        .positive(),

    quiz_id: z.number({ invalid_type_error: 'quiz_id mora biti broj.' })
        .int()
        .positive(),

    score: z.number({ invalid_type_error: 'score mora biti broj.' })
        .int()
        .min(0, 'Score ne sme biti negativan.'),

    total_questions: z.number({ invalid_type_error: 'total_questions mora biti broj.' })
        .int()
        .positive('total_questions mora biti pozitivan broj.')
}).strict();

// =============================================
// POST /api/sekcije - Kreiranje sekcije
// =============================================
const createSekcijaSchema = z.object({
    kurs_id: z.number({ invalid_type_error: 'kurs_id mora biti broj.' })
        .int()
        .positive(),

    naziv: z.string()
        .trim()
        .min(1, 'Naziv sekcije je obavezan.')
        .max(255, 'Naziv ne sme biti duži od 255 karaktera.'),

    thumbnail: z.string()
        .url('Thumbnail mora biti validan URL.')
        .max(255)
        .optional()
        .nullable()
}).strict();

// =============================================
// PUT /api/sekcije/:id - Ažuriranje sekcije
// =============================================
const updateSekcijaSchema = z.object({
    naziv: z.string()
        .trim()
        .min(1, 'Naziv sekcije je obavezan.')
        .max(255, 'Naziv ne sme biti duži od 255 karaktera.'),

    thumbnail: z.string()
        .url('Thumbnail mora biti validan URL.')
        .max(255)
        .optional()
        .nullable()
}).strict();

// =============================================
// PUT /api/sekcije/order - Redosled sekcija
// =============================================
const orderSekcijeSchema = z.object({
    orderedIds: z.array(
        z.number({ invalid_type_error: 'Svaki ID mora biti broj.' }).int().positive()
    ).min(1, 'Niz ID-jeva ne sme biti prazan.')
}).strict();

// =============================================
// POST /api/msu/create-session
// =============================================
const createMsuSessionSchema = z.object({
    korisnikId: z.number()
        .int()
        .positive()
        .optional()
        .nullable(),

    kursId: z.number()
        .int()
        .positive()
        .optional()
        .nullable(),

    customerEmail: z.string()
        .trim()
        .email('Neispravan email format.'),

    customerName: z.string()
        .trim()
        .min(1, 'Ime kupca je obavezno.')
        .max(200, 'Ime kupca ne sme biti duže od 200 karaktera.'),

    customerPhone: z.string()
        .max(30, 'Broj telefona ne sme biti duži od 30 karaktera.')
        .optional()
        .nullable(),

    packageData: z.object({
        id: z.string().max(100).optional(),
        code: z.string().max(100).optional(),
        name: z.string().max(200),
        description: z.string().max(500).optional(),
        amount: z.union([z.number(), z.string()])
    }).optional()
        .nullable()
}).strict();

module.exports = {
    createKomentarSchema,
    createRatingSchema,
    createKupovinaSchema,
    completeLekcijaSchema,
    uncompleteLekcijaSchema,
    createPopustSchema,
    updatePopustSchema,
    applyPopustSchema,
    submitKvizSchema,
    createSekcijaSchema,
    updateSekcijaSchema,
    orderSekcijeSchema,
    createMsuSessionSchema
};
