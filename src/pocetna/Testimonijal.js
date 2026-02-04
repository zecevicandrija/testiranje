'use client';

import React, { useState, useEffect } from 'react';
import { RiArrowLeftSLine, RiArrowRightSLine, RiDoubleQuotesL, RiStarFill } from 'react-icons/ri';
import styles from './Testimonijal.module.css';

const Testimonijal = () => {
    const testimonials = [
        { 
            name: 'Marko Nikolić', 
            role: 'Freelance Editor',
            text: 'Odmah nakon završetka sam dobio prva dva klijenta. Sistem rada koji se ovde uči je neverovatan.', 
            image: 'https://i.pravatar.cc/150?u=marko',
            rating: 5
        },
        { 
            name: 'Jelena Jovanović', 
            role: 'YouTuber',
            text: 'Najbolja investicija u moju karijeru. Lekcije su jasne, a mentor je uvek tu za pomoć.', 
            image: 'https://i.pravatar.cc/150?u=jelena',
            rating: 5
        },
        { 
            name: 'Stefan Stefanović', 
            role: 'Agencija Vlasnik',
            text: 'Mislio sam da znam osnove, ali ova akademija me je naučila profesionalnim tehnikama koje donose novac.', 
            image: 'https://i.pravatar.cc/150?u=stefan',
            rating: 5
        },
        { 
            name: 'Ana Anić', 
            role: 'Student',
            text: 'Sve preporuke! Od nule do prvog plaćenog projekta za manje od 3 meseca.', 
            image: 'https://i.pravatar.cc/150?u=ana',
            rating: 5
        },
        { 
            name: 'Nikola Nikolić', 
            role: 'Content Creator',
            text: 'Materijali su vrhunski. Ovo nije samo kurs, ovo je kompletna mapa do uspeha.', 
            image: 'https://i.pravatar.cc/150?u=nikola',
            rating: 5
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [cardsPerPage, setCardsPerPage] = useState(1);

    // Responsive logika za broj kartica
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setCardsPerPage(3);
            else if (window.innerWidth >= 768) setCardsPerPage(2);
            else setCardsPerPage(1);
        };

        handleResize(); // Inicijalni poziv
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const maxIndex = Math.max(0, testimonials.length - cardsPerPage);

    const scrollNext = () => {
        if (currentIndex < maxIndex) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const scrollPrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.bgGlow}></div>
            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                
                <div className={styles.header}>
                    <h2 className="section-title">REČI POLAZNIKA</h2>
                    <p className="section-subtitle">Ne veruj nama na reč. Veruj rezultatima.</p>
                </div>

                <div className={styles.carouselWrapper}>
                    <div className={styles.trackContainer}>
                        <div 
                            className={styles.track}
                            style={{ 
                                transform: `translateX(-${currentIndex * (100 / cardsPerPage)}%)`
                            }}
                        >
                            {testimonials.map((item, index) => (
                                <div 
                                    className={styles.cardWrapper} 
                                    key={index}
                                    style={{ flex: `0 0 ${100 / cardsPerPage}%` }}
                                >
                                    <div className={styles.card}>
                                        {/* Cyber dekoracije */}
                                        <div className={styles.cardBorderTop}></div>
                                        <div className={styles.cardBorderBottom}></div>
                                        <RiDoubleQuotesL className={styles.quoteIcon} />

                                        <p className={styles.text}>"{item.text}"</p>
                                        
                                        <div className={styles.stars}>
                                            {[...Array(item.rating)].map((_, i) => (
                                                <RiStarFill key={i} />
                                            ))}
                                        </div>

                                        <div className={styles.author}>
                                            <div className={styles.avatarWrapper}>
                                                <img src={item.image} alt={item.name} />
                                                <div className={styles.avatarRing}></div>
                                            </div>
                                            <div className={styles.authorInfo}>
                                                <h4>{item.name}</h4>
                                                <span>{item.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <button 
                        className={`${styles.navButton} ${styles.prev}`}
                        onClick={scrollPrev}
                        disabled={currentIndex === 0}
                    >
                        <RiArrowLeftSLine />
                    </button>
                    <button 
                        className={`${styles.navButton} ${styles.next}`}
                        onClick={scrollNext}
                        disabled={currentIndex === maxIndex}
                    >
                        <RiArrowRightSLine />
                    </button>
                </div>

                {/* Progress Bar (Vizuelni indikator) */}
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill}
                        style={{ 
                            width: `${((currentIndex + cardsPerPage) / testimonials.length) * 100}%` 
                        }}
                    ></div>
                </div>

            </div>
        </section>
    );
};

export default Testimonijal;