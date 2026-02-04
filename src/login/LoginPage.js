import React, { useState } from 'react';
import { useAuth } from './auth';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiArrowRight, FiAlertCircle } from 'react-icons/fi';
import './LoginPage.css'

import animatedbanner from '../images/0731banrer.gif';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [sifra, setSifra] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            await login(email, sifra);
        } catch (error) {
            setShowModal(true);
            console.error('Login error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <div className="lpage-wrapper">
            <motion.div
                className="lpage-container"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
            >
                {/* Glow Effect */}
                <div className="lpage-glow" />

                {/* Banner */}
                <motion.div
                    className="lpage-banner-wrapper"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                >
                    <img src={animatedbanner} alt="Motion Akademija" className="lpage-banner" />
                    <div className="lpage-banner-overlay" />
                </motion.div>

                {/* Header */}
                <motion.div
                    className="lpage-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <h1 className="lpage-title">
                        Dobro <span className="lpage-gradient-text">došli</span>
                    </h1>
                    <p className="lpage-subtitle">
                        Uđite u svet video editinga
                    </p>
                </motion.div>

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    className="lpage-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                >
                    <div className="lpage-input-group">
                        <label htmlFor="email" className="lpage-label">
                            <FiMail className="lpage-label-icon" />
                            Email Adresa
                        </label>
                        <div className="lpage-input-wrapper">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="lpage-input"
                                placeholder="vas@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <div className="lpage-input-focus-line" />
                        </div>
                    </div>

                    <div className="lpage-input-group">
                        <label htmlFor="password" className="lpage-label">
                            <FiLock className="lpage-label-icon" />
                            Lozinka
                        </label>
                        <div className="lpage-input-wrapper">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                className="lpage-input"
                                placeholder="••••••••"
                                value={sifra}
                                onChange={(e) => setSifra(e.target.value)}
                                required
                            />
                            <div className="lpage-input-focus-line" />
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        className="lpage-submit-btn"
                        disabled={isLoading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span>{isLoading ? 'Prijava...' : 'Prijavi se'}</span>
                        <FiArrowRight className="lpage-btn-icon" />
                        <div className="lpage-btn-shine" />
                    </motion.button>
                </motion.form>

                {/* Bottom Accent */}
                <motion.div
                    className="lpage-bottom-accent"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                />
            </motion.div>

            {/* Error Modal */}
            {showModal && (
                <motion.div
                    className="lpage-modal-overlay"
                    onClick={closeModal}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <motion.div
                        className="lpage-modal-content"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="lpage-modal-icon-box">
                            <FiAlertCircle className="lpage-modal-icon" />
                        </div>
                        <h3 className="lpage-modal-title">Greška pri prijavi</h3>
                        <p className="lpage-modal-text">
                            Podaci za prijavu nisu ispravni. Molimo Vas da proverite email i lozinku.
                        </p>
                        <button onClick={closeModal} className="lpage-modal-btn">
                            Pokušaj ponovo
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </div>
    );
};

export default LoginPage;
