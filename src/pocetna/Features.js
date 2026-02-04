'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { RiMovie2Line, RiFolderZipLine, RiCommunityLine, RiAwardLine, RiArrowRightLine } from 'react-icons/ri';
import styles from './Features.module.css';

const Features = ({ navigate }) => {
    const features = [
        { 
            icon: <RiMovie2Line />, 
            title: '20+ Sati Materijala', 
            text: 'Detaljne video lekcije koje pokrivaju sve aspekte montaže, od osnova do naprednih VFX tehnika.' 
        },
        { 
            icon: <RiFolderZipLine />, 
            title: 'Svi Materijali', 
            text: 'Dobijaš pristup sirovim snimcima, presetima i projektnim fajlovima za vežbu.' 
        },
        { 
            icon: <RiCommunityLine />, 
            title: 'Pro Community', 
            text: 'Ulaz u privatnu Discord grupu gde analiziramo radove i delimo poslove.' 
        },
        { 
            icon: <RiAwardLine />, 
            title: 'Sertifikat', 
            text: 'Zvaničan dokaz o završenoj obuci koji možeš dodati u svoj CV ili LinkedIn.' 
        },
    ];

    // Varijante za animaciju
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 50 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
    };

    return (
        <section className={styles.section}>
            {/* Pozadinski grid za ovu sekciju (suptilniji) */}
            <div className={styles.bgGrid}></div>

            <div className="container" style={{position: 'relative', zIndex: 2}}>
                
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className={styles.headerWrapper}
                >
                    <h2 className="section-title">ŠTA SVE DOBIJAŠ?</h2>
                    <p className="section-subtitle">Ovo nije samo kurs. Ovo je kompletan alat za tvoju karijeru.</p>
                </motion.div>
                
                <motion.div 
                    className={styles.featuresGrid}
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {features.map((feature, index) => (
                        <motion.div variants={item} className={styles.featureCard} key={index}>
                            {/* Dekorativni broj u pozadini (01, 02...) */}
                            <div className={styles.bgNumber}>0{index + 1}</div>
                            
                            {/* Tech Borders (Uglovi) */}
                            <div className={styles.cornerTopLeft}></div>
                            <div className={styles.cornerBottomRight}></div>

                            <div className={styles.iconWrapper}>
                                {feature.icon}
                                <div className={styles.iconGlow}></div>
                            </div>
                            
                            <h3 className={styles.title}>{feature.title}</h3>
                            <p className={styles.text}>{feature.text}</p>
                        </motion.div>
                    ))}
                </motion.div>
                
                <motion.div 
                    className={styles.ctaWrapper}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                >
                    <button className={styles.ctaButton} onClick={() => navigate('/paket')}>
                        <span>PRIDRUŽI SE AKADEMIJI</span>
                        <RiArrowRightLine />
                    </button>
                </motion.div>
            </div>
        </section>
    );
};

export default Features;