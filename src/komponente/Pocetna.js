import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pocetna.css';
import rezultat5 from '../images/rezultat31.png';
import rezultat2 from '../images/rezultati23.png'
import rezultat3 from '../images/rezultat32.png'
import rezultat4 from '../images/rezultati4.png'
import { useInView } from 'react-intersection-observer';

// IMPORTUJEMO NOVU KOMPONENTU
import Hero from '../pocetna/Hero';
import Features from '../pocetna/Features';
import Testimonijal from '../pocetna/Testimonijal';
import Results from '../pocetna/Results';
import FAQ from '../pocetna/FAQ';
import Footer from '../pocetna/Footer';
import Motion from '../pocetna/Motion';

const ChevronIcon = ({ isOpen }) => <i className={`ri-arrow-down-s-line accordion-chevron ${isOpen ? 'open' : ''}`}></i>;

const AnimateOnScroll = ({ children }) => {
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.1,
    });

    return (
        <div ref={ref} className={`fade-in-section ${inView ? 'is-visible' : ''}`}>
            {children}
        </div>
    );
};


const Pocetna = () => {
    const navigate = useNavigate();
    return (
        <div className="pocetna-wrapper">
            <main className="pocetna-page">
                {/* 3. OBMOTAVAMO SVAKU SEKCIJU */}

                {/* HERO JE SADA POSEBNA KOMPONENTA */}
                <AnimateOnScroll>
                    <Hero navigate={navigate} />
                </AnimateOnScroll>

                <AnimateOnScroll>
                    <Motion navigate={navigate} />
                </AnimateOnScroll>

                <AnimateOnScroll>
                    <Features navigate={navigate} />
                </AnimateOnScroll>

                <AnimateOnScroll>
                    <Testimonijal />
                </AnimateOnScroll>

                <AnimateOnScroll>
                    <Results navigate={navigate} />
                </AnimateOnScroll>

                <AnimateOnScroll>
                    <FAQ navigate={navigate} />
                </AnimateOnScroll>
            </main>
            <Footer />
        </div>
    );
};

export default Pocetna;