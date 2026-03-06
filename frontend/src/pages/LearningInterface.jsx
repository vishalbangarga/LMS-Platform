import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { PlayCircle, CheckCircle, Circle, ChevronLeft, ChevronRight, Menu, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import Chatbot from '../components/Chatbot';

export default function LearningInterface() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [course, setCourse] = useState(null);
    const [lessons, setLessons] = useState([]);
    const [progress, setProgress] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        const fetchLearningData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }
                const headers = { Authorization: `Bearer ${token}` };

                // Get course outline
                const courseRes = await axios.get(`${API_URL}/course/${courseId}`);
                setCourse(courseRes.data);

                // Get lessons mapping
                const lessonsRes = await axios.get(`${API_URL}/course/${courseId}/lessons`, { headers });
                setLessons(lessonsRes.data);

                // Get progress
                let progressRes = { data: { completed_lesson_ids: [] } };
                if (user) {
                    try {
                        progressRes = await axios.get(`${API_URL}/progress/${courseId}`, { headers });
                        setProgress(progressRes.data);
                    } catch (e) {
                        // Fallback empty progress if they are not allowed to track, but shouldn't error out hard.
                        setProgress(progressRes.data);
                    }
                }

                // Determine start lesson (first incomplete, or just first)
                if (lessonsRes.data.length > 0) {
                    const completedIds = progressRes.data.completed_lesson_ids || [];
                    const firstIncomplete = lessonsRes.data.find(l => !completedIds.includes(l.id));
                    setCurrentLesson(firstIncomplete || lessonsRes.data[0]);
                }
            } catch (err) {
                console.error(err);
                if (err.response?.status === 403) {
                    navigate(`/course/${courseId}`); // Not enrolled
                }
            } finally {
                setLoading(false);
            }
        };
        fetchLearningData();
    }, [courseId, navigate, user]);

    const markComplete = async () => {
        if (!currentLesson) return;

        // Eagerly update local state for instantaneous feedback
        if (!completedIds.includes(currentLesson.id)) {
            const newCompletedIds = [...completedIds, currentLesson.id];
            const newPercentage = lessons.length > 0 ? Math.round((newCompletedIds.length / lessons.length) * 100) : 0;

            setProgress(prev => ({
                ...(prev || {}),
                completed_lesson_ids: newCompletedIds,
                progress_percentage: newPercentage,
                completed_lessons: newCompletedIds.length,
                total_lessons: lessons.length
            }));
        }

        // Go to next lesson automatically right away so user isn't waiting on the background request
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (currentIndex < lessons.length - 1) {
            setCurrentLesson(lessons[currentIndex + 1]);
        }

        try {
            const token = localStorage.getItem('token');
            // Try to mark it in the backend
            try {
                await axios.post(`${API_URL}/progress`, {
                    course_id: courseId,
                    lesson_id: currentLesson.id
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (err) {
                console.error("Failed to save progress to backend:", err);
            }

            // Re-fetch progress silently in background to ensure it perfectly matches the DB state
            try {
                const progressRes = await axios.get(`${API_URL}/progress/${courseId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProgress(progressRes.data);
            } catch (err) {
                console.error("Failed to re-fetch progress:", err);
            }

        } catch (err) {
            console.error(err);
        }
    };

    const navigateLesson = (direction) => {
        const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
        if (direction === 'next' && currentIndex < lessons.length - 1) {
            setCurrentLesson(lessons[currentIndex + 1]);
        } else if (direction === 'prev' && currentIndex > 0) {
            setCurrentLesson(lessons[currentIndex - 1]);
        }
    };

    // Helper to extract YouTube ID
    const getYouTubeId = (url) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) return <div className="p-8 text-center mt-10">Loading Course Environment...</div>;
    if (!course) return <div className="p-8 text-center mt-10">Course not found</div>;

    const completedIds = progress?.completed_lesson_ids || [];

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 4rem)', overflow: 'hidden' }}>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', backgroundColor: 'var(--background)', position: 'relative' }}>
                {/* Header within player */}
                <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface)', color: 'var(--text-main)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ color: 'var(--text-main)' }}>
                            <Menu />
                        </button>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0, padding: 0 }}>{course.title}</h2>
                    </div>
                    {progress && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
                            <span>{progress.progress_percentage}% Complete</span>
                            <div style={{ width: '100px', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${progress.progress_percentage}%`, height: '100%', backgroundColor: 'var(--secondary)', transition: 'width 0.3s ease' }} />
                            </div>
                        </div>
                    )}
                </div>

                {/* Player Area */}
                {currentLesson ? (
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: 'black', position: 'relative' }}>
                            {getYouTubeId(currentLesson.youtube_url) ? (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={`https://www.youtube.com/embed/${getYouTubeId(currentLesson.youtube_url)}?rel=0&modestbranding=1`}
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    style={{ position: 'absolute', top: 0, left: 0 }}
                                ></iframe>
                            ) : (
                                <div style={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                                    Invalid YouTube URL
                                </div>
                            )}
                        </div>

                        {/* Current Lesson Details Container */}
                        <div style={{ padding: '2rem', flex: 1, backgroundColor: 'var(--surface)', color: 'var(--text-main)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>{currentLesson.title}</h1>
                                    <p style={{ color: 'var(--text-muted)' }}>{currentLesson.description}</p>
                                </div>
                                {(user.role === 'student' || user.role === 'instructor' || user.role === 'admin') && (
                                    <button
                                        onClick={markComplete}
                                        disabled={completedIds.includes(currentLesson.id)}
                                        className={`btn ${completedIds.includes(currentLesson.id) ? 'btn-outline' : 'btn-primary'}`}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        <CheckCircle size={18} />
                                        {completedIds.includes(currentLesson.id) ? 'Completed' : 'Mark as Complete'}
                                    </button>
                                )}
                            </div>

                            {/* Navigation controls */}
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button
                                    onClick={() => navigateLesson('prev')}
                                    className="btn btn-outline"
                                    disabled={lessons.findIndex(l => l.id === currentLesson.id) === 0}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <ChevronLeft size={16} /> Previous
                                </button>
                                <button
                                    onClick={() => navigateLesson('next')}
                                    className="btn btn-primary"
                                    disabled={lessons.findIndex(l => l.id === currentLesson.id) === lessons.length - 1}
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    Next <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-main)' }}>
                        No lessons available.
                    </div>
                )}
            </div>

            {/* Sidebar (Curriculum) */}
            {sidebarOpen && (
                <div style={{ width: '350px', borderLeft: '1px solid var(--border)', backgroundColor: 'var(--surface)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
                        Course Content
                    </div>
                    <div>
                        {course.sections?.map((section) => (
                            <div key={section.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', fontWeight: 600, fontSize: '0.875rem' }}>
                                    {section.title}
                                </div>
                                <div>
                                    {section.lessons?.map((lesson) => {
                                        const isCompleted = completedIds.includes(lesson.id);
                                        const isActive = currentLesson?.id === lesson.id;

                                        return (
                                            <div
                                                key={lesson.id}
                                                onClick={() => setCurrentLesson(lesson)}
                                                style={{
                                                    padding: '0.75rem 1rem',
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    gap: '0.75rem',
                                                    cursor: 'pointer',
                                                    backgroundColor: isActive ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                                                    borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle size={16} style={{ color: 'var(--secondary)', marginTop: '0.125rem', minWidth: '16px' }} />
                                                ) : isActive ? (
                                                    <PlayCircle size={16} style={{ color: 'var(--primary)', marginTop: '0.125rem', minWidth: '16px' }} />
                                                ) : (
                                                    <Circle size={16} className="text-muted" style={{ marginTop: '0.125rem', minWidth: '16px' }} />
                                                )}

                                                <div style={{ flex: 1, fontSize: '0.875rem' }}>
                                                    <div style={{ fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--primary)' : 'var(--text-main)', lineHeight: 1.3, marginBottom: '0.25rem' }}>
                                                        {lesson.title}
                                                    </div>
                                                    <div className="text-muted" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                        <Clock size={12} /> {lesson.duration}m
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Chatbot removed, relocating to App.jsx */}
        </div>
    );
}
