import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FiCheck, FiStar, FiZap, FiTag, FiAlertCircle } from "react-icons/fi";
import { useAuth } from '../login/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Produzivanje.css";

import banner from '../images/motionakademijabanner.jpg';
import animatedbanner from '../images/0731banrer.gif';
import Footer from '../pocetna/Footer.js';

// Logotipi
import visaSecure from '../images/logotipi/visa-secure_blu_72dpi.jpg';
import mcIdCheck from '../images/logotipi/mc_idcheck_hrz_rgb_pos.png';
import maestro from '../images/logotipi/ms_acc_opt_70_1x.png';
import mastercard from '../images/logotipi/mc_acc_opt_70_1x.png';
import dina from '../images/logotipi/DinaCard znak.jpg';
import visa from '../images/logotipi/Visa_Brandmark_Blue_RGB_2021.png';
import chipcard from '../images/logotipi/ChipCard LOGO 2021_rgb.jpg';

const Produzivanje = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    // Discount state
    const [discountCode, setDiscountCode] = useState('');
    const [discountApplied, setDiscountApplied] = useState(null);
    const [discountError, setDiscountError] = useState('');
    const [isValidatingDiscount, setIsValidatingDiscount] = useState(false);

    // Provera da li je korisnik ulogovan
    if (!user) {
        navigate('/login');
        return null;
    }

    // Paketi za produžavanje
    const renewalPlans = [
        {
            title: "STANDARD",
            price: "50€",
            priceNumeric: 5900,
            period: "/ 1 mesec",
            image: banner,
            icon: <FiZap />,
            highlight: false,
            packageId: "STANDARD_1M",
            description: "Produžite pristup za 1 mesec",
            duration: "30 dana",
            features: [
                "Produženje za 1 mesec",
                "Pristup svim kursevima",
                "Redovni Update-ovi",
                "Pristup zajednici"
            ]
        },
        {
            title: "PRO",
            price: "140€",
            priceNumeric: 16524,
            period: "/ 3 meseca",
            image: animatedbanner,
            icon: <FiStar />,
            highlight: true,
            packageId: "PRO_3M",
            description: "Produžite pristup za 3 meseca",
            duration: "90 dana",
            features: [
                "Produženje za 3 meseca",
                "Pristup svim kursevima",
                "Redovni Update-ovi",
                "Pristup zajednici",
                "Uštedite 5%"
            ]
        }
    ];

    // Funkcija za validaciju i primenu popusta
    const handleApplyDiscount = async () => {
        if (!discountCode.trim()) {
            setDiscountError('Unesite kod popusta');
            return;
        }

        setIsValidatingDiscount(true);
        setDiscountError('');

        try {
            const response = await axios.post('https://test-api.zecevicdev.com/api/popusti/validate', {
                code: discountCode
            });

            if (response.data.success) {
                setDiscountApplied({
                    code: discountCode,
                    percent: response.data.discountPercent
                });
                setDiscountError('');
            }
        } catch (error) {
            setDiscountError(error.response?.data?.message || 'Kod popusta nije validan');
            setDiscountApplied(null);
        } finally {
            setIsValidatingDiscount(false);
        }
    };

    // Funkcija za uklanjanje popusta
    const handleRemoveDiscount = () => {
        setDiscountCode('');
        setDiscountApplied(null);
        setDiscountError('');
    };

    // Funkcija za izračunavanje finalne cene sa popustom
    const calculateFinalPrice = (originalPrice) => {
        if (!discountApplied) return originalPrice;

        const discount = (originalPrice * discountApplied.percent) / 100;
        return Math.floor(originalPrice - discount);
    };

    const handleRenewalClick = async (plan) => {
        try {
            // Izračunaj finalnu cenu sa popustom
            const finalAmount = calculateFinalPrice(plan.priceNumeric);

            // Korisnik je već ulogovan, koristimo podatke iz user objekta
            const requestData = {
                korisnikId: user.id,
                customerEmail: user.email || '',
                customerName: `${user.ime || ''} ${user.prezime || ''}`.trim(),
                customerPhone: user.telefon || '',
                packageData: {
                    id: plan.packageId,
                    code: plan.packageId,
                    name: `Produžavanje - ${plan.title} ${plan.period}`,
                    description: plan.description,
                    amount: finalAmount
                }
            };

            // Dodaj kod popusta ako je primenjen
            if (discountApplied) {
                requestData.discountCode = discountApplied.code;
            }

            console.log('Sending renewal request:', requestData);

            const response = await axios.post('https://test-api.zecevicdev.com/api/msu/create-session', requestData);

            if (response.data.success && response.data.redirectUrl) {
                // Preusmeri korisnika na MSU HPP stranicu
                window.location.href = response.data.redirectUrl;
            } else {
                alert('Greška pri kreiranju sesije plaćanja. Pokušajte ponovo.');
            }

        } catch (error) {
            console.error('Error creating renewal session:', error);
            alert(error.response?.data?.error || 'Došlo je do greške. Molimo pokušajte ponovo.');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const cardVariants = {
        hidden: { y: 50, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 50, damping: 20 }
        }
    };

    return (
        <>
            <section className="produzivanje-section" ref={ref}>
                <div className="produzivanje-ambience">
                    <div className="produzivanje-orb-1" />
                    <div className="produzivanje-orb-2" />
                </div>

                <div className="produzivanje-container">
                    <motion.div
                        className="produzivanje-header"
                        initial={{ opacity: 0, y: -30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="produzivanje-title">
                            Produžite Vašu Pretplatu
                        </h1>
                        <p className="produzivanje-subtitle">
                            Nastavite sa učenjem i pristupom premium sadržaju
                        </p>
                    </motion.div>

                    {/* User Info Card - MOVED ABOVE PACKAGES */}
                    <motion.div
                        className="produzivanje-user-info"
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.3, duration: 0.5 }}
                    >
                        <h3>Vaš Nalog</h3>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Ime:</strong> {user.ime} {user.prezime}</p>
                        {user.subscription_expires_at && (
                            <p className="expiry-info">
                                <strong>Trenutna pretplata ističe:</strong>{' '}
                                {new Date(user.subscription_expires_at).toLocaleDateString('sr-RS')}
                            </p>
                        )}

                        {/* Discount Code Section */}
                        <div className="produzivanje-discount-section">
                            <label htmlFor="discountCode">
                                <FiTag /> Kod popusta
                            </label>

                            {!discountApplied ? (
                                <div className="produzivanje-discount-input-group">
                                    <input
                                        type="text"
                                        id="discountCode"
                                        value={discountCode}
                                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                                        placeholder="Unesite kod"
                                        disabled={isValidatingDiscount}
                                    />
                                    <button
                                        className="produzivanje-apply-discount-btn"
                                        onClick={handleApplyDiscount}
                                        disabled={isValidatingDiscount || !discountCode.trim()}
                                    >
                                        {isValidatingDiscount ? 'Provera...' : 'Primeni'}
                                    </button>
                                </div>
                            ) : (
                                <div className="produzivanje-discount-applied-input">
                                    <span className="produzivanje-applied-code">
                                        <FiCheck /> {discountApplied.code} (-{discountApplied.percent}%)
                                    </span>
                                    <button
                                        className="produzivanje-remove-discount-btn"
                                        onClick={handleRemoveDiscount}
                                    >
                                        Ukloni
                                    </button>
                                </div>
                            )}

                            {discountError && (
                                <div className="produzivanje-discount-error">
                                    <FiAlertCircle /> {discountError}
                                </div>
                            )}

                            {discountApplied && (
                                <div className="produzivanje-discount-success">
                                    <FiCheck /> Popust će biti primenjen na izabrani paket
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        className="produzivanje-cards"
                        variants={containerVariants}
                        initial="hidden"
                        animate={isInView ? "visible" : "hidden"}
                    >
                        {renewalPlans.map((plan, index) => {
                            const finalPrice = calculateFinalPrice(plan.priceNumeric);
                            const hasDiscount = discountApplied && finalPrice < plan.priceNumeric;

                            return (
                                <motion.div
                                    key={index}
                                    className={`produzivanje-card ${plan.highlight ? "highlight" : ""}`}
                                    variants={cardVariants}
                                >
                                    {plan.highlight && (
                                        <div className="produzivanje-badge">NAJPOPULARNIJE</div>
                                    )}

                                    <div className="produzivanje-card-icon">{plan.icon}</div>
                                    <h2 className="produzivanje-card-title">{plan.title}</h2>
                                    <p className="produzivanje-card-description">{plan.description}</p>

                                    <div className="produzivanje-card-price">
                                        {hasDiscount ? (
                                            <>
                                                <span className="produzivanje-price-original">{plan.price}</span>
                                                <span className="produzivanje-price-amount produzivanje-price-discounted">
                                                    {Math.floor(finalPrice / 117.3)}€
                                                </span>
                                            </>
                                        ) : (
                                            <span className="produzivanje-price-amount">{plan.price}</span>
                                        )}
                                        <span className="produzivanje-price-period">{plan.period}</span>
                                    </div>

                                    {hasDiscount && (
                                        <div className="produzivanje-savings-badge">
                                            Ušteda: {Math.floor((plan.priceNumeric - finalPrice) / 117.3)}€
                                        </div>
                                    )}

                                    <div className="produzivanje-duration">
                                        <FiCheck className="duration-icon" />
                                        <span>Produženje za {plan.duration}</span>
                                    </div>

                                    <ul className="produzivanje-features">
                                        {plan.features.map((feature, i) => (
                                            <li key={i}>
                                                <FiCheck className="feature-icon" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        className="produzivanje-button"
                                        onClick={() => handleRenewalClick(plan)}
                                    >
                                        Produži sada
                                    </button>
                                </motion.div>
                            );
                        })}
                    </motion.div>

                    {/* Payment & Security Logos */}
                    <motion.div
                        className="paket-logos-wrapper"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.4, duration: 0.6 }}
                    >
                        <div className="paket-logos-container">
                            <div className="logos-group security-group">
                                <a href="https://rs.visa.com/pay-withvisa/security-and-assistance/protected-everywhere.html" target="_blank" rel="noopener noreferrer">
                                    <img src={visaSecure} alt="Visa Secure" className="logo-img" />
                                </a>
                                <a href="http://www.mastercard.com/rs/consumer/credit-cards.html" target="_blank" rel="noopener noreferrer">
                                    <img src={mcIdCheck} alt="Mastercard ID Check" className="logo-img" />
                                </a>
                            </div>

                            {/* Spacer div to enforce separation */}

                            <div className="logos-group payment-group">
                                <img src={maestro} alt="Maestro" className="logo-img" />
                                <img src={mastercard} alt="Mastercard" className="logo-img" />
                                <img src={dina} alt="DinaCard" className="logo-img" />
                                <img src={visa} alt="Visa" className="logo-img" />
                                <a href="https://chipcard.rs/ecommerce/" target="_blank" rel="noopener noreferrer">
                                    <img src={chipcard} alt="ChipCard" className="logo-img" style={{ height: '35px' }} />
                                </a>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>
            <Footer />
        </>
    );
};

export default Produzivanje;
