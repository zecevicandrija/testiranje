// src/components/KursDetalj.js
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../login/api.js';
import { useAuth } from '../login/auth.js';
import './KursDetalj.css';
import Komentari from '../Instruktori/Komentari.js';
import PrikazKviza from './PrikazKviza.js';
import Editor from '@monaco-editor/react';
import Hls from 'hls.js';

if (typeof window !== "undefined" && !window.Hls) {
    window.Hls = Hls;
}

// Preporuka: Zamenite klase sa Remix Icon klasama radi konzistentnosti
const PlayIcon = () => <i className="ri-play-circle-line"></i>;
const AssignmentIcon = () => <i className="ri-file-text-line"></i>;
const HeartIcon = ({ filled }) => <i className={filled ? "ri-heart-fill" : "ri-heart-line"}></i>;

const KursDetalj = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [kurs, setKurs] = useState(null);
    const [lekcije, setLekcije] = useState([]);
    const [sekcije, setSekcije] = useState([]);
    const [otvorenaLekcija, setOtvorenaLekcija] = useState(null);
    const [wishlisted, setWishlisted] = useState(false);
    const [kupioKurs, setKupioKurs] = useState(false);
    const [completedLessons, setCompletedLessons] = useState(new Set());
    const [completedLessonsLoaded, setCompletedLessonsLoaded] = useState(false);
    const [quiz, setQuiz] = useState([]);
    const [code, setCode] = useState('// Unesite svoj kod ovde');
    const [language, setLanguage] = useState('javascript');
    const [showEditor, setShowEditor] = useState(false);
    const [savedCodes, setSavedCodes] = useState({});
    const [reviewFeedback, setReviewFeedback] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const [currentStreamUrl, setCurrentStreamUrl] = useState('');
    const [searchParams] = useSearchParams();

    const imaAktivnuPretplatu = user && user.subscription_expires_at && new Date(user.subscription_expires_at) > new Date();

    // Moved up to be available for hooks
    const isCourseAccessible = kurs ? (kupioKurs && (!kurs.is_subscription || imaAktivnuPretplatu)) : false;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kursResponse, lekcijeResponse, sekcijeResponse] = await Promise.all([
                    api.get(`/api/kursevi/${id}`),
                    api.get(`/api/lekcije/course/${id}`),
                    api.get(`/api/lekcije/sections/${id}`)
                ]);

                setKurs(kursResponse.data);
                setLekcije(lekcijeResponse.data);
                setSekcije(sekcijeResponse.data);

                // === NOVA, POBOLJŠANA LOGIKA ===
                // === NOVA, POBOLJŠANA LOGIKA ===
                const sekcijaIdFromUrl = searchParams.get('sekcija'); // Čitamo ID iz "?sekcija=..."

                if (sekcijaIdFromUrl) {
                    // Ako postoji ID u URL-u, otvaramo tu sekciju
                    const secId = parseInt(sekcijaIdFromUrl, 10);
                    setActiveSection(secId);

                    // NAPOMENA: Otvaranje lekcije se sada dešava u zasebnom useEffect-u
                    // koji prati status učitanih lekcija i completedLessons
                } else if (sekcijeResponse.data.length > 0) {
                    // Ako ne postoji, otvaramo prvu sekciju kao i do sada
                    setActiveSection(sekcijeResponse.data[0].id);
                }

                if (user) {
                    // Proveri i ažuriraj subscription status
                    try {
                        await api.get('/api/subscription/status');
                    } catch (subscriptionError) {
                        console.log('Subscription check:', subscriptionError.response?.data);
                    }

                    const kupovinaResponse = await api.get(`/api/kupovina/user/${user.id}`);
                    const purchased = kupovinaResponse.data.some(c => c.id === parseInt(id));
                    setKupioKurs(purchased);

                    // UKLONJENO: Dobavljanje rating-a više nije potrebno

                    const completedResponse = await api.get(`/api/kompletirane_lekcije/user/${user.id}/course/${id}`);
                    setCompletedLessons(new Set(completedResponse.data));
                    setCompletedLessonsLoaded(true);

                    const wishlistResponse = await api.get(`/api/wishlist/check`, {
                        params: { korisnik_id: user.id, kurs_id: id }
                    });
                    setWishlisted(wishlistResponse.data.exists);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchData();
    }, [id, user, searchParams]);


    // DODATO: Računanje ukupnog progresa celog kursa
    const totalProgress = useMemo(() => {
        if (lekcije.length === 0) return 0;
        const progress = (completedLessons.size / lekcije.length) * 100;
        return Math.round(progress);
    }, [completedLessons, lekcije]);


    // UKLONJENO: handleRatingSubmit funkcija više nije potrebna

    const handleLessonClick = async (lekcijaId) => {
        // Provera da li je lekcija dostupna (da li je korisnik kupio kurs i ima aktivnu pretplatu)
        if (!isCourseAccessible) return;
        const lekcija = lekcije.find(l => l.id === lekcijaId);
        if (!lekcija) return;

        setOtvorenaLekcija(lekcija);
        setCurrentStreamUrl('');
        setReviewFeedback(null);

        if (lekcija.video_url) {
            try {
                const response = await api.get(`/api/lekcije/${lekcija.id}/stream`);
                setCurrentStreamUrl(response.data.url);
            } catch (error) {
                console.error("Greška pri dohvatanju video linka:", error);

                // Ako je 403 error - subscription je istekao
                if (error.response?.status === 403) {
                    // Ne postavljamo streamUrl - komponenta će prikazati expired poruku
                    // jer će isCourseAccessible biti false nakon refresh-a user podataka
                    const errorData = error.response?.data;
                    alert(errorData?.message || "Vaša pretplata je istekla. Molimo vas da produžite pristup.");
                    // Osvježi user podatke da bi isCourseAccessible bio tačan
                    window.location.reload();
                } else {
                    alert("Nije moguće učitati video.");
                    setCurrentStreamUrl('error');
                }
            }
        }

        await fetchQuiz(lekcijaId);

        if (lekcija.assignment) {
            setShowEditor(true);
            determineLanguage(lekcija.assignment);
            setCode(savedCodes[lekcijaId] || getDefaultCode(language));
        } else {
            setShowEditor(false);
        }
    };

    // NOVA LOGIKA: Automatsko puštanje lekcije kada se izabere sekcija
    useEffect(() => {
        const sekcijaIdFromUrl = searchParams.get('sekcija');
        // Čekamo da se učitaju lekcije i completedLessons pre nego što odlučimo
        // Takođe proveravamo da li je već otvorena neka lekcija da ne bismo pregazili izbor korisnika
        if (sekcijaIdFromUrl && lekcije.length > 0 && !otvorenaLekcija && user && completedLessonsLoaded) {
            const sekcijaId = parseInt(sekcijaIdFromUrl, 10);
            const lekcijeUSekciji = lekcije.filter(l => l.sekcija_id === sekcijaId);

            if (lekcijeUSekciji.length > 0) {
                // Nađi prvu lekciju koja NIJE završena
                const prvaNezavrsena = lekcijeUSekciji.find(l => !completedLessons.has(l.id));

                // Ako su sve završene (prvaNezavrsena je undefined), pusti prvu u sekciji
                const lekcijaZaPustanje = prvaNezavrsena || lekcijeUSekciji[0];

                if (lekcijaZaPustanje && isCourseAccessible) {
                    handleLessonClick(lekcijaZaPustanje.id);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lekcije, completedLessons, completedLessonsLoaded, searchParams, user, isCourseAccessible]);

    // Navigacija između lekcija
    const handleNextLesson = () => {
        if (!otvorenaLekcija) return;
        const currentIndex = lekcije.findIndex(l => l.id === otvorenaLekcija.id);
        if (currentIndex !== -1 && currentIndex < lekcije.length - 1) {
            handleLessonClick(lekcije[currentIndex + 1].id);
        }
    };

    const handlePrevLesson = () => {
        if (!otvorenaLekcija) return;
        const currentIndex = lekcije.findIndex(l => l.id === otvorenaLekcija.id);
        if (currentIndex > 0) {
            handleLessonClick(lekcije[currentIndex - 1].id);
        }
    };



    const handleCompletionToggle = async (lessonId) => {
        if (!user) return;

        const isCompleted = completedLessons.has(lessonId);
        const updatedCompletedLessons = new Set(completedLessons);

        try {
            if (isCompleted) {
                await api.delete('/api/kompletirane_lekcije', {
                    data: {
                        korisnik_id: user.id,
                        lekcija_id: lessonId
                    }
                });
                // Ako je API poziv uspeo, uklanjamo lekciju iz lokalnog stanja
                updatedCompletedLessons.delete(lessonId);

            } else {
                await api.post('/api/kompletirane_lekcije', {
                    korisnik_id: user.id,
                    kurs_id: id,
                    lekcija_id: lessonId
                });
                updatedCompletedLessons.add(lessonId);
            }
            setCompletedLessons(updatedCompletedLessons);
        } catch (err) {
            console.error("Greška pri ažuriranju statusa lekcije:", err);
        }
    };

    const fetchQuiz = async (lessonId) => {
        try {
            const { data } = await api.get(`/api/kvizovi/lesson/${lessonId}`);
            const parsed = data.pitanja.map(p => ({
                ...p,
                answers: Array.isArray(p.answers) ? p.answers : JSON.parse(p.answers)
            }));
            setQuiz(parsed);
        } catch (e) {
            setQuiz([]);
        }
    };

    const determineLanguage = (assignment) => {
        const text = assignment.toLowerCase();
        if (text.includes('react') || text.includes('jsx')) setLanguage('javascript');
        else if (text.includes('html')) setLanguage('html');
        else if (text.includes('css')) setLanguage('css');
        else setLanguage('javascript');
    };

    const getDefaultCode = (lang) => {
        switch (lang) {
            case 'html': return '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page Title</title>\n</head>\n<body>\n\n</body>\n</html>';
            case 'css': return '/* Add your CSS here */\nbody {\n  margin: 0;\n  padding: 0;\n}';
            default: return '// Unesite svoj JavaScript kod ovde';
        }
    };

    const handleSaveCode = async () => {
        if (!otvorenaLekcija?.id || !user) return;
        try {
            await api.post('/api/saved-codes', {
                user_id: user.id,
                lesson_id: otvorenaLekcija.id,
                code,
                language
            });
            setSavedCodes({ ...savedCodes, [otvorenaLekcija.id]: code });
            alert('Kod je uspešno sačuvan!');
        } catch {
            alert('Došlo je do greške pri čuvanju koda');
        }
    };

    const handleWishlistToggle = async () => {
        if (!user) return;
        try {
            if (wishlisted) {
                await api.delete('/api/wishlist', { data: { korisnik_id: user.id, kurs_id: id } });
                setWishlisted(false);
            } else {
                await api.post('/api/wishlist', { korisnik_id: user.id, kurs_id: id });
                setWishlisted(true);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddToCart = () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        if (!cart.find(c => c.id === kurs.id)) {
            localStorage.setItem('cart', JSON.stringify([...cart, kurs]));
            window.dispatchEvent(new Event('cart-updated'));
        }
        navigate('/korpa');
    };

    const handleReviewCode = async () => {
        try {
            const { data } = await api.post('/api/lekcije/deepseek-review', { code, language });
            if (data.success) setReviewFeedback({ message: data.message });
            else setReviewFeedback({ message: 'AI nije vratio validan odgovor.', error: data.error });
        } catch (error) {
            setReviewFeedback({ message: 'Greška pri proveri koda.', error: error.message });
        }
    };

    const handleProduziPretplatu = async () => {
        if (!user) return navigate('/login');
        try {
            const response = await api.post('/api/placanje/kreiraj-checkout', {
                kurs_id: kurs.id,
                ime: user.ime,
                prezime: user.prezime,
                email: user.email,
            });
            if (response.data.url) {
                window.location.href = response.data.url;
            }
        } catch (error) {
            console.error("Greška pri produžavanju pretplate:", error);
            alert("Došlo je do greške, molimo pokušajte ponovo.");
        }
    };

    if (!kurs) return <div className="loading">Učitavanje...</div>;

    if (!kurs) return <div className="loading">Učitavanje...</div>;

    // const isCourseAccessible was moved up

    const renderContentWithLinks = (text) => {
        if (!text) return null;

        // Regex to match URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;

        // Split text by URL
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="lesson-link"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <div className="course-detail-page">
            <div className="course-header">
                <div className="header-content">
                    <h1 className="course-title-header">{kurs.naziv}</h1>
                    <p className="course-subtitle">{kurs.opis}</p>
                </div>
            </div>

            <div className="course-layout-wrapper">
                <aside className="sidebar-left">
                    <div className="sidebar-sticky-content">
                        <div className="course-actions-card">
                            {!kupioKurs ? (
                                <>
                                    <div className="price-tag">{kurs.cena} €</div>
                                    <button onClick={handleAddToCart} className="btn btn-purchase">Dodaj u korpu</button>
                                </>
                            ) : (
                                // IZMENJENO: Umesto rating sekcije, prikazujemo progress bar widget
                                <div className="course-progress-widget">
                                    <h4>Ukupan Progres</h4>
                                    <div className="progres-container">
                                        <div className="progres-info">
                                            <span>Završeno lekcija</span>
                                            <span className="procenti-broj">
                                                {`${completedLessons.size} / ${lekcije.length}`}
                                            </span>
                                        </div>
                                        <div className="progres-bar">
                                            <div
                                                className="progres-popunjeno"
                                                style={{ width: `${totalProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <div className="procenti-broj-large">{`${totalProgress}%`}</div>
                                </div>
                            )}
                        </div>

                        <div className="lessons-list-card">
                            <h4>Sadržaj</h4>
                            {sekcije.map(sekcija => (
                                <div key={sekcija.id} className="lesson-section">
                                    <h5
                                        className="section-header"
                                        onClick={() => setActiveSection(activeSection === sekcija.id ? null : sekcija.id)}
                                    >
                                        {sekcija.naziv}
                                        <span className={`chevron ${activeSection === sekcija.id ? 'expanded' : ''}`} />
                                    </h5>
                                    {activeSection === sekcija.id && (
                                        <ul className="lessons-list">
                                            {lekcije
                                                .filter(l => l.sekcija_id === sekcija.id)
                                                .map(lekcija => (
                                                    <li
                                                        key={lekcija.id}
                                                        className={`lesson-item ${otvorenaLekcija?.id === lekcija.id ? 'active' : ''} ${!isCourseAccessible ? 'disabled' : ''}`}
                                                        onClick={() => isCourseAccessible && handleLessonClick(lekcija.id)}
                                                    >
                                                        <div className="lesson-item-title">
                                                            {lekcija.assignment ? <AssignmentIcon /> : <PlayIcon />}
                                                            <span>{lekcija.title}</span>
                                                        </div>
                                                        {isCourseAccessible && (
                                                            <label className="custom-checkbox-wrapper" title="Označi kao završeno">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={completedLessons.has(lekcija.id)}
                                                                    onChange={e => {
                                                                        e.stopPropagation();
                                                                        handleCompletionToggle(lekcija.id);
                                                                    }}
                                                                    className="lesson-complete-checkbox"
                                                                />
                                                                <span className="custom-checkmark"></span>
                                                            </label>
                                                        )}
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </aside>

                <div className="main-content-right">
                    {!kupioKurs ? (
                        <div className="welcome-card state-cta">
                            <h2>Učlanite se da biste pristupili sadržaju.</h2>
                            <p>Dodajte ga u korpu i započnite učenje danas!</p>
                            <button onClick={handleAddToCart} className="btn-purchase large">Dodaj u korpu</button>
                        </div>
                    ) : !isCourseAccessible ? (
                        <div className="welcome-card state-expired">
                            <h2>Vaša pretplata je istekla!</h2>
                            <p>Da biste nastavili sa pristupom ovom kursu, molimo Vas da produžite svoju pretplatu.</p>
                            <button onClick={() => navigate('/produzivanje')} className="btn-purchase large">Produži Pretplatu</button>
                        </div>
                    ) : !otvorenaLekcija ? (
                        <div className="welcome-card state-info">
                            <h2>Dobro došli nazad!</h2>
                            <p>Izaberite lekciju iz sadržaja da biste nastavili sa učenjem.</p>
                        </div>
                    ) : (
                        <>
                            <div className="content-display-area">
                                <div className="lesson-player-card">
                                    <h3>{otvorenaLekcija.title}</h3>
                                    {otvorenaLekcija.video_url && (
                                        <div className='player-wrapper'>
                                            {!currentStreamUrl && <div className="player-placeholder">Učitavanje videa...</div>}
                                            {currentStreamUrl === 'error' && <div className="player-placeholder">Greška pri učitavanju videa.</div>}
                                            {currentStreamUrl && currentStreamUrl !== 'error' && (
                                                <iframe
                                                    src={currentStreamUrl}
                                                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                                                    allowFullScreen={true}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        border: 'none',
                                                    }}
                                                ></iframe>
                                            )}
                                        </div>
                                    )}

                                    {/* DUGMAD ZA NAVIGACIJU */}
                                    <div className="lesson-navigation">
                                        <button
                                            className="nav-btn"
                                            onClick={handlePrevLesson}
                                            disabled={lekcije.findIndex(l => l.id === otvorenaLekcija.id) <= 0}
                                        >
                                            <i className="ri-arrow-left-s-line"></i> Prethodna
                                        </button>

                                        <div className="current-lesson-name">
                                            {otvorenaLekcija.title}
                                        </div>

                                        <button
                                            className="nav-btn"
                                            onClick={handleNextLesson}
                                            disabled={lekcije.findIndex(l => l.id === otvorenaLekcija.id) >= lekcije.length - 1}
                                        >
                                            Sledeca <i className="ri-arrow-right-s-line"></i>
                                        </button>
                                    </div>

                                    <div className="lesson-content-text">
                                        {renderContentWithLinks(otvorenaLekcija.content)}
                                    </div>
                                </div>
                            </div>

                            {otvorenaLekcija.assignment && (
                                <div className="assignment-card">
                                    <h3>Zadatak</h3>
                                    <p className="assignment-text">{otvorenaLekcija.assignment}</p>
                                    {showEditor && (
                                        <div className="code-editor-wrapper">
                                            <div className="editor-header">
                                                <h4>Code Editor</h4>
                                                <select value={language} onChange={e => setLanguage(e.target.value)}>
                                                    <option value="javascript">JavaScript</option>
                                                    <option value="html">HTML</option>
                                                    <option value="css">CSS</option>
                                                </select>
                                            </div>
                                            <Editor
                                                height="400px"
                                                language={language}
                                                theme="vs-dark"
                                                value={code}
                                                onChange={setCode}
                                                options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }}
                                            />
                                            <div className="editor-actions">
                                                <button className="btn btn-secondary" onClick={handleSaveCode}>Sačuvaj Kod</button>
                                                <button className="btn btn-primary" onClick={handleReviewCode}>Proveri Kod (AI)</button>
                                            </div>
                                            {reviewFeedback && (
                                                <div className="ai-feedback">
                                                    <h4>AI Povratna Informacija:</h4>
                                                    <pre>{reviewFeedback.message}</pre>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {quiz && quiz.length > 0 && (
                                <PrikazKviza quizData={quiz} />
                            )}
                        </>
                    )}
                </div>
            </div >
        </div >
    );
};

export default KursDetalj;