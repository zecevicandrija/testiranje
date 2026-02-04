import React, { useEffect, useState } from 'react';
import * as tus from 'tus-js-client';
import api from '../login/api';
import { useAuth } from '../login/auth';
import './Lekcije.css';

const Lekcije = () => {
    const [lekcije, setLekcije] = useState([]);
    const [courses, setCourses] = useState([]);
    const [sections, setSections] = useState([]);

    const [newLekcija, setNewLekcija] = useState({
        course_id: '',
        title: '',
        content: '',
        sekcija_id: '',
        assignment: ''
    });

    const [video, setVideo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchCourses = async () => {
            if (!user || !user.id) return;
            try {
                const endpoint = user.uloga === 'admin'
                    ? '/api/kursevi'
                    : `/api/kursevi/instruktor/${user.id}`;

                const response = await api.get(endpoint);
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses:', error);
            }
        };

        fetchCourses();
    }, [user]);

    const fetchSections = async (courseId) => {
        if (!courseId) {
            setSections([]);
            return;
        }
        try {
            const response = await api.get(`/api/lekcije/sections/${courseId}`);
            setSections(response.data);
        } catch (error) {
            console.error('Error fetching sections:', error);
            setSections([]);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewLekcija({ ...newLekcija, [name]: value });

        if (name === 'course_id') {
            setNewLekcija(prev => ({ ...prev, course_id: value, sekcija_id: '' }));
            fetchSections(value);
        }
    };

    const handleVideoChange = (e) => {
        setVideo(e.target.files[0]);
    };

    // Funkcija za direktan upload na Bunny putem TUS protokola
    const uploadVideoDirectly = (file, credentials) => {
        return new Promise((resolve, reject) => {
            const upload = new tus.Upload(file, {
                endpoint: 'https://video.bunnycdn.com/tusupload',
                retryDelays: [0, 3000, 5000, 10000, 20000, 60000],
                headers: {
                    AuthorizationSignature: credentials.authorizationSignature,
                    AuthorizationExpire: credentials.authorizationExpire,
                    VideoId: credentials.videoId,
                    LibraryId: credentials.libraryId,
                },
                metadata: {
                    filetype: file.type,
                    title: newLekcija.title,
                },
                onError: (error) => {
                    console.error('TUS upload error:', error);
                    reject(error);
                },
                onProgress: (bytesUploaded, bytesTotal) => {
                    const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
                    setUploadProgress(percentage);
                    setUploadStatus(`Uploading video: ${percentage}%`);
                },
                onSuccess: () => {
                    console.log('Video upload successful!');
                    setUploadStatus('Video uspešno uploadovan!');
                    resolve(credentials.videoId);
                }
            });

            // Proveri da li postoje prethodni uploadovi za nastavak
            upload.findPreviousUploads().then((previousUploads) => {
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }
                upload.start();
            });
        });
    };

    const handleAddLekcija = async (e) => {
        e.preventDefault();

        // Validacija
        if (!newLekcija.course_id || !newLekcija.sekcija_id || !newLekcija.title || !newLekcija.content || !video) {
            alert('Sva polja i video su obavezni, uključujući i odabir sekcije.');
            return;
        }

        setLoading(true);
        setUploadProgress(0);

        try {
            // FAZA 1: Dobij kredencijale za direktan upload
            setUploadStatus('Priprema uploada...');
            const credentialsResponse = await api.post('/api/lekcije/prepare-upload', {
                title: newLekcija.title
            });
            const credentials = credentialsResponse.data;

            // FAZA 2: Direktan upload videa na Bunny
            setUploadStatus('Započinjem upload videa...');
            const videoGuid = await uploadVideoDirectly(video, credentials);

            // FAZA 3: Sačuvaj metadata u bazu
            setUploadStatus('Čuvanje lekcije...');
            await api.post('/api/lekcije', {
                course_id: newLekcija.course_id,
                title: newLekcija.title,
                content: newLekcija.content,
                sekcija_id: newLekcija.sekcija_id,
                assignment: newLekcija.assignment,
                video_guid: videoGuid
            });

            alert('Lekcija uspešno dodata!');

            // Resetovanje forme
            setNewLekcija({ course_id: '', title: '', content: '', sekcija_id: '', assignment: '' });
            setVideo(null);
            setSections([]);
            setUploadProgress(0);
            setUploadStatus('');

            // Reset file input
            const fileInput = document.getElementById('video');
            if (fileInput) fileInput.value = '';

        } catch (error) {
            console.error('Error adding lesson:', error);
            alert(`Greška pri dodavanju lekcije: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lekcije-container">
            <h3 className='lekcijenaslov1'>Napravite Lekcije</h3>

            <form onSubmit={handleAddLekcija} className="add-lekcija-form">
                <div>
                    <label htmlFor="course_id">Izaberite kurs:</label>
                    <select
                        id="course_id"
                        name="course_id"
                        value={newLekcija.course_id}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">-- Izaberite kurs --</option>
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.naziv}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label htmlFor="sekcija_id">Sekcija:</label>
                    <select
                        id="sekcija_id"
                        name="sekcija_id"
                        value={newLekcija.sekcija_id}
                        onChange={handleInputChange}
                        required
                        disabled={!newLekcija.course_id || sections.length === 0}
                    >
                        <option value="">-- Izaberite sekciju --</option>
                        {sections.map((sekcija) => (
                            <option key={sekcija.id} value={sekcija.id}>
                                {sekcija.naziv}
                            </option>
                        ))}
                    </select>
                    {newLekcija.course_id && sections.length === 0 && <small>Ovaj kurs nema definisane sekcije. Dodajte ih prvo u admin panelu.</small>}
                </div>

                <div>
                    <label htmlFor="title">Naslov lekcije:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={newLekcija.title}
                        onChange={handleInputChange}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="content">Sadržaj lekcije:</label>
                    <textarea
                        id="content"
                        name="content"
                        value={newLekcija.content}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="video">Izaberite Video:</label>
                    <input
                        type="file"
                        id="video"
                        name="video"
                        accept="video/*"
                        onChange={handleVideoChange}
                        required
                    />
                </div>

                {/* Progress bar za upload */}
                {loading && (
                    <div className="upload-progress-container">
                        <div className="upload-progress-bar">
                            <div
                                className="upload-progress-fill"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <p className="upload-status">{uploadStatus}</p>
                    </div>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? 'Dodavanje...' : 'Dodaj Lekciju'}
                </button>
            </form>
        </div>
    );
};

export default Lekcije;