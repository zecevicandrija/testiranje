/**
 * MSU (MerchantSafe Unipay) Payment Service
 * Handles all communication with the MSU payment gateway API
 */

const axios = require('axios');
const crypto = require('crypto');

const MSU_API_URL = process.env.MSU_API_URL;
const MSU_HPP_URL = process.env.MSU_HPP_URL;
const MERCHANT_NAME = process.env.MSU_MERCHANT_NAME;
const MERCHANT_USER = process.env.MSU_MERCHANT_USER;
const MERCHANT_PASSWORD = process.env.MSU_MERCHANT_PASSWORD;

/**
 * Creates a session token for payment
 * @param {Object} orderData - Order details
 * @param {string} orderData.customerId - Unique customer ID
 * @param {string} orderData.customerEmail - Customer email
 * @param {string} orderData.customerName - Customer name
 * @param {string} orderData.customerPhone - Customer phone (optional)
 * @param {string} orderData.merchantPaymentId - Unique order/payment ID
 * @param {number} orderData.amount - Payment amount
 * @param {Array} orderData.orderItems - Array of order items
 * @param {string} orderData.returnUrl - URL to redirect after payment
 * @returns {Promise<Object>} - Session token response
 */
async function createSessionToken(orderData) {
    const {
        customerId,
        customerEmail,
        customerName,
        customerPhone = '',
        merchantPaymentId,
        amount,
        orderItems,
        returnUrl
    } = orderData;

    const postData = new URLSearchParams({
        ACTION: 'SESSIONTOKEN',
        MERCHANTUSER: MERCHANT_USER,
        MERCHANTPASSWORD: MERCHANT_PASSWORD,
        MERCHANT: MERCHANT_NAME,
        CUSTOMER: customerId,
        SESSIONTYPE: 'PAYMENTSESSION',
        MERCHANTPAYMENTID: merchantPaymentId,
        AMOUNT: amount.toFixed(2),
        CURRENCY: 'RSD',
        CUSTOMEREMAIL: customerEmail,
        CUSTOMERNAME: customerName,
        CUSTOMERPHONE: customerPhone,
        RETURNURL: returnUrl,
        ORDERITEMS: JSON.stringify(orderItems)
    });

    try {
        const response = await axios.post(MSU_API_URL, postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('MSU createSessionToken error:', error.message);
        throw new Error('Failed to create payment session');
    }
}

/**
 * Query session details by session token
 * @param {string} sessionToken - The session token to query
 * @returns {Promise<Object>} - Session details
 */
async function querySession(sessionToken) {
    const postData = new URLSearchParams({
        ACTION: 'QUERYSESSION',
        SESSIONTOKEN: sessionToken
    });

    try {
        const response = await axios.post(MSU_API_URL, postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('MSU querySession error:', error.message);
        throw new Error('Failed to query session');
    }
}

/**
 * Query transaction details
 * @param {Object} params - Query parameters
 * @param {string} params.pgTranId - Payment gateway transaction ID (optional)
 * @param {string} params.merchantPaymentId - Merchant payment ID (optional)
 * @returns {Promise<Object>} - Transaction details
 */
async function queryTransaction(params) {
    const { pgTranId, merchantPaymentId } = params;

    const postData = new URLSearchParams({
        ACTION: 'QUERYTRANSACTION',
        MERCHANTUSER: MERCHANT_USER,
        MERCHANTPASSWORD: MERCHANT_PASSWORD,
        MERCHANT: MERCHANT_NAME
    });

    if (pgTranId) {
        postData.append('PGTRANID', pgTranId);
    } else if (merchantPaymentId) {
        postData.append('MERCHANTPAYMENTID', merchantPaymentId);
    } else {
        throw new Error('Either pgTranId or merchantPaymentId is required');
    }

    try {
        const response = await axios.post(MSU_API_URL, postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('MSU queryTransaction error:', error.message);
        throw new Error('Failed to query transaction');
    }
}

/**
 * Verify the SHA512 hash from MSU response
 * @param {Object} data - Response data from MSU
 * @param {string} secretKey - Merchant secret key
 * @returns {boolean} - Whether the hash is valid
 */
function verifyResponseHash(data, secretKey) {
    const { merchantPaymentId, customerId, sessionToken, responseCode, random, SD_SHA512 } = data;

    if (!SD_SHA512 || !secretKey) {
        // If no hash provided or no secret key, skip verification
        return true;
    }

    const stringToHash = `${merchantPaymentId}|${customerId}|${sessionToken}|${responseCode}|${random}|${secretKey}`;
    const calculatedHash = crypto.createHash('sha512').update(stringToHash).digest('hex');

    return calculatedHash.toLowerCase() === SD_SHA512.toLowerCase();
}

/**
 * Build HPP redirect URL from session token
 * @param {string} sessionToken - The session token
 * @returns {string} - Full HPP URL
 */
function buildHppUrl(sessionToken) {
    return `${MSU_HPP_URL}${sessionToken}`;
}

/**
 * Parse transaction status from MSU response
 * @param {string} status - MSU transaction status code
 * @returns {string} - Human readable status
 */
function parseTransactionStatus(status) {
    const statusMap = {
        'IP': 'PENDING',      // In Progress
        'CA': 'CANCELLED',    // Cancelled by cardholder
        'FA': 'FAILED',       // Failed/Declined
        'AP': 'APPROVED',     // Approved
        'VD': 'VOIDED',       // Voided
        'MR': 'REVIEW'        // Manual review needed
    };

    return statusMap[status] || 'UNKNOWN';
}

/**
 * Creates a CIT (Customer Initiated Transaction) session token for recurring payments
 * This is used for the FIRST transaction where the card is saved
 * @param {Object} orderData - Order details (same as createSessionToken)
 * @returns {Promise<Object>} - Session token response
 */
async function createCITSession(orderData) {
    const {
        customerId,
        customerEmail,
        customerName,
        customerPhone = '',
        merchantPaymentId,
        amount,
        orderItems,
        returnUrl
    } = orderData;

    // CIT EXTRA: saveCard + Recurring:C + RecurringType:Subscription
    const extraParams = {
        saveCard: 'YES',
        SALE: 'YES',
        RecurringType: 'Subscription',
        Recurring: 'C'  // C = Customer Initiated (first transaction)
    };

    const postData = new URLSearchParams({
        ACTION: 'SESSIONTOKEN',
        MERCHANTUSER: MERCHANT_USER,
        MERCHANTPASSWORD: MERCHANT_PASSWORD,
        MERCHANT: MERCHANT_NAME,
        CUSTOMER: customerId,
        SESSIONTYPE: 'PAYMENTSESSION',
        MERCHANTPAYMENTID: merchantPaymentId,
        AMOUNT: amount.toFixed(2),
        CURRENCY: 'RSD',
        CUSTOMEREMAIL: customerEmail,
        CUSTOMERNAME: customerName,
        CUSTOMERPHONE: customerPhone,
        RETURNURL: returnUrl,
        SESSIONEXPIRY: '1h',
        ORDERITEMS: JSON.stringify(orderItems),
        EXTRA: encodeURI(JSON.stringify(extraParams))
    });

    try {
        const response = await axios.post(MSU_API_URL, postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('MSU createCITSession error:', error.message);
        throw new Error('Failed to create CIT payment session');
    }
}

/**
 * Execute MIT (Merchant Initiated Transaction) SALE for automatic renewal
 * This uses the saved card token and traceID from the initial CIT transaction
 * @param {Object} params - MIT transaction parameters
 * @param {string} params.customerId - Customer ID
 * @param {string} params.merchantPaymentId - Unique payment ID for this renewal
 * @param {number} params.amount - Amount to charge
 * @param {string} params.cardToken - Card token from CIT response
 * @param {string} params.traceID - Trace ID from CIT bankResponseExtras
 * @param {string} params.returnUrl - Return URL (optional for MIT)
 * @returns {Promise<Object>} - Payment response
 */
async function executeMITSale(params) {
    const {
        customerId,
        merchantPaymentId,
        amount,
        cardToken,
        traceID,
        returnUrl = 'http://https://api.motionakademija.com/api/msu/callback'
    } = params;

    // MIT EXTRA: Recurring:R + RecurringType:Subscription + TraceID
    // const extraParams = {
    //     Recurring: 'R',  // R = Recurring (scheduled MIT)
    //     RecurringType: 'Subscription',
    //     TraceID: traceID
    // };

    const postData = new URLSearchParams({
        ACTION: 'SALE',
        MERCHANTUSER: MERCHANT_USER,
        MERCHANTPASSWORD: MERCHANT_PASSWORD,
        MERCHANT: MERCHANT_NAME,
        MERCHANTPAYMENTID: merchantPaymentId,
        AMOUNT: amount.toFixed(2),
        CUSTOMER: customerId,
        CURRENCY: 'RSD',
        RETURNURL: returnUrl,
        CARDTOKEN: cardToken,
        EXTRA: encodeURI(JSON.stringify(extraParams))
    });

    try {
        const response = await axios.post(MSU_API_URL, postData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        return response.data;
    } catch (error) {
        console.error('MSU executeMITSale error:', error.message);
        throw new Error('Failed to execute MIT sale');
    }
}

module.exports = {
    createSessionToken,
    createCITSession,
    executeMITSale,
    querySession,
    queryTransaction,
    verifyResponseHash,
    buildHppUrl,
    parseTransactionStatus
};
