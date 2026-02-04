import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import './PaymentResult.css';

const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [paymentStatus, setPaymentStatus] = useState('loading');
    const [transactionData, setTransactionData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const checkPaymentStatus = async () => {
            try {
                // Dohvati parametre iz URL-a
                const merchantPaymentId = searchParams.get('merchantPaymentId');
                const responseCode = searchParams.get('responseCode');
                const responseMsg = searchParams.get('responseMsg');

                if (!merchantPaymentId) {
                    setError('Nedostaju podaci o transakciji');
                    setPaymentStatus('error');
                    return;
                }

                // Prvo ažuriraj transakciju sa callback podacima ako postoje
                if (responseCode && responseMsg) {
                    const callbackData = {
                        merchantPaymentId,
                        responseCode,
                        responseMsg,
                        pgTranId: searchParams.get('pgTranId'),
                        pgOrderId: searchParams.get('pgOrderId'),
                        pgTranRefId: searchParams.get('pgTranRefId'),
                        amount: searchParams.get('amount'),
                        sessionToken: searchParams.get('sessionToken')
                    };

                    await axios.post('https://test-api.zecevicdev.com/api/msu/callback', callbackData);
                }

                // Dohvati konačan status transakcije
                const response = await axios.get(
                    `https://test-api.zecevicdev.com/api/msu/status/${merchantPaymentId}`
                );

                if (response.data.success) {
                    setTransactionData(response.data.transaction);

                    if (response.data.transaction.status === 'APPROVED') {
                        setPaymentStatus('success');
                    } else if (response.data.transaction.status === 'FAILED') {
                        setPaymentStatus('failed');
                    } else if (response.data.transaction.status === 'CANCELLED') {
                        setPaymentStatus('cancelled');
                    } else {
                        setPaymentStatus('pending');
                    }
                } else {
                    setError('Greška pri proveri statusa plaćanja');
                    setPaymentStatus('error');
                }

            } catch (err) {
                console.error('Error checking payment status:', err);
                setError('Greška pri komunikaciji sa serverom');
                setPaymentStatus('error');
            }
        };

        checkPaymentStatus();
    }, [searchParams]);

    const handleGoToCourses = () => {
        navigate('/kupljeni-kursevi');
    };

    const handleGoBack = () => {
        navigate('/produzivanje');
    };

    if (paymentStatus === 'loading') {
        return (
            <div className="payment-result-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <h2>Proveravamo status plaćanja...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-result-container">
            {paymentStatus === 'success' && (
                <div className="payment-result success">
                    <div className="icon-success">✓</div>
                    <h1>Plaćanje uspešno!</h1>
                    <p>Račun Vaše platne kartice je zadužen.</p>

                    {transactionData && (
                        <div className="transaction-details">
                            <h3>Detalji transakcije:</h3>
                            <div className="detail-row">
                                <span className="label">Kurs:</span>
                                <span className="value">{transactionData.kursNaziv}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Iznos:</span>
                                <span className="value">{transactionData.amount} {transactionData.currency}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Broj narudžbine:</span>
                                <span className="value">{transactionData.merchantPaymentId}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Status:</span>
                                <span className="value status-approved">{transactionData.responseMsg}</span>
                            </div>
                        </div>
                    )}

                    <button className="btn-primary" onClick={handleGoToCourses}>
                        Idi na moje kurseve
                    </button>
                </div>
            )}

            {paymentStatus === 'failed' && (
                <div className="payment-result failed">
                    <div className="icon-failed">✕</div>
                    <h1>Plaćanje neuspešno</h1>
                    <p>Račun Vaše platne kartice nije zadužen.</p>

                    {transactionData && (
                        <div className="transaction-details">
                            <div className="detail-row">
                                <span className="label">Razlog:</span>
                                <span className="value">{transactionData.responseMsg}</span>
                            </div>
                            <div className="detail-row">
                                <span className="label">Broj narudžbine:</span>
                                <span className="value">{transactionData.merchantPaymentId}</span>
                            </div>
                        </div>
                    )}

                    <button className="btn-secondary" onClick={handleGoBack}>
                        Pokušaj ponovo
                    </button>
                </div>
            )}

            {paymentStatus === 'cancelled' && (
                <div className="payment-result cancelled">
                    <div className="icon-cancelled">!</div>
                    <h1>Plaćanje otkazano</h1>
                    <p>Otkazali ste proces plaćanja.</p>

                    <button className="btn-secondary" onClick={handleGoBack}>
                        Povratak na korpu
                    </button>
                </div>
            )}

            {paymentStatus === 'pending' && (
                <div className="payment-result pending">
                    <div className="icon-pending">⏳</div>
                    <h1>Plaćanje u obradi</h1>
                    <p>Vaša transakcija je u obradi. Kontaktiraćemo vas uskoro.</p>

                    {transactionData && (
                        <div className="transaction-details">
                            <div className="detail-row">
                                <span className="label">Broj narudžbine:</span>
                                <span className="value">{transactionData.merchantPaymentId}</span>
                            </div>
                        </div>
                    )}

                    <button className="btn-secondary" onClick={() => navigate('/')}>
                        Povratak na početnu
                    </button>
                </div>
            )}

            {paymentStatus === 'error' && (
                <div className="payment-result error">
                    <div className="icon-error">⚠</div>
                    <h1>Greška</h1>
                    <p>{error || 'Došlo je do greške. Molimo pokušajte ponovo.'}</p>

                    <button className="btn-secondary" onClick={handleGoBack}>
                        Povratak na korpu
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaymentResult;
