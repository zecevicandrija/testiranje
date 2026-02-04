import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

const Checkout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [ime, setIme] = useState('');
    const [prezime, setPrezime] = useState('');
    const [email, setEmail] = useState('');
    const [telefon, setTelefon] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (location.state && location.state.items) {
            setItems(location.state.items);
        } else {
            // Ako nema itema, vrati korisnika u korpu
            navigate('/korpa');
        }

        // Učitaj podatke korisnika iz localStorage ako postoje
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            if (user.ime) setIme(user.ime);
            if (user.prezime) setPrezime(user.prezime);
            if (user.email) setEmail(user.email);
        }
    }, [location, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (items.length === 0) {
            setError('Nema kurseva za kupovinu.');
            setIsLoading(false);
            return;
        }

        //Uzimamo prvi kurs iz korpe za obradu
        const kursZaKupovinu = items[0];

        try {
            // Za guest checkout, korisnikId je null
            const userData = localStorage.getItem('user');
            const korisnikId = userData ? JSON.parse(userData).id : null;

            // Poziv backend-a za kreiranje MSU sesije
            const requestData = {
                customerEmail: email,
                customerName: `${ime} ${prezime}`,
                customerPhone: telefon,
                kursId: kursZaKupovinu.id
            };

            // Dodaj korisnikId samo ako je ulogovan
            if (korisnikId) {
                requestData.korisnikId = korisnikId;
            }

            const response = await axios.post('https://test-api.zecevicdev.com/api/msu/create-session', requestData);

            if (response.data.success && response.data.redirectUrl) {
                // Preusmeri korisnika na MSU HPP stranicu
                window.location.href = response.data.redirectUrl;
            } else {
                setError('Greška pri kreiranju sesije plaćanja. Pokušajte ponovo.');
                setIsLoading(false);
            }

        } catch (err) {
            console.error('Error creating payment session:', err);
            setError(err.response?.data?.error || 'Došlo je do greške. Molimo pokušajte ponovo.');
            setIsLoading(false);
        }
    };

    if (items.length === 0) {
        return <div className="checkout-container">Učitavanje...</div>;
    }

    return (
        <div className="checkout-container">
            <h2>Završetak Kupovine</h2>
            <div className="order-summary">
                <h3>Pregled porudžbine:</h3>
                <p>Naziv: <strong>{items[0].naziv}</strong></p>
                <p>Cena: <strong>{items[0].cena} RSD</strong></p>
            </div>

            <form onSubmit={handleSubmit} className="checkout-form">
                <h3>Vaši podaci</h3>
                <div className="form-group">
                    <label htmlFor="ime">Ime</label>
                    <input
                        type="text"
                        id="ime"
                        value={ime}
                        onChange={(e) => setIme(e.target.value)}
                        placeholder="Unesite Vaše ime"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="prezime">Prezime</label>
                    <input
                        type="text"
                        id="prezime"
                        value={prezime}
                        onChange={(e) => setPrezime(e.target.value)}
                        placeholder="Unesite Vaše prezime"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email adresa</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="primer@gmail.com"
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="telefon">Telefon (opciono)</label>
                    <input
                        type="tel"
                        id="telefon"
                        value={telefon}
                        onChange={(e) => setTelefon(e.target.value)}
                        placeholder="+381 60 123 4567"
                    />
                </div>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" disabled={isLoading} className="submit-button">
                    {isLoading ? 'Obrada...' : 'Pređi na plaćanje'}
                </button>
            </form>
        </div>
    );
};

export default Checkout;