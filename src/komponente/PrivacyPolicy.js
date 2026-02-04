import React, { useEffect } from 'react';
import './Tos.css'; // Možeš koristiti isti CSS

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="tos-wrapper">
      <div className="container tos-container">
        <header className="tos-hero fade-in-section is-visible">
          <h1 className="section-title">Politika privatnosti — <span className="highlight-text">Motion Akademija</span></h1>
          <p className="section-subtitle">
            Vaša privatnost nam je izuzetno važna. Ova politika objašnjava koje podatke prikupljamo i kako ih koristimo.
          </p>
        </header>

        <main className="tos-card fade-in-section is-visible">
          <section className="tos-section">
            <h2>1. Koje informacije prikupljamo?</h2>
            <p>Prikupljamo sledeće vrste informacija:</p>
            <ul>
              <li><strong>Lični podaci koje nam dajete:</strong> Prilikom registracije i kupovine, tražimo od vas podatke kao što su ime, prezime i email adresa.</li>
              <li><strong>Podaci o plaćanju:</strong> Sva plaćanja se obrađuju preko našeg partnera, kompanije <a href='https://paddle.com' target='_blank'>Paddle.com</a>. Mi ne čuvamo, niti imamo pristup podacima o vašoj kreditnoj kartici. Paddle je odgovoran za sigurnost vaših finansijskih podataka.</li>
              <li><strong>Podaci o korišćenju:</strong> Prikupljamo informacije o vašoj interakciji sa našim sajtom, kao što su koje lekcije gledate i koliko vremena provodite na platformi. Ovo nam pomaže da poboljšamo našu uslugu.</li>
            </ul>
          </section>

          <section className="tos-section">
            <h2>2. Kako koristimo vaše informacije?</h2>
            <p>Vaše informacije koristimo za sledeće svrhe:</p>
            <ul>
              <li>Da bismo vam omogućili pristup i korišćenje platforme Motion Akademija.</li>
              <li>Za obradu vaših uplata i upravljanje vašom pretplatom.</li>
              <li>Da bismo vam slali važna obaveštenja o vašem nalogu, promenama uslova ili statusu pretplate.</li>
              <li>Za unapređenje našeg sajta, sadržaja i korisničkog iskustva.</li>
              <li>Za pružanje korisničke podrške.</li>
            </ul>
          </section>

          <section className="tos-section">
            <h2>3. Deljenje podataka sa trećim stranama</h2>
            <p>
              Ne prodajemo i ne iznajmljujemo vaše lične podatke. Podatke delimo isključivo sa pouzdanim partnerima koji su neophodni za funkcionisanje našeg servisa.
            </p>
          </section>

          <section className="tos-section">
            <h2>4. Kolačići (Cookies)</h2>
            <p>
              Naš sajt koristi kolačiće kako bi poboljšao funkcionalnost. Kolačići su male tekstualne datoteke koje se čuvaju na vašem uređaju. Koristimo ih za održavanje sesije (kako biste ostali ulogovani) i za analitiku korišćenja sajta.
            </p>
          </section>
          
          <section className="tos-section">
            <h2>5. Vaša prava</h2>
            <p>
              Imate pravo da u bilo kom trenutku zatražite pristup, ispravku ili brisanje vaših ličnih podataka. Takođe, možete povući saglasnost za obradu podataka. Za sve zahteve, molimo vas da nas kontaktirate.
            </p>
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

export default PrivacyPolicy;