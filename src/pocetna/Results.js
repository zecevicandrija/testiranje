// Results.js
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RiSecurePaymentLine, RiCheckDoubleLine, RiArrowRightUpLine, RiWallet3Line, RiShieldCheckLine } from 'react-icons/ri';
import styles from './Results.module.css';

import rezultat5 from '../images/rezultat31.png'; // Proveri putanje
import rezultat2 from '../images/rezultati23.png';
import rezultat3 from '../images/rezultat32.png';
import rezultat4 from '../images/rezultati4.png';

const Results = ({ navigate }) => {
    const earnings = [
        { id: 1, src: rezultat5, label: 'MESEČNI PRIHOD', tag: 'PayPal Verified', amount: '€2,450' },
        { id: 2, src: rezultat2, label: 'DIREKTNA ISPLATA', tag: 'Bank Transfer', amount: '€850' },
        { id: 3, src: rezultat3, label: 'HONORAR PROJEKTA', tag: 'Instant Payout', amount: '€1,200' },
        { id: 4, src: rezultat4, label: 'DODATNA ZARADA', tag: 'Verified Client', amount: '€450' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 100, scale: 0.9 },
        visible: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { type: "spring", stiffness: 50, damping: 15 }
        }
    };

    return (
        <section className={styles.section}>
            {/* Pozadinski ambijent koji diše */}
            <div className={styles.ambientLight}></div>
            <div className={styles.gridOverlay}></div>

            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                
                <div className={styles.header}>
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className={styles.badgeWrapper}
                    >
                        <span className={styles.cyberBadge}>
                            <span className={styles.blinkingDot}></span> REZULTATI POLAZNIKA
                        </span>
                    </motion.div>
                    
                    <motion.h2 
                        className={styles.title}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        BROJKE KOJE <br />
                        <span className={styles.gradientText}>MENJAJU ŽIVOT</span>
                    </motion.h2>
                    
                    <motion.p 
                        className={styles.subtitle}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                    >
                        Nema lažnih obećanja. Samo <b className={styles.highlight}>sirovi dokazi</b> uplata na račune naših članova. 
                        Ovo je standard koji postavlja Motion Akademija.
                    </motion.p>
                </div>
                
                <motion.div 
                    className={styles.grid}
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {earnings.map((item) => (
                        <motion.div 
                            className={styles.cardWrapper} 
                            key={item.id}
                            variants={cardVariants}
                        >
                            <div className={styles.card}>
                                {/* Holografski odsjaj */}
                                <div className={styles.holographicShine}></div>
                                
                                {/* Header kartice */}
                                <div className={styles.cardHeader}>
                                    <div className={styles.statusPill}>
                                        <RiShieldCheckLine className={styles.shieldIcon} /> {item.tag}
                                    </div>
                                    <div className={styles.iconBox}>
                                        <RiWallet3Line />
                                    </div>
                                </div>

                                {/* Slika Kontejner */}
                                <div className={styles.imageFrame}>
                                    <img src={item.src} alt="Dokaz zarade" className={styles.proofImage} />
                                    <div className={styles.scanLine}></div>
                                </div>

                                {/* Footer kartice */}
                                <div className={styles.cardFooter}>
                                    <div className={styles.footerLeft}>
                                        <p className={styles.labelTitle}>{item.label}</p>
                                        <div className={styles.verifiedBadge}>
                                            <RiCheckDoubleLine /> VERIFIKOVANO
                                        </div>
                                    </div>
                                    <div className={styles.arrowIcon}>
                                        <RiArrowRightUpLine />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
                
                <motion.div 
                    className={styles.ctaWrapper}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <button className={styles.neonButton} onClick={() => navigate('/paket')}>
                        <span>POSTANI SLEDEĆI PRIMER</span>
                        <div className={styles.btnReflection}></div>
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default Results;