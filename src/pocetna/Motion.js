// Motion.js - LUXURY BRUTALIST VIDEO SHOWCASE
'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { FiBox, FiZap, FiFilm, FiUser, FiPlay } from 'react-icons/fi';
import { RiMagicLine } from 'react-icons/ri';
import styles from './Motion.module.css';

// Import videos
import reels1 from '../images/reels1.mp4';
import reels2 from '../images/reels2.mp4';
import reels3 from '../images/reel3.mp4';
import reels4 from '../images/reel4.mp4';

// --- PHONE VIDEO SCREEN ---
function PhoneScreen({ activeStep, steps }) {
    const currentStep = steps[activeStep] || steps[0];

    return (
        <div className={styles.screenInner}>
            <div className={styles.screenNotch}></div>

            {/* Dynamic glow based on step */}
            <motion.div
                className={styles.screenGlowBg}
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            <div className={styles.videoContent}>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        className={styles.videoContainer}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.5 }}
                    >
                        <video
                            key={currentStep.video}
                            src={currentStep.video}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className={styles.reelVideo}
                        />

                        {/* Video overlay with step number */}
                        <div className={styles.videoOverlay}>
                            <div className={styles.stepIndicator}>
                                <span className={styles.stepNum}>0{currentStep.id}</span>
                            </div>
                        </div>

                        {/* Scan line effect */}
                        <div className={styles.scanLine}></div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Bottom glow */}
            <div className={styles.screenGlow} />
        </div>
    );
}

// --- TEXT CARD ---
function TextCard({ step, index, activeStep, setActiveStep, isMobile, totalSteps, steps }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { margin: "-45% 0px -45% 0px" });

    const isActive = activeStep === index;
    const isPast = activeStep > index;

    useEffect(() => {
        if (isInView && !isMobile) {
            setActiveStep(index);
        }
    }, [isInView, index, setActiveStep, isMobile]);

    return (
        <div className={styles.cardWrapper} ref={ref}>
            {/* TIMELINE */}
            <div className={styles.timelineCol}>
                {index !== 0 && (
                    <div
                        className={styles.timelineLine}
                        style={{ background: isActive || isPast ? 'var(--narandzasta)' : 'rgba(255, 69, 0, 0.2)' }}
                    />
                )}

                <motion.div
                    className={styles.timelineDot}
                    animate={{
                        scale: isActive ? 1.3 : 1,
                        backgroundColor: isActive || isPast ? 'var(--narandzasta)' : 'rgba(20, 20, 20, 1)',
                        borderColor: isActive ? 'var(--narandzasta)' : 'rgba(255, 69, 0, 0.3)',
                        boxShadow: isActive ? '0 0 20px var(--narandzasta), 0 0 40px rgba(255, 69, 0, 0.3)' : 'none'
                    }}
                />

                {index !== totalSteps - 1 && (
                    <div
                        className={styles.timelineLine}
                        style={{ background: isPast ? 'var(--narandzasta)' : 'rgba(255, 69, 0, 0.2)' }}
                    />
                )}
            </div>

            {/* CARD */}
            <motion.div
                className={`${styles.stepCard} ${isActive ? styles.activeCard : ''}`}
                initial={{ opacity: 0.2, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
                onClick={() => isMobile && setActiveStep(index)}
            >
                {/* Big background number */}
                <div className={styles.bigBgNumber}>0{step.id}</div>

                <div className={styles.cardContent}>
                    <div className={styles.cardHeader}>
                        {/* Icon box */}
                        <motion.div
                            className={styles.iconBox}
                            animate={{
                                boxShadow: isActive ? '0 0 25px rgba(255, 69, 0, 0.4)' : 'none'
                            }}
                        >
                            <step.icon size={24} />
                        </motion.div>
                        <h3 className={styles.stepTitle}>{step.title}</h3>
                    </div>

                    <p className={styles.stepDesc}>{step.description}</p>

                    {/* Features list */}
                    <div className={styles.featuresList}>
                        {step.features.map((feature, i) => (
                            <motion.div
                                key={i}
                                className={styles.featureTag}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: isActive ? 1 : 0.5, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <FiPlay className={styles.featureIcon} />
                                <span>{feature}</span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Active glow border */}
                {isActive && (
                    <motion.div
                        layoutId="glowBorder"
                        className={styles.glowBorder}
                    />
                )}
            </motion.div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function Motion() {
    const [activeStep, setActiveStep] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    const steps = [
        {
            id: 1,
            title: "3D Animacije",
            shortTitle: "3D Motion",
            description: "Nauči kreirati impresivne 3D animacije koje će učiniti tvoje Reels-ove nezaboravnim. Od osnovnih transformacija do naprednih Cinema 4D tehnika.",
            video: reels1,
            icon: FiBox,
            features: ["Element 3D", "Camera Movements", "3D Tracking"]
        },
        {
            id: 2,
            title: "Profesionalni After Effects",
            shortTitle: "After Effects",
            description: "Savladaj After Effects kao profesionalac. Kompoziting, visual effects, motion tracking i napredne tehnike koje koriste vrhunski editori.",
            video: reels2,
            icon: RiMagicLine,
            features: ["Visual Effects", "Compositing", "Expressions"]
        },
        {
            id: 3,
            title: "Kreativni Video Editing",
            shortTitle: "Premiere Pro",
            description: "Od sirovih snimaka do viralnog sadržaja. Nauči montažu, color grading, audio dizajn i efekte koji će te izdvojiti od konkurencije.",
            video: reels3,
            icon: FiFilm,
            features: ["Color Grading", "Audio Design", "Transitions"]
        },
        {
            id: 4,
            title: "Gradi Personalni Brend",
            shortTitle: "Personal Brand",
            description: "Učim te kako da monetizuješ svoje veštine. Strategije za privlačenje klijenata, cenovnik usluga i izgradnja portfolija koji prodaje.",
            video: reels4,
            icon: FiUser,
            features: ["Portfolio", "Client Strategy", "Pricing"]
        }
    ];

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (!isMobile) return;
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [isMobile, steps.length]);

    const phoneY = isMobile ? "0vh" : (activeStep) * 45 + "vh";

    return (
        <motion.section
            className={styles.mainWrapper}
            id="kako-radi"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
        >
            {/* Background */}
            <div className={styles.bgGrid}></div>
            <div className={styles.bgGlowOrb}></div>
            <div className={styles.bgGlowOrb2}></div>

            {/* Mobile Header */}
            <div className={styles.mobileHeader}>
                <h2 className={styles.mainTitle}>ŠTA <span className={styles.gradientText}>NAUČIŠ?</span></h2>
            </div>

            <div className={styles.contentRow}>
                {/* Left Column: STICKY PHONE */}
                <div className={styles.stickyColumn}>
                    <motion.div
                        className={styles.movingPhoneWrapper}
                        animate={{ y: phoneY }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    >
                        <div className={styles.phoneFrame}>
                            <div className={styles.phoneButtons}></div>
                            <div className={styles.phoneSpeaker}></div>
                            <PhoneScreen activeStep={activeStep} steps={steps} />
                        </div>

                        {/* Animated blob behind phone */}
                        <motion.div
                            className={styles.blob}
                            animate={{
                                opacity: [0.3, 0.5, 0.3],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 3, repeat: Infinity }}
                        />

                        {/* Floating particles */}
                        <div className={styles.floatingParticles}>
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className={styles.floatParticle}
                                    animate={{
                                        y: [0, -20, 0],
                                        x: [0, (i % 2 === 0 ? 10 : -10), 0],
                                        opacity: [0.3, 0.7, 0.3]
                                    }}
                                    transition={{
                                        duration: 3 + i * 0.5,
                                        repeat: Infinity,
                                        delay: i * 0.3
                                    }}
                                    style={{
                                        left: `${10 + i * 15}%`,
                                        top: `${20 + (i % 3) * 25}%`
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                </div>

                {/* Right Column: SCROLLABLE CARDS */}
                <div className={styles.scrollColumn}>
                    <div className={styles.headerSpacer}>
                        <h2 className={styles.mainTitle}>ŠTA <span className={styles.gradientText}>NAUČIŠ?</span></h2>
                        <p className={styles.headerSubtitle}>Kompletna transformacija od početnika do profesionalnog video editora</p>
                    </div>

                    <div className={styles.cardsList}>
                        {steps.map((step, index) => (
                            <TextCard
                                key={index}
                                step={step}
                                index={index}
                                activeStep={activeStep}
                                setActiveStep={setActiveStep}
                                isMobile={isMobile}
                                totalSteps={steps.length}
                                steps={steps}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.section>
    );
}
