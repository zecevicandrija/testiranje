'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { FiPlay, FiScissors, FiMonitor, FiArrowRight, FiAward, FiClock, FiUsers, FiZap, FiChevronDown } from 'react-icons/fi';
import styles from './Hero.module.css';

const Hero = ({ navigate }) => {
    const targetRef = useRef(null);
    const statsRef = useRef(null);
    const featuresRef = useRef(null);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    // Intersection Observer za scroll animacije
    const statsInView = useInView(statsRef, { once: true, margin: "-100px" });
    const featuresInView = useInView(featuresRef, { once: true, margin: "-50px" });



    const { scrollYProgress } = useScroll({
        target: targetRef,
        offset: ["start start", "end start"]
    });

    const yContent = useTransform(scrollYProgress, [0, 1], [0, -80]);
    const yVideo = useTransform(scrollYProgress, [0, 1], [0, 50]);
    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);
    const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.98]);
    const parallaxY = useTransform(scrollYProgress, [0, 1], [0, 200]);

    // Animacije za elemente
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 60, opacity: 0, filter: 'blur(12px)' },
        visible: {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            transition: { type: "spring", stiffness: 70, damping: 20 }
        }
    };

    const videoRevealVariants = {
        hidden: { scale: 0.8, opacity: 0, rotateX: 15 },
        visible: {
            scale: 1,
            opacity: 1,
            rotateX: 0,
            transition: {
                type: "spring",
                stiffness: 50,
                damping: 20,
                delay: 0.4
            }
        }
    };

    const statVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: (i) => ({
            scale: 1,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
                delay: i * 0.1
            }
        })
    };

    const featureVariants = {
        hidden: { x: -50, opacity: 0 },
        visible: (i) => ({
            x: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 80,
                delay: i * 0.15
            }
        })
    };



    const particles = Array.from({ length: 20 }, (_, i) => i);

    const stats = [
        { number: "40+", label: "Video Lekcija", icon: FiPlay },
        { number: "Pro", label: "Premiere & AE", icon: FiAward },
        { number: "2", label: "LIVE Poziva", icon: FiUsers },
        { number: "24/7", label: "Podrška", icon: FiClock }
    ];

    const features = [
        { icon: FiZap, text: "Od početnika do profesionalca" },
        { icon: FiScissors, text: "Praktični projekti i vežbe" },
        { icon: FiMonitor, text: "Pristup sa svih uređaja" }
    ];

    return (
        <section className={styles.heroSection} ref={targetRef}>

            {/* === LUXURY ANIMATED BACKGROUND === */}
            <div className={styles.luxuryBackground}>
                {/* Animated gradient orbs */}
                <motion.div className={styles.gradientOrb1} style={{ y: parallaxY }} />
                <motion.div className={styles.gradientOrb2} style={{ y: parallaxY }} />
                <motion.div className={styles.gradientOrb3} style={{ y: parallaxY }} />

                {/* Grid overlay */}
                <div className={styles.gridOverlay}></div>

                {/* Floating particles */}
                <div className={styles.particleField}>
                    {particles.map((i) => (
                        <div key={i} className={styles.luxuryParticle}></div>
                    ))}
                </div>

                {/* Scan line effect */}
                <div className={styles.scanEffect}></div>

                {/* Noise texture */}
                <div className={styles.noiseTexture}></div>

                {/* Edge glow */}
                <div className={styles.edgeGlowTop}></div>
                <div className={styles.edgeGlowBottom}></div>
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 10 }}>
                <motion.div
                    className={styles.heroContent}
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    style={{ opacity, scale }}
                >
                    {/* === TOP BADGE === */}
                    <motion.div
                        variants={itemVariants}
                        className={styles.luxuryBadge}
                    >
                        <span className={styles.badgePulse}></span>
                        <span className={styles.badgeText}>MOTION AKADEMIJA</span>
                        <span className={styles.badgeGlow}></span>
                    </motion.div>

                    {/* === MAIN TITLE === */}
                    <motion.h1
                        variants={itemVariants}
                        className={styles.heroTitle}
                    >
                        UNOVČI SVOJU
                        <br />
                        <span className={styles.titleHighlight}>KREATIVNOST</span>
                    </motion.h1>

                    {/* === SUBTITLE === */}
                    <motion.p variants={itemVariants} className={styles.heroSubtitle}>
                        Jedan korak te deli od karijere video editora koja ti daje
                        <span className={styles.textGlow}> slobodu </span>
                        i život kakav želiš.
                    </motion.p>

                    {/* === CENTERED VIDEO SHOWCASE === */}
                    <motion.div
                        className={styles.videoShowcase}
                        variants={videoRevealVariants}
                        style={{ y: yVideo }}
                    >
                        <div className={styles.videoContainer}>
                            {/* Outer glow ring */}
                            <div className={styles.videoGlowRing}></div>

                            {/* Video card */}
                            <motion.div
                                className={styles.videoCard}
                                onClick={() => !isVideoPlaying && setIsVideoPlaying(true)}
                                whileHover={!isVideoPlaying ? { scale: 1.02 } : {}}
                                whileTap={!isVideoPlaying ? { scale: 0.98 } : {}}
                            >
                                {isVideoPlaying ? (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src="https://www.youtube.com/embed/CnHr9cZlSBU?si=CAXspSr-SuqgOpUv&autoplay=1"
                                        title="Video Uvod"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className={styles.videoIframe}
                                    ></iframe>
                                ) : (
                                    <>
                                        <img
                                            src="https://andrijatest.b-cdn.net/slika-kursa-1752491711321-motionacademybanner.png"
                                            alt="Uvodni video"
                                            className={styles.videoThumbnail}
                                        />

                                        <div className={styles.videoOverlay}>
                                            <motion.div
                                                className={styles.playButton}
                                                animate={{
                                                    boxShadow: [
                                                        "0 0 0 0 rgba(255, 69, 0, 0.7)",
                                                        "0 0 0 30px rgba(255, 69, 0, 0)",
                                                        "0 0 0 0 rgba(255, 69, 0, 0)"
                                                    ]
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: Infinity,
                                                    ease: "easeOut"
                                                }}
                                            >
                                                <FiPlay className={styles.playIcon} />
                                            </motion.div>
                                            <span className={styles.watchText}>POGLEDAJ UVOD</span>
                                            <span className={styles.videoDuration}>05:32</span>
                                        </div>

                                        {/* Scan effect on video */}
                                        <div className={styles.videoScan}></div>
                                    </>
                                )}

                                {/* Corner decorations */}
                                <div className={`${styles.cornerBracket} ${styles.cornerTL}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.cornerTR}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.cornerBL}`}></div>
                                <div className={`${styles.cornerBracket} ${styles.cornerBR}`}></div>
                            </motion.div>

                        </div>

                        {/* Floating tech elements - always visible below video */}
                        <div className={styles.floatingCardsContainer}>
                            <motion.div
                                className={styles.floatingCard}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <FiMonitor />
                                <span>After Effects</span>
                            </motion.div>

                            <motion.div
                                className={styles.floatingCard}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                            >
                                <FiScissors />
                                <span>Premiere</span>
                            </motion.div>

                            <motion.div
                                className={styles.floatingCard}
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                            >
                                <FiZap />
                                <span>Personal Brand</span>
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* === CTA BUTTONS === */}
                    <motion.div variants={itemVariants} className={styles.ctaSection}>
                        <motion.button
                            className={styles.primaryCta}
                            onClick={() => navigate('/paket')}
                            whileHover={{ scale: 1.03, y: -4 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span>PRIDRUŽI SE ODMAH</span>
                            <FiArrowRight className={styles.ctaIcon} />
                            <div className={styles.ctaShine}></div>
                        </motion.button>

                        <motion.button
                            className={styles.secondaryCta}
                            whileHover={{ scale: 1.02, borderColor: 'var(--narandzasta)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span>POGLEDAJ PROGRAM</span>
                            <FiChevronDown className={styles.ctaIconSecondary} />
                        </motion.button>
                    </motion.div>

                    {/* === FEATURES ROW === */}
                    <motion.div
                        ref={featuresRef}
                        className={styles.featuresRow}
                    >
                        {features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className={styles.featureItem}
                                custom={i}
                                initial="hidden"
                                animate={featuresInView ? "visible" : "hidden"}
                                variants={featureVariants}
                            >
                                <feature.icon className={styles.featureIcon} />
                                <span>{feature.text}</span>
                            </motion.div>
                        ))}
                    </motion.div>
                </motion.div>

                {/* === STATS SECTION (SCROLL REVEAL) === */}
                <motion.div
                    ref={statsRef}
                    className={styles.statsSection}
                    style={{ y: yContent }}
                >
                    <div className={styles.statsGrid}>
                        {stats.map((stat, i) => (
                            <motion.div
                                key={i}
                                className={styles.statCard}
                                custom={i}
                                initial="hidden"
                                animate={statsInView ? "visible" : "hidden"}
                                variants={statVariants}
                                whileHover={{
                                    y: -8,
                                    scale: 1.05,
                                    boxShadow: "0 20px 40px rgba(255, 69, 0, 0.2)"
                                }}
                            >
                                <div className={styles.statIconWrapper}>
                                    <stat.icon className={styles.statIcon} />
                                </div>
                                <h3 className={styles.statNumber}>{stat.number}</h3>
                                <p className={styles.statLabel}>{stat.label}</p>
                                <div className={styles.statGlow}></div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* === SCROLL INDICATOR === */}
                <motion.div
                    className={styles.scrollIndicator}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                >
                    <motion.div
                        className={styles.scrollMouse}
                        animate={{ y: [0, 8, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className={styles.scrollWheel}></div>
                    </motion.div>
                    <span>SKROLUJ</span>
                </motion.div>
            </div>


        </section>
    );
};

export default Hero;