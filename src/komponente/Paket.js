import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FiCheck, FiStar, FiZap, FiArrowRight, FiShield, FiTrendingUp } from "react-icons/fi";
import { useAuth } from '../login/auth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./Paket.css";

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

const Paket = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Paketi sa cenama u RSD (konvertovano iz EUR, 1 EUR ≈ 117 RSD)
  const plans = [
    {
      title: "STANDARD",
      price: "50€",
      priceNumeric: 5730,
      period: "/ 1 mesec",
      image: banner,
      icon: <FiZap />,
      highlight: false,
      packageId: "STANDARD_1M",
      description: "Savršen start za ambiciozne kreatore.",
      features: [
        "Kompletan Premiere Pro",
        "Kompletan After Effects",
        "Pristup platformi zauvek",
        "Redovni Update-ovi",
        "Pristup zajednici"
      ]
    },
    {
      title: "PRO",
      price: "140€",
      priceNumeric: 16380,
      period: "/ 3 meseca",
      image: animatedbanner,
      icon: <FiStar />,
      highlight: true,
      packageId: "PRO_3M",
      description: "Maksimalna vrednost za profesionalce.",
      features: [
        "Kompletan Premiere Pro",
        "Kompletan After Effects",
        "Pristup platformi zauvek",
        "Redovni Update-ovi",
        "Pristup zajednici"
      ]
    }
  ];

  const handlePurchaseClick = (plan) => {
    // Preusmeri na stranicu za informacije sa podacima o paketu
    navigate('/informacije', {
      state: {
        packageData: {
          id: plan.packageId,
          code: plan.packageId,
          name: `${plan.title} Paket - ${plan.period}`,
          title: plan.title,
          description: plan.description,
          amount: plan.priceNumeric,
          price: plan.price,
          period: plan.period
        }
      }
    });
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
      <section className="paket-section" ref={ref}>
        {/* Background Ambience matches Hero */}
        <div className="paket-ambience">
          <div className="paket-orb-1" />
          <div className="paket-orb-2" />
        </div>

        <div className="paket-container">
          <motion.div
            className="paket-header"
            initial={{ opacity: 0, y: -20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="paket-badge">
              <FiTrendingUp className="paket-badge-icon" />
              <span>INVESTIRAJ U SEBE</span>
            </div>
            <h2 className="paket-title">
              IZABERI SVOJ <span className="text-gradient">PUT</span>
            </h2>
            <p className="paket-subtitle">
              Cena jedne večere za veštinu koja ti donosi slobodu.
            </p>
          </motion.div>

          <motion.div
            className="paket-grid"
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                className={`paket-card ${plan.highlight ? 'paket-card-highlight' : ''}`}
                variants={cardVariants}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
              >
                {/* Card Glow Effect */}
                <div className="card-glow-bg" />

                {plan.highlight && (
                  <div className="card-popular-badge">
                    <FiStar /> NAJPOPULARNIJE
                  </div>
                )}

                <div className="card-image-wrap">
                  <img src={plan.image} alt={plan.title} className="card-bg-img" />
                  <div className="card-img-overlay" />
                  <div className="card-icon-box">{plan.icon}</div>
                </div>

                <div className="card-content">
                  <h3 className="card-title">{plan.title}</h3>
                  <p className="card-desc">{plan.description}</p>

                  <div className="card-price-box">
                    <span className="card-price">{plan.price}</span>
                    <span className="card-period">{plan.period}</span>
                  </div>

                  <div className="card-divider" />

                  <ul className="card-features">
                    {plan.features.map((feat, j) => (
                      <li key={j} className="card-feature-item">
                        <span className="feature-check"><FiCheck /></span>
                        {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`card-btn ${plan.highlight ? 'btn-highlight' : 'btn-standard'}`}
                    onClick={() => handlePurchaseClick(plan)}
                  >
                    <span className="btn-text">PRIDRUŽI SE</span>
                    <FiArrowRight className="btn-icon" />
                    <div className="btn-shine" />
                  </button>

                  <div className="card-footer-info">
                    <FiShield className="shield-icon" /> 100% Sigurna kupovina
                  </div>
                </div>

                {/* Decorative Corners */}
                <div className="corner-tl" />
                <div className="corner-br" />
              </motion.div>
            ))}

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

              {/* Spacer div to enforce separation if needed conceptually, but flex gap handles it */}

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

export default Paket;