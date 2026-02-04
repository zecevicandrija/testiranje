'use client';

import React from 'react';
import { RiInstagramLine, RiYoutubeLine, RiArrowUpLine, RiMailLine } from 'react-icons/ri';
import styles from './Footer.module.css';

const Footer = () => {

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className={styles.footer}>
            {/* Laser linija na vrhu */}
            <div className={styles.topLine}></div>
            <div className={styles.topGlow}></div>

            <div className="container">
                <div className={styles.footerContent}>

                    {/* 1. Brend Kolona */}
                    <div className={styles.brandColumn}>
                        <h3 className={styles.logoText}>MOTION AKADEMIJA<span className={styles.dot}>.</span></h3>
                        <p className={styles.tagline}>
                            Tvoja prečica do profesionalne karijere video editora.
                            Bez lutanja, direktno do rezultata.
                        </p>
                        <div className={styles.contactItem}>
                            <RiMailLine />
                            <span>motionfilip@gmail.com</span>
                        </div>
                    </div>

                    {/* 2. Linkovi Kolona */}
                    <div className={styles.linksColumn}>
                        <h4>PRAVILA</h4>
                        <div className={styles.linksList}>
                            <a href="/tos" className={styles.link}>Uslovi Korišćenja</a>
                            <a href="/privacy-policy" className={styles.link}>Politika Privatnosti</a>
                            <a href="/refund-policy" className={styles.link}>Politika Povraćaja Novca</a>
                        </div>
                    </div>

                    {/* 3. Socials Kolona */}
                    <div className={styles.socialColumn}>
                        <h4>PRATI NAS</h4>
                        <div className={styles.socialGrid}>
                            <a href="https://www.instagram.com/filip.motion" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialIcon}>
                                <RiInstagramLine />
                            </a>
                            <a href="https://youtube.com/@filipmotion?si=LJx1cRMc10qlkxkq" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className={styles.socialIcon}>
                                <RiYoutubeLine />
                            </a>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>
                        © {new Date().getFullYear()} Motion Akademija
                    </p>

                    <button onClick={scrollToTop} className={styles.backToTop} aria-label="Back to top">
                        <RiArrowUpLine />
                    </button>
                </div>
            </div>
        </footer>
    );
};

export default Footer;