import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './auth';
import api from './api';
import './MojProfil.css';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiKey, FiArrowRight, FiCheck, FiMessageCircle, FiX } from 'react-icons/fi';

const MojProfil = () => {
    const { user, logout, setUser: setAuthUser } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        ime: '',
        prezime: '',
        email: '',
        currentPassword: '',
        newPassword: ''
    });

    // NOVI STATE: Čuvamo listu svih kupljenih kurseva
    const [kupljeniKursevi, setKupljeniKursevi] = useState([]);

    // NOVO: State za recurring subscription detalje
    const [subscriptionDetails, setSubscriptionDetails] = useState(null);

    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);

    // Provera da li je trenutna pretplata aktivna
    const imaAktivnuPretplatu = user && user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date();

    const fetchData = useCallback(async () => {
        if (user) {
            setFormData({
                ime: user.ime || '',
                prezime: user.prezime || '',
                email: user.email || '',
                currentPassword: '',
                newPassword: ''
            });
            try {
                // Dohvatamo sve kurseve koje je korisnik ikada kupio
                const response = await api.get(`/api/kupovina/user/${user.id}`);
                setKupljeniKursevi(response.data);
            } catch (error) {
                // Ako je 403 error - subscription je istekao, ali prikaži kurseve sa isteklom pretplatom
                if (error.response?.status === 403) {
                    console.log('Subscription expired - showing courses with expired status');
                    // Postavi prazan array - komponenta će pokazati da nema aktivnih pretplata
                    // Ali korisnik vidi subscription info u profilu
                    setKupljeniKursevi([]);
                } else {
                    console.error('Greška pri dohvatanju kupljenih kurseva:', error);
                    setKupljeniKursevi([]);
                }
            }

            // NOVO: Dohvati recurring subscription details
            try {
                const subResponse = await api.get(`/api/subscription/details/${user.id}`);
                if (subResponse.data.hasRecurring) {
                    setSubscriptionDetails(subResponse.data.subscription);
                } else {
                    setSubscriptionDetails(null);
                }
            } catch (subError) {
                console.error('Greška pri dohvatanju subscription detalja:', subError);
                setSubscriptionDetails(null);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const profileUpdateData = {
                ime: formData.ime,
                prezime: formData.prezime,
                email: formData.email,
            };
            if (formData.currentPassword && formData.newPassword) {
                await api.post('/api/auth/change-password', {
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                });
            }
            await api.put(`/api/korisnici/${user.id}`, profileUpdateData);

            const response = await api.get('/api/auth/me');
            setAuthUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));

            setMessage('Profil je uspešno ažuriran!');
            setFormData(prevState => ({ ...prevState, currentPassword: '', newPassword: '' }));
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Došlo je do greške.';
            setMessage(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelSubscription = async () => {
        if (!window.confirm('Da li ste sigurni da želite otkazati automatsko produžavanje? Zadržaćete pristup do isteka trenutne pretplate.')) {
            return;
        }

        setCancelLoading(true);
        try {
            await api.post('/api/subscription/cancel');

            // Refresh subscription details
            const subResponse = await api.get(`/api/subscription/details/${user.id}`);
            if (subResponse.data.hasRecurring) {
                setSubscriptionDetails(subResponse.data.subscription);
            } else {
                setSubscriptionDetails(null);
            }

            // Refresh user data
            const response = await api.get('/api/auth/me');
            setAuthUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));

            alert('Automatsko produžavanje je uspešno otkazano. Zadržaćete pristup do isteka trenutne pretplate.');
        } catch (error) {
            console.error('Greška pri otkazivanju pretplate:', error);
            alert('Greška pri otkazivanju pretplate. Molimo pokušajte ponovo.');
        } finally {
            setCancelLoading(false);
        }
    };

    const handleReactivateSubscription = async () => {
        setCancelLoading(true);
        try {
            await api.post('/api/subscription/reactivate');

            // Refresh subscription details
            const subResponse = await api.get(`/api/subscription/details/${user.id}`);
            if (subResponse.data.hasRecurring) {
                setSubscriptionDetails(subResponse.data.subscription);
            } else {
                setSubscriptionDetails(null);
            }

            // Refresh user data
            const response = await api.get('/api/auth/me');
            setAuthUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));

            alert('Automatsko produžavanje je ponovo aktivirano!');
        } catch (error) {
            console.error('Greška pri reaktivaciji pretplate:', error);
            alert('Greška pri reaktivaciji pretplate. Molimo pokušajte ponovo.');
        } finally {
            setCancelLoading(false);
        }
    };


    if (!user) {
        return (
            <div className="profil-container">
                <motion.div
                    className="welcome-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Main Welcome Card */}
                    <motion.div
                        className="welcome-hero-card"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="welcome-glow" />

                        <motion.div
                            className="welcome-icon-box"
                            initial={{ y: -20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4, duration: 0.6 }}
                        >
                            <FiCheck className="welcome-check-icon" />
                        </motion.div>

                        <motion.h1
                            className="welcome-title"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            Dobrodošli u <span className="gradient-text">Motion Akademiju</span>!
                        </motion.h1>

                        <motion.p
                            className="welcome-subtitle"
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6, duration: 0.6 }}
                        >
                            Uspešno ste se pridružili zajednici kreativaca
                        </motion.p>
                    </motion.div>

                    {/* Information Cards */}
                    <div className="welcome-info-grid">
                        <motion.div
                            className="welcome-info-card"
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.7, duration: 0.5 }}
                        >
                            <div className="info-card-icon-wrapper">
                                <FiMail className="info-card-icon" />
                            </div>
                            <div className="info-card-content">
                                <h3>Proverite Vaš Email</h3>
                                <p>Poslali smo vam podatke za login na vašu email adresu</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="welcome-info-card"
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.8, duration: 0.5 }}
                        >
                            <div className="info-card-icon-wrapper">
                                <FiKey className="info-card-icon" />
                            </div>
                            <div className="info-card-content">
                                <h3>Pristupite Platformi</h3>
                                <p>Koristite email i šifru koju smo vam prosledili za login</p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="welcome-info-card"
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.9, duration: 0.5 }}
                        >
                            <div className="info-card-icon-wrapper">
                                <FiMessageCircle className="info-card-icon" />
                            </div>
                            <div className="info-card-content">
                                <h3>Discord Zajednica</h3>
                                <p>Ne zaboravite da se pridružite našoj Discord zajednici!</p>
                            </div>
                        </motion.div>
                    </div>

                    {/* CTA Button */}
                    <motion.button
                        className="welcome-cta-btn"
                        onClick={() => navigate('/login')}
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.6 }}
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 60px rgba(255, 165, 0, 0.4)' }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <span>Uđite na Platformu</span>
                        <FiArrowRight className="cta-icon" />
                        <div className="cta-shine" />
                    </motion.button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="profil-container">
            <div className="profil-content-wrapper">
                {/* --- Leva Kartica - Profil --- */}
                <div className="profil-card">
                    <h2 className="profil-header">Moj Profil</h2>
                    <form onSubmit={handleSubmit} className="profil-form">
                        {/* ... input polja ostaju ista ... */}
                        <div className="profil-form-group">
                            <label htmlFor="ime">Ime</label>
                            <input id="ime" name="ime" type="text" value={formData.ime} onChange={handleInputChange} required />
                        </div>
                        <div className="profil-form-group">
                            <label htmlFor="prezime">Prezime</label>
                            <input id="prezime" name="prezime" type="text" value={formData.prezime} onChange={handleInputChange} required />
                        </div>
                        <div className="profil-form-group">
                            <label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        <hr className="profil-divider" />
                        <h3 className="profil-subheader">Promena Lozinke</h3>
                        <div className="profil-form-group">
                            <label htmlFor="currentPassword">Trenutna Lozinka</label>
                            <input id="currentPassword" name="currentPassword" type="password" value={formData.currentPassword} onChange={handleInputChange} placeholder="Unesite za promenu lozinke" />
                        </div>
                        <div className="profil-form-group">
                            <label htmlFor="newPassword">Nova Lozinka</label>
                            <input id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange} placeholder="Ostavite prazno ako ne menjate" />
                        </div>
                        {message && <p className="profil-message">{message}</p>}
                        <button type="submit" className="profil-submit-btn" disabled={isLoading}>
                            {isLoading ? 'Ažuriranje...' : 'Sačuvaj Promene'}
                        </button>
                    </form>
                </div>

                {/* --- Desna Kartica - Pretplate --- */}
                <div className="pretplata-card">
                    <h2 className="profil-header">Moje Pretplate</h2>
                    {kupljeniKursevi.length > 0 ? (
                        <ul className="pretplata-list">
                            {kupljeniKursevi.map(kurs => (
                                <li key={kurs.id} className="pretplata-item">
                                    <div className="pretplata-info">
                                        <span className="pretplata-item-name">{kurs.naziv}</span>
                                        <span className="pretplata-item-date">
                                            Kupljeno: {new Date(kurs.datum_kupovine).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="pretplata-status">
                                        {kurs.is_subscription ? (
                                            imaAktivnuPretplatu ? (
                                                <span className="status-active">
                                                    Aktivna do: {new Date(user.subscription_expires_at).toLocaleDateString()}
                                                </span>
                                            ) : (
                                                <div className="status-expired">
                                                    <span>Pretplata istekla!</span>
                                                    <button onClick={() => navigate('/produzivanje')} className="produzi-pretplatu-btn">
                                                        Produži
                                                    </button>
                                                </div>
                                            )
                                        ) : (
                                            <span className="status-permanent">Trajni pristup</span>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="pretplata-empty">
                            {user.subscription_expires_at ? (
                                new Date(user.subscription_expires_at) < new Date() ? (
                                    <>
                                        <p style={{ marginBottom: '10px' }}>Vaša pretplata je istekla {new Date(user.subscription_expires_at).toLocaleDateString()}.</p>
                                        <button onClick={() => navigate('/produzivanje')} className="produzi-pretplatu-btn">
                                            Obnovi pristup
                                        </button>
                                    </>
                                ) : (
                                    <p>Greška pri učitavanju podataka o pretplati.</p>
                                )
                            ) : (
                                <p>Nemate aktivnih kupovina ili pretplata.</p>
                            )}
                        </div>
                    )}

                    {/* NOVO: Auto-Renewal Section */}
                    {subscriptionDetails && (
                        <div className="auto-renewal-section">
                            <hr className="profil-divider" />
                            <h3 className="profil-subheader">Automatsko Produžavanje</h3>

                            {subscriptionDetails.isActive ? (
                                <div className="renewal-active-info">
                                    <div className="renewal-info-row">
                                        <span className="renewal-label">Sledeće Naplaćivanje:</span>
                                        <span className="renewal-value">
                                            {new Date(subscriptionDetails.nextBillingDate).toLocaleDateString('en-GB', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="renewal-info-row">
                                        <span className="renewal-label">Iznos:</span>
                                        <span className="renewal-value-amount">{subscriptionDetails.amount} RSD</span>
                                    </div>
                                    <button
                                        onClick={handleCancelSubscription}
                                        className="cancel-renewal-btn"
                                        disabled={cancelLoading}
                                    >
                                        <FiX className="cancel-icon" />
                                        {cancelLoading ? 'Otkazivanje...' : 'Otkaži Automatsko Produžavanje'}
                                    </button>
                                    <p className="renewal-note">
                                        💡 Možete otkazati u bilo kom trenutku. Zadržaćete pristup do {new Date(user.subscription_expires_at).toLocaleDateString('en-GB')}.
                                    </p>
                                </div>
                            ) : (
                                <div className="renewal-cancelled-info">
                                    <p className="cancelled-message">
                                        ⚠️ Automatsko produžavanje je otkazano.
                                    </p>
                                    <p className="access-until">
                                        Vaš pristup ističe: <strong>{new Date(user.subscription_expires_at).toLocaleDateString('en-GB')}</strong>
                                    </p>
                                    <button
                                        onClick={handleReactivateSubscription}
                                        className="reactivate-renewal-btn"
                                        disabled={cancelLoading}
                                    >
                                        {cancelLoading ? 'Aktivacija...' : 'Ponovo Aktiviraj Automatsko Produžavanje'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <button onClick={logout} className="profil-logout-btn">Odjavi se</button>
        </div>
    );
};

export default MojProfil;