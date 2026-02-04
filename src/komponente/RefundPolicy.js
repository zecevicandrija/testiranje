import React, { useEffect } from 'react';
import './Tos.css'; // Možeš koristiti isti CSS

const RefundPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="tos-wrapper">
      <div className="container tos-container">
        <header className="tos-hero fade-in-section is-visible">
          <h1 className="section-title">Politika povrata novca — <span className="highlight-text">Motion Akademija</span></h1>
          <p className="section-subtitle">
            Naša posvećenost fer poslovanju i Vašem zadovoljstvu.
          </p>
        </header>

        <main className="tos-card fade-in-section is-visible">
          <section className="tos-section">
            <h2>1. Garancija povrata novca od 7 dana</h2>
            <p>
              Verujemo u kvalitet naše akademije i želimo da budete u potpunosti sigurni u Vašu kupovinu. Zbog toga nudimo garanciju povrata novca u roku od <strong>7 dana</strong> od datuma vaše <strong>prve</strong> kupovine.
            </p>
            <p>
              Ova garancija Vam omogućava da se upoznate sa platformom i sadržajem, pod uslovom da su ispunjeni uslovi navedeni u nastavku. Garancija se ne odnosi na obnavljanje pretplate.
            </p>
          </section>

          <section className="tos-section">
            <h2>2. Uslovi za ostvarivanje prava na povrat</h2>
            <p>Da biste ostvarili pravo na povrat novca, sledeći uslovi moraju biti ispunjeni:</p>
            <ul>
              <li>
                <strong>Vremenski rok:</strong> Zahtev mora biti poslat putem emaila u roku od 7 kalendarskih dana od trenutka prve uplate.
              </li>
              <li>
                <strong>Obrazloženje zahteva:</strong> U zahtevu morate jasno i detaljno navesti razloge Vašeg nezadovoljstva. Potrebno je da objasnite zašto akademija nije ispunila Vaša očekivanja na osnovu informacija i obećanja predstavljenih na našem sajtu.
              </li>
            </ul>
          </section>

          <section className="tos-section">
            <h2>3. Kako zatražiti povrat novca?</h2>
            <p>
              Da biste zatražili povrat, pošaljite email na <a href="mailto:motionfilip@gmail.com">motionfilip@gmail.com</a> sa naslovom "Zahtev za povrat novca". U emailu obavezno navedite:
            </p>
             <ul>
                <li>Email adresu sa kojom ste se registrovali.</li>
                <li>Dokaz o uplati (potvrda od Paddle-a).</li>
                <li>Detaljno obrazloženje zahteva, kako je opisano u tački 2.</li>
            </ul>
            <p>
                Obradićemo vaš zahtev u najkraćem mogućem roku.
            </p>
          </section>
          
           <section className="tos-section">
            <h2>4. Situacije u kojima povrat novca NIJE moguć</h2>
            <p>
              Povrat novca neće biti odobren ukoliko:
            </p>
            <ul>
                <li>Je zahtev poslat nakon isteka roka od 7 dana.</li>
                <li>Se zahtev odnosi na obnovljenu pretplatu.</li>
                <li>U zahtevu nije pruženo jasno i detaljno obrazloženje.</li>
            </ul>
          </section>

          <footer className="tos-footer">
            <p><strong>Kontakt:</strong> <a href="mailto:motionfilip@gmail.com">motionfilip@gmail.com</a></p>
            <p className="small-note">Poslednje ažurirano: 15. Avgust 2025.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default RefundPolicy;