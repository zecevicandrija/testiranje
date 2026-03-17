/**
 * ============================================================
 * LOAD TEST: 100 korisnika koji koriste kurseve
 * ============================================================
 * 
 * Simulira 100 istovremenih korisnika koji:
 * 1. Gledaju sekcije kursa
 * 2. Proveravaju svoj progres
 * 3. Proveravaju kompletirane lekcije
 *
 * NE TESTIRA: Kupovinu, plaćanje, admin operacije
 * 
 * BEZBEDAN TEST: Koristi samo GET zahteve osim za token refresh
 * i completirane lekcije (koje se odmah brišu nakon testa)
 * 
 * Pokretanje: node scripts/load-test.js
 * 
 * Podešavanja:
 *   --users=50      Broj virtuelnih korisnika (default: 100)
 *   --duration=60   Trajanje testa u sekundama (default: 120)
 *   --rampup=10     Sekunde za postepeno dodavanje korisnika (default: 15)
 *   --url=https://test-api.zecevicdev.com  API base URL
 */

const http = require('http');
const https = require('https');

// ============================================================
// KONFIGURACIJA
// ============================================================
const args = process.argv.slice(2).reduce((acc, arg) => {
    const [key, val] = arg.replace('--', '').split('=');
    acc[key] = val;
    return acc;
}, {});

const CONFIG = {
    BASE_URL: args.url || 'https://test-api.zecevicdev.com',
    NUM_USERS: parseInt(args.users) || 100,
    TEST_DURATION_SEC: parseInt(args.duration) || 120,
    RAMP_UP_SEC: parseInt(args.rampup) || 15,
    // Simulacija: svaki korisnik čeka 2-5 sekundi između zahteva (realno ponašanje)
    MIN_THINK_TIME_MS: 2000,
    MAX_THINK_TIME_MS: 5000,
    // Pretpostavljeni kurs/lekcija ID-jevi (moraju postojati u bazi)
    COURSE_IDS: [1, 2, 3],     // Prilagodi prema tvojim kursevima
    SECTION_IDS: [1, 2, 3],
    LESSON_IDS: [1, 2, 3, 4, 5],
    USER_IDS: Array.from({ length: 100 }, (_, i) => i + 1), // korisnik IDs 1-100
};

// ============================================================
// METRIKE
// ============================================================
const metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    errors: {},           // error type -> count
    responseTimes: [],    // sve response time-ove čuvamo
    responseTimesByEndpoint: {},  // endpoint -> [times]
    statusCodes: {},      // status code -> count
    startTime: null,
    activeUsers: 0,
    peakActiveUsers: 0,
    requestsInProgress: 0,
    peakConcurrent: 0,
    rateLimited: 0,
    timeouts: 0,
    connectionErrors: 0,
};

// ============================================================
// HTTP REQUEST HELPER (bez zavisnosti)
// ============================================================
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const lib = isHttps ? https : http;

        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
            },
            timeout: 15000, // 15 sekundi timeout
        };

        metrics.requestsInProgress++;
        if (metrics.requestsInProgress > metrics.peakConcurrent) {
            metrics.peakConcurrent = metrics.requestsInProgress;
        }

        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                metrics.requestsInProgress--;

                resolve({
                    status: res.statusCode,
                    data: data,
                    responseTime,
                    headers: res.headers,
                });
            });
        });

        req.on('error', (err) => {
            const responseTime = Date.now() - startTime;
            metrics.requestsInProgress--;
            reject({ error: err.message, responseTime });
        });

        req.on('timeout', () => {
            metrics.requestsInProgress--;
            req.destroy();
            reject({ error: 'TIMEOUT', responseTime: 15000 });
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

// ============================================================
// ENDPOINT DEFINICIJE (šta korisnici rade)
// ============================================================
function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getEndpoints() {
    const courseId = getRandomItem(CONFIG.COURSE_IDS);
    const userId = getRandomItem(CONFIG.USER_IDS);
    const lessonId = getRandomItem(CONFIG.LESSON_IDS);

    // Weighted distribution
    return [
        // === ČESTI: Navigacija po sekcijama (40%) ===
        { name: 'GET /lekcije/sections/:id', path: `/api/lekcije/sections/${courseId}`, weight: 40 },

        // === SREDNJE ČESTI: Progres i praćenje (60%) ===
        { name: 'GET /kompletirane/user/:uid/course/:cid', path: `/api/kompletirane_lekcije/user/${userId}/course/${courseId}`, weight: 30 },
        { name: 'GET /kursevi/progres-sekcija', path: `/api/kursevi/progres-sekcija/${courseId}/korisnik/${userId}`, weight: 30 },
    ];
}

function selectEndpoint() {
    const endpoints = getEndpoints();
    const totalWeight = endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const ep of endpoints) {
        random -= ep.weight;
        if (random <= 0) return ep;
    }
    return endpoints[0];
}

// ============================================================
// RECORD METRICS
// ============================================================
function recordMetric(endpoint, response) {
    metrics.totalRequests++;

    if (response.status >= 200 && response.status < 400) {
        metrics.successfulRequests++;
    } else {
        metrics.failedRequests++;
    }

    if (response.status === 429) {
        metrics.rateLimited++;
    }

    // Status codes
    metrics.statusCodes[response.status] = (metrics.statusCodes[response.status] || 0) + 1;

    // Response times
    metrics.responseTimes.push(response.responseTime);
    if (!metrics.responseTimesByEndpoint[endpoint.name]) {
        metrics.responseTimesByEndpoint[endpoint.name] = [];
    }
    metrics.responseTimesByEndpoint[endpoint.name].push(response.responseTime);
}

function recordError(endpoint, error) {
    metrics.totalRequests++;
    metrics.failedRequests++;

    const errorType = error.error || 'UNKNOWN';
    metrics.errors[errorType] = (metrics.errors[errorType] || 0) + 1;

    if (errorType === 'TIMEOUT') {
        metrics.timeouts++;
    } else {
        metrics.connectionErrors++;
    }
}

// ============================================================
// VIRTUALNI KORISNIK
// ============================================================
async function virtualUser(userId, stopSignal) {
    metrics.activeUsers++;
    if (metrics.activeUsers > metrics.peakActiveUsers) {
        metrics.peakActiveUsers = metrics.activeUsers;
    }

    while (!stopSignal.stopped) {
        const endpoint = selectEndpoint();
        const url = `${CONFIG.BASE_URL}${endpoint.path}`;

        try {
            const response = await makeRequest(url);
            recordMetric(endpoint, response);
        } catch (error) {
            recordError(endpoint, error);
        }

        // Think time - realistična pauza između zahteva
        const thinkTime = CONFIG.MIN_THINK_TIME_MS +
            Math.random() * (CONFIG.MAX_THINK_TIME_MS - CONFIG.MIN_THINK_TIME_MS);
        await new Promise(resolve => setTimeout(resolve, thinkTime));
    }

    metrics.activeUsers--;
}

// ============================================================
// PROGRESS BAR
// ============================================================
function printProgress(elapsed, duration) {
    const pct = Math.min(100, Math.round((elapsed / duration) * 100));
    const barLen = 40;
    const filled = Math.round(barLen * pct / 100);
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);
    const rps = metrics.totalRequests / Math.max(1, elapsed);

    process.stdout.write(`\r  [${bar}] ${pct}% | ${elapsed}s/${duration}s | ` +
        `Users: ${metrics.activeUsers} | Req: ${metrics.totalRequests} | ` +
        `RPS: ${rps.toFixed(1)} | Errors: ${metrics.failedRequests}`);
}

// ============================================================
// STATISTIKA - KALKULACIJA
// ============================================================
function calculateStats(times) {
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);

    return {
        count: sorted.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: Math.round(sum / sorted.length),
        median: sorted[Math.floor(sorted.length / 2)],
        p90: sorted[Math.floor(sorted.length * 0.9)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
    };
}

// ============================================================
// IZVEŠTAJ
// ============================================================
function printReport() {
    const elapsed = (Date.now() - metrics.startTime) / 1000;
    const stats = calculateStats(metrics.responseTimes);

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║              🏋️  LOAD TEST REZULTATI                            ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  KONFIGURACIJA                                                 ║');
    console.log(`║  • Base URL:          ${CONFIG.BASE_URL.padEnd(41)}║`);
    console.log(`║  • Virtuelni korisnici: ${String(CONFIG.NUM_USERS).padEnd(39)}║`);
    console.log(`║  • Trajanje testa:    ${String(elapsed.toFixed(1) + 's').padEnd(41)}║`);
    console.log(`║  • Think time:        ${String(CONFIG.MIN_THINK_TIME_MS + '-' + CONFIG.MAX_THINK_TIME_MS + 'ms').padEnd(41)}║`);
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  PREGLED ZAHTEVA                                               ║');
    console.log(`║  • Ukupno zahteva:    ${String(metrics.totalRequests).padEnd(41)}║`);
    console.log(`║  • Uspešnih:          ${String(metrics.successfulRequests).padEnd(41)}║`);
    console.log(`║  • Neuspešnih:        ${String(metrics.failedRequests).padEnd(41)}║`);
    console.log(`║  • Rate Limited (429): ${String(metrics.rateLimited).padEnd(40)}║`);
    console.log(`║  • Timeouts:          ${String(metrics.timeouts).padEnd(41)}║`);
    console.log(`║  • Connection Errors: ${String(metrics.connectionErrors).padEnd(41)}║`);
    console.log(`║  • Success Rate:      ${String((metrics.successfulRequests / Math.max(1, metrics.totalRequests) * 100).toFixed(1) + '%').padEnd(41)}║`);
    console.log(`║  • RPS (avg):         ${String((metrics.totalRequests / elapsed).toFixed(1)).padEnd(41)}║`);
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  KONKURENTNOST                                                 ║');
    console.log(`║  • Peak active users: ${String(metrics.peakActiveUsers).padEnd(41)}║`);
    console.log(`║  • Peak concurrent:   ${String(metrics.peakConcurrent).padEnd(41)}║`);
    console.log('╠══════════════════════════════════════════════════════════════════╣');

    if (stats) {
        console.log('║  RESPONSE TIME (ms)                                            ║');
        console.log(`║  • Min:               ${String(stats.min + 'ms').padEnd(41)}║`);
        console.log(`║  • Avg:               ${String(stats.avg + 'ms').padEnd(41)}║`);
        console.log(`║  • Median (p50):      ${String(stats.median + 'ms').padEnd(41)}║`);
        console.log(`║  • P90:               ${String(stats.p90 + 'ms').padEnd(41)}║`);
        console.log(`║  • P95:               ${String(stats.p95 + 'ms').padEnd(41)}║`);
        console.log(`║  • P99:               ${String(stats.p99 + 'ms').padEnd(41)}║`);
        console.log(`║  • Max:               ${String(stats.max + 'ms').padEnd(41)}║`);
        console.log('╠══════════════════════════════════════════════════════════════════╣');
    }

    // Status codes
    console.log('║  HTTP STATUS CODES                                             ║');
    for (const [code, count] of Object.entries(metrics.statusCodes).sort()) {
        const pct = (count / metrics.totalRequests * 100).toFixed(1);
        console.log(`║  • ${code}: ${String(count + ` (${pct}%)`).padEnd(56)}║`);
    }

    if (Object.keys(metrics.errors).length > 0) {
        console.log('╠══════════════════════════════════════════════════════════════════╣');
        console.log('║  GREŠKE                                                        ║');
        for (const [error, count] of Object.entries(metrics.errors)) {
            console.log(`║  • ${error.substring(0, 20).padEnd(20)}: ${String(count).padEnd(38)}║`);
        }
    }

    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log('║  RESPONSE TIME PO ENDPOINTU                                    ║');
    console.log('║  Endpoint                          Avg     P95     Max    Count ║');
    console.log('║  ─────────────────────────────────  ──────  ──────  ─────  ───── ║');

    for (const [name, times] of Object.entries(metrics.responseTimesByEndpoint).sort()) {
        const epStats = calculateStats(times);
        if (epStats) {
            const shortName = name.substring(0, 35).padEnd(35);
            const avg = String(epStats.avg + 'ms').padEnd(8);
            const p95 = String(epStats.p95 + 'ms').padEnd(8);
            const max = String(epStats.max + 'ms').padEnd(7);
            const count = String(epStats.count).padEnd(5);
            console.log(`║  ${shortName} ${avg}${p95}${max}${count}║`);
        }
    }

    console.log('╠══════════════════════════════════════════════════════════════════╣');

    // PROCENA ZA VPS
    console.log('║  📊 VPS PROCENA                                                ║');
    console.log('║                                                                 ║');

    // Analiziramo po brzini response-a
    if (stats) {
        if (stats.p95 < 500 && metrics.failedRequests === 0 && metrics.rateLimited === 0) {
            console.log('║  ✅ REZULTAT: VPS PODNOSI 100 korisnika BEZ problema!         ║');
            console.log('║     P95 < 500ms, 0 grešaka — odlične performanse.             ║');
        } else if (stats.p95 < 1000 && metrics.failedRequests < metrics.totalRequests * 0.01) {
            console.log('║  ⚠️  REZULTAT: VPS podnosi 100 korisnika ALI sa opterećenjem   ║');
            console.log('║     P95 < 1s, ali treba pratiti RAM i CPU.                    ║');
            console.log('║     PREPORUKA: Upgrade na 2 vCores / 2 GB RAM                ║');
        } else if (stats.p95 < 3000) {
            console.log('║  🟡 REZULTAT: VPS je pod velikim stresom.                     ║');
            console.log('║     PREPORUKA: Upgrade na 2 vCores / 2 GB RAM (minimum)      ║');
        } else {
            console.log('║  🔴 REZULTAT: VPS NE MOŽE da podnese 100 korisnika.           ║');
            console.log('║     HITNA PREPORUKA: Upgrade na 2 vCores / 4 GB RAM           ║');
        }

        if (metrics.timeouts > 0) {
            console.log('║                                                                 ║');
            console.log(`║  ⚠️  ${metrics.timeouts} timeout-a detektovano — server ne stiže da odgovori!  ║`);
        }
        if (metrics.rateLimited > 0) {
            console.log('║                                                                 ║');
            console.log(`║  ℹ️  ${metrics.rateLimited} rate-limit blokada (429) — rate limiter radi!      ║`);
            console.log('║     Ovo je OČEKIVANO ponašanje zaštite.                       ║');
        }
        if (metrics.connectionErrors > 0) {
            console.log('║                                                                 ║');
            console.log(`║  ❌ ${metrics.connectionErrors} connection error-a — server odbija konekcije!   ║`);
        }
    }

    console.log('╚══════════════════════════════════════════════════════════════════╝');

    // Save raw data to file
    const reportData = {
        config: CONFIG,
        metrics: {
            totalRequests: metrics.totalRequests,
            successfulRequests: metrics.successfulRequests,
            failedRequests: metrics.failedRequests,
            rateLimited: metrics.rateLimited,
            timeouts: metrics.timeouts,
            connectionErrors: metrics.connectionErrors,
            successRate: (metrics.successfulRequests / Math.max(1, metrics.totalRequests) * 100).toFixed(1) + '%',
            rps: (metrics.totalRequests / elapsed).toFixed(1),
            peakActiveUsers: metrics.peakActiveUsers,
            peakConcurrent: metrics.peakConcurrent,
            responseTime: stats,
            statusCodes: metrics.statusCodes,
            errors: metrics.errors,
        },
        endpointStats: {},
        timestamp: new Date().toISOString(),
    };

    for (const [name, times] of Object.entries(metrics.responseTimesByEndpoint)) {
        reportData.endpointStats[name] = calculateStats(times);
    }

    const fs = require('fs');
    const reportPath = require('path').join(__dirname, `load-test-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`\n📁 Detaljni JSON izveštaj sačuvan: ${reportPath}`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║        🚀 LOAD TEST - Kursevi Platforma                        ║');
    console.log('║        Simulacija korišćenja kursa (bez kupovine)               ║');
    console.log('╠══════════════════════════════════════════════════════════════════╣');
    console.log(`║  Target:    ${CONFIG.BASE_URL.padEnd(51)}║`);
    console.log(`║  Users:     ${String(CONFIG.NUM_USERS).padEnd(51)}║`);
    console.log(`║  Duration:  ${String(CONFIG.TEST_DURATION_SEC + 's').padEnd(51)}║`);
    console.log(`║  Ramp-up:   ${String(CONFIG.RAMP_UP_SEC + 's').padEnd(51)}║`);
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log('');

    // 1. Proveri da li je server dostupan
    console.log('  🔍 Provera dostupnosti servera...');
    try {
        const healthCheck = await makeRequest(`${CONFIG.BASE_URL}/`);
        if (healthCheck.status >= 500) {
            console.error('  ❌ Server nije dostupan (status ' + healthCheck.status + '). Prekidam test.');
            process.exit(1);
        }
        console.log(`  ✅ Server dostupan (status ${healthCheck.status}, response time: ${healthCheck.responseTime}ms)`);
    } catch (err) {
        console.error('  ❌ Ne mogu da se povežem na server:', err.error);
        console.error('     Proveri da li je server pokrenut i URL ispravan.');
        process.exit(1);
    }

    // Reset metrics after health check
    metrics.totalRequests = 0;
    metrics.successfulRequests = 0;
    metrics.failedRequests = 0;
    metrics.responseTimes = [];
    metrics.responseTimesByEndpoint = {};
    metrics.statusCodes = {};
    metrics.errors = {};
    metrics.rateLimited = 0;
    metrics.timeouts = 0;
    metrics.connectionErrors = 0;
    metrics.requestsInProgress = 0;

    console.log('');
    console.log(`  🏁 Pokretanje load testa sa ${CONFIG.NUM_USERS} korisnika...`);
    console.log(`     Ramp-up: ${CONFIG.RAMP_UP_SEC}s (korisnici se dodaju postepeno)`);
    console.log('');

    metrics.startTime = Date.now();
    const stopSignal = { stopped: false };
    const userPromises = [];

    // 2. Postepeno dodavanje korisnika (ramp-up)
    const delayPerUser = (CONFIG.RAMP_UP_SEC * 1000) / CONFIG.NUM_USERS;

    for (let i = 0; i < CONFIG.NUM_USERS; i++) {
        await new Promise(resolve => setTimeout(resolve, delayPerUser));
        userPromises.push(virtualUser(i + 1, stopSignal));
    }

    console.log(`  ✅ Svih ${CONFIG.NUM_USERS} korisnika aktivno!`);
    console.log('');

    // 3. Održavaj test za zadano trajanje
    const testEndTime = metrics.startTime + CONFIG.TEST_DURATION_SEC * 1000;
    const progressInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - metrics.startTime) / 1000);
        printProgress(elapsed, CONFIG.TEST_DURATION_SEC);
    }, 1000);

    // Čekaj dok trajanje ne istekne
    while (Date.now() < testEndTime) {
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 4. Zaustavi sve korisnike
    stopSignal.stopped = true;
    clearInterval(progressInterval);

    console.log('\n\n  ⏹️  Zaustavljanje korisnika...');

    // Čekaj da svi korisnici završe
    await Promise.all(userPromises);

    // 5. Prikaži izveštaj
    printReport();
}

// Pokreni
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
