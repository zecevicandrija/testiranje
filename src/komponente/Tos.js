// Tos.js
import React, { useEffect } from 'react';
import './Tos.css';

const Tos = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="tos-wrapper">
      <div className="container tos-container">
        <header className="tos-hero fade-in-section is-visible">
          <h1 className="section-title">Uslovi korišćenja — <span className="highlight-text">Motion Akademija</span></h1>
          <p className="section-subtitle">
            Molimo vas da pažljivo pročitate i razumete ove uslove pre nego što pristupite ili koristite našu platformu.
            Korišćenjem Motion Akademije potvrđujete da ste pročitali, razumeli i prihvatate sve odredbe navedene u nastavku.
          </p>
        </header>

        <main className="tos-card fade-in-section is-visible">
          <section className="tos-section">
            <h2>1. Prihvatanje uslova</h2>
            <p>
              Pristupom i korišćenjem naše platforme, pristajete da budete obavezani ovim uslovima korišćenja.
              Ako se ne slažete sa bilo kojom tačkom ovih uslova, molimo vas da ne koristite našu platformu.
            </p>
          </section>

          <section className="tos-section">
            <h2>2. Registracija i pristup sadržaju</h2>
            <ul>
              <li>Pojedini delovi sadržaja dostupni su isključivo korisnicima sa plaćenim pristupom.</li>
              <li>Da biste koristili takav sadržaj, potrebno je da se registrujete i izvršite uplatu prema važećem cenovniku.</li>
              <li>Pri registraciji se obavezujete da navedete tačne, potpune i ažurirane podatke.</li>
            </ul>
          </section>

          <section className="tos-section">
            <h2>3. Odgovornost korisnika</h2>
            <ul>
              <li>Dužni ste da čuvate poverljivost svojih pristupnih podataka (korisničko ime i lozinka).</li>
              <li>Zabranjeno je deljenje naloga sa drugim osobama.</li>
              <li>Odgovorni ste za sve aktivnosti koje se odvijaju putem vašeg naloga.</li>
            </ul>
          </section>

          <section className="tos-section">
            <h2>4. Autorska prava</h2>
            <p>
              Sav sadržaj na Motion Akademiji (video materijali, tekstovi, slike, grafike i drugi materijali)
              zaštićen je autorskim pravima i drugim pravima intelektualne svojine. Nije dozvoljeno kopiranje,
              reprodukcija, distribucija, javno prikazivanje, prepravljanje ili bilo kakvo korišćenje sadržaja
              bez našeg pismenog odobrenja.
            </p>
          </section>

          <section className="tos-section">
            <h2>5. Ograničenje odgovornosti</h2>
            <p>
              Motion Akademija ne snosi odgovornost za eventualne gubitke, štete ili neprijatnosti nastale korišćenjem
              naše platforme ili nemogućnošću pristupa sadržaju. Trudimo se da svi materijali budu tačni i ažurni,
              ali ne garantujemo potpunu bezgrešnost sadržaja.
            </p>
          </section>
          {/* 
          <section className="tos-section">
            <h2>6. Povrat novca i otkazivanje</h2>
            <ul>
              <li>Nakon izvršene kupovine, povrat novca nije moguć jer se sav materijal odmah otključava po uplati.</li>
              <li>
                Ukoliko ne želite da nastavljate pretplatu, potrebno je da je otkažete preko sajta ili nas kontaktirate najmanje
                <strong> 24 sata pre</strong> datuma njenog automatskog obnavljanja.
              </li>
            </ul>
          </section> */}

          <section className="tos-section">
            <h2>6. Izmene uslova korišćenja</h2>
            <p>
              Zadržavamo pravo da u bilo kom trenutku izmenimo ove uslove. O svim izmenama bićete obavešteni putem
              naše platforme ili e-pošte. Nastavak korišćenja platforme nakon objavljenih izmena znači da prihvatate
              nove uslove.
            </p>
          </section>

          <section className="tos-section">
            <h2>7. Prestanak korišćenja</h2>
            <p>
              Možete prestati da koristite Motion Akademiju u bilo kom trenutku jednostavnim prekidom subskripcije. Pretplata će se automatski obnavljati dok je ne otkažete.
              Zadržavamo pravo da suspendujemo ili ukinemo vaš nalog bez prethodne najave ako prekršite ove uslove.
            </p>
          </section>
          <section className="tos-section">
            <h2>8. Ostale informacije</h2>
            <p>
              Ostale informacije za Privacy Policy i Refund Policy mozete pogledati na sledećim linkovima:
              <li>https://localhost:3000/refund-policy</li>
              <li>https://localhost:3000/privacy-policy</li>
            </p>
          </section>

          <footer className="tos-footer">
            <p><strong>Kontakt:</strong> <a href="mailto:motionfilip@gmail.com">motionfilip@gmail.com</a></p>
            <p className="small-note">© {new Date().getFullYear()} Motion Akademija. Sva prava zadržana.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Tos;
