import React from 'react';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Pocetna from './komponente/Pocetna';
import KursLista from './komponente/KursLista';
import DodajKurs from './komponente/DodajKurs';
import LoginPage from './login/LoginPage';
import SignUpPage from './login/SignUpPage';
import DodajKorisnika from './login/DodajKorisnika';
import { AuthProvider } from './login/auth';
import Navbar from './Navigacija/Navbar';
import KursDetalj from './komponente/KursDetalj';
import Lekcije from './komponente/Lekcije';
import MojProfil from './login/MojProfil';
import KupljenKurs from './komponente/KupljenKurs';
import Instruktor from './Instruktori/Instruktor';
import ProtectedRoute from './komponente/ProtectedRoutes';
import Nepostojeca from './komponente/Nepostojeca';
import Studenti from './Instruktori/Studenti';
import Korpa from './Kupovina/Korpa';
import { ThemeProvider } from './komponente/ThemeContext';
import Kviz from './Instruktori/Kviz';
import Checkout from './Kupovina/Checkout';
import PaymentResult from './Kupovina/PaymentResult';
import EditKursa from './Instruktori/EditKursa';
import Statistika from './Instruktori/Statistika';
import Paket from './komponente/Paket';
import Produzivanje from './komponente/Produzivanje';
import Informacije from './komponente/Informacije';
import Tos from './komponente/Tos';
import RefundPolicy from './komponente/RefundPolicy';
import PrivacyPolicy from './komponente/PrivacyPolicy';

import './App.css';

const App = () => {

  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<Pocetna />} />
            <Route path="/kursevi" element={<KursLista />} />
            <Route path="/dodajkurs" element={<ProtectedRoute element={<DodajKurs />} allowedRoles={['admin', 'instruktor']} />} />
            <Route path="/login" element={<LoginPage />} />
            {/* <Route path="/signup" element={<SignUpPage />} /> */}
            <Route path="/dodajkorisnika" element={<ProtectedRoute element={<DodajKorisnika />} allowedRoles={['admin']} />} />
            <Route path="/kurs/:id" element={<KursDetalj />} />
            <Route path="/lekcije" element={<ProtectedRoute element={<Lekcije />} allowedRoles={['admin', 'instruktor']} />} />
            <Route path="/profil" element={<MojProfil />} />
            <Route path="/kupljenkurs" element={<KupljenKurs />} />
            <Route path="/studenti/:kursId" element={<ProtectedRoute element={<Studenti />} allowedRoles={['admin', 'instruktor']} />} />
            <Route
              path="/instruktor"
              element={<ProtectedRoute element={<Instruktor />} allowedRoles={['admin', 'instruktor']} />}
            />
            <Route path="/korpa" element={<Korpa />} />
            <Route path="/napravikviz" element={<ProtectedRoute element={<Kviz />} allowedRoles={['admin', 'instruktor']} />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/placanje/rezultat" element={<PaymentResult />} />
            <Route path="/edit-kurs/:kursId" element={<EditKursa />} allowedRoles={['admin', 'instruktor']} />
            <Route path="/statistika/:kursId" element={<Statistika />} allowedRoles={['admin', 'instruktor']} />
            <Route path="/paket" element={<Paket />} />
            <Route path="/produzivanje" element={<Produzivanje />} />
            <Route path="/informacije" element={<Informacije />} />
            <Route path="/tos" element={<Tos />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/nevazeca" element={<Nepostojeca />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
