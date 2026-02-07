// backend/scripts/testRenewal.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { runAutoRenewalJob } = require('../jobs/autoRenewalCron');

console.log('🧪 Manually triggering auto renewal job...');
console.log('Server time:', new Date().toISOString());

runAutoRenewalJob()
    .then(() => {
        console.log('✅ Job finished');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Job failed:', err);
        process.exit(1);
    });