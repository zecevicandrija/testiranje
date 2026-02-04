'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RiAddLine, RiSubtractLine, RiQuestionAnswerLine, RiArrowRightLine } from 'react-icons/ri';
import styles from './FAQ.module.css';

// Logotipi
import visaSecure from '../images/logotipi/visa-secure_blu_72dpi.jpg';
import mcIdCheck from '../images/logotipi/mc_idcheck_hrz_rgb_pos.png';
import maestro from '../images/logotipi/ms_acc_opt_70_1x.png';
import mastercard from '../images/logotipi/mc_acc_opt_70_1x.png';
import dina from '../images/logotipi/DinaCard znak.jpg';
import visa from '../images/logotipi/Visa_Brandmark_Blue_RGB_2021.png';
import chipcard from '../images/logotipi/ChipCard LOGO 2021_rgb.jpg';

const FAQ = ({ navigate }) => {
    const faqs = [
        {
            q: <>Kakav je <b className="bold-orange-glow">život</b> video editora?</>,
            a: <>Radiš <b className="bold-white">kad hoćeš, gde hoćeš</b>. Tvoj posao ti stane u ranac zajedno sa laptopom. Nema šefa nad glavom, nema kancelarije. Imaš <b className="bold-orange-glow">slobodu</b> da upravljaš svojim vremenom i pritom <b className="bold-white">zarađuješ više</b> nego neko ko je 8 sati zatvoren u kancelariji. Jedina razlika između mene i tebe je što sam ja već krenuo tim putem. Ti si sada na početku – ali to je <b className="bold-white">sve što ti treba</b>.</>
        },
        {
            q: <>Da li mi je potrebno prethodno <b className="bold-orange-glow">iskustvo</b>?</>,
            a: <><b className="bold-white">Ne</b>. Akademija je dizajnirana za <b className="bold-white">potpune početnike</b> i vodi vas <b className="bold-orange-glow">korak po korak</b> do uspešnog video-editora.</>
        },
        {
            q: <>Da li se akademija <b className="bold-orange-glow">ažurira</b> vremenom?</>,
            a: <><b className="bold-white">Da</b>, akademija se <b className="bold-orange-glow">redovno ažurira</b>! Stalno dodajemo <b className="bold-white">nove lekcije, savete i alate</b> kako bi akademija išla u korak s najnovijim trendovima u svetu editovanja.</>
        },
    ];

    const [openIndex, setOpenIndex] = useState(null);

    const toggleFAQ = index => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className={styles.section}>
            <div className="container">

                <div className={styles.header}>
                    <h2 className="section-title">ČESTO POSTAVLJANA PITANJA</h2>
                    <p className="section-subtitle">Sve što treba da znaš pre nego što počneš.</p>
                </div>

                <div className={styles.faqList}>
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;

                        return (
                            <motion.div
                                key={index}
                                className={`${styles.faqItem} ${isOpen ? styles.active : ''}`}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <button
                                    className={styles.questionButton}
                                    onClick={() => toggleFAQ(index)}
                                >
                                    <div className={styles.questionContent}>
                                        <span className={styles.indexNumber}>0{index + 1}.</span>
                                        <span className={styles.questionText}>{faq.q}</span>
                                    </div>

                                    <div className={`${styles.iconContainer} ${isOpen ? styles.iconOpen : ''}`}>
                                        {isOpen ? <RiSubtractLine /> : <RiAddLine />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: "easeInOut" }}
                                            className={styles.answerWrapper}
                                        >
                                            <div className={styles.answerContent}>
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Dekorativni ugao koji svetli kad je aktivno */}
                                <div className={styles.cornerMarker}></div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    className={styles.ctaWrapper}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <button className="cta-button primary" onClick={() => navigate('/paket')}>
                        KRENI SA UČENJEM ODMAH <RiArrowRightLine style={{ marginLeft: '8px' }} />
                    </button>
                </motion.div>

                {/* Payment & Security Logos - Reusing global classes or we need to add :global to CSS module */}
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
    );
};

export default FAQ;