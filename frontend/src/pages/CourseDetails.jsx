import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Book, PlayCircle, CheckCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function CourseDetails() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourseAndEnrollment = async () => {
            try {
                const res = await axios.get(`${API_URL}/course/${courseId}`);
                setCourse(res.data);

                if (user) {
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const enrollRes = await axios.get(`${API_URL}/course/${courseId}/check-enrollment`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setIsEnrolled(enrollRes.data.enrolled);
                        } catch (err) {
                            console.error("Error checking enrollment:", err);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourseAndEnrollment();
    }, [courseId, user]);

    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        setEnrolling(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/enroll`, { course_id: courseId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/learn/${courseId}`);
        } catch (err) {
            if (err.response?.data?.message === 'Already enrolled in this course') {
                navigate(`/learn/${courseId}`);
            } else {
                alert(err.response?.data?.message || 'Failed to enroll');
            }
            setEnrolling(false);
        }
    };

    if (loading) return <div className="container mt-4">Loading...</div>;
    if (!course) return <div className="container mt-4">Course not found</div>;

    return (
        <div>
            {/* Hero Section */}
            <div style={{ backgroundColor: '#111827', color: 'white', padding: '4rem 0' }}>
                <div className="container md:grid-cols-2" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '4rem', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>{course.category}</div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>{course.title}</h1>
                        <p style={{ fontSize: '1.125rem', color: '#9ca3af', marginBottom: '2rem', lineHeight: 1.6 }}>{course.description}</p>

                        <div className="flex items-center gap-6" style={{ marginBottom: '2rem' }}>
                            <div className="flex items-center gap-2">
                                <img src={`https://ui-avatars.com/api/?name=${course.instructor_name}&background=random`} alt="Instructor" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                <span style={{ fontWeight: 500 }}>{course.instructor_name}</span>
                            </div>
                            <div className="flex items-center gap-2 color-muted">
                                <Book size={18} /> {course.total_lessons} Lessons
                            </div>
                            <div className="flex items-center gap-2 color-muted">
                                <Clock size={18} /> {Math.floor(course.total_duration / 60)}h {course.total_duration % 60}m
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #374151' }}>
                        <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface)', color: 'var(--text-main)' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Ready to start learning?</h3>
                            {isEnrolled ? (
                                <Link to={`/learn/${courseId}`} className="btn btn-primary w-full flex justify-center items-center gap-2" style={{ padding: '1rem', fontSize: '1.125rem', marginBottom: '1rem' }}>
                                    Go to Course <PlayCircle size={20} />
                                </Link>
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    className="btn btn-primary w-full flex justify-center items-center gap-2"
                                    style={{ padding: '1rem', fontSize: '1.125rem', marginBottom: '1rem' }}
                                >
                                    {enrolling ? 'Enrolling...' : (
                                        <>Enroll Now <PlayCircle size={20} /></>
                                    )}
                                </button>
                            )}
                            <p className="text-center text-muted" style={{ fontSize: '0.875rem' }}>Full lifetime access. Access on mobile and TV.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Course Content</h2>

                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {course.sections?.map((section, idx) => (
                        <div key={section.id} style={{ borderBottom: idx !== course.sections.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Section {section.order_number}: {section.title}</span>
                                <span className="text-muted" style={{ fontWeight: 400 }}>{section.lessons?.length || 0} lessons</span>
                            </div>
                            <div style={{ padding: '0.5rem 0' }}>
                                {section.lessons?.map((lesson, lIdx) => (
                                    <div key={lesson.id} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <PlayCircle size={18} className="text-muted" style={{ marginTop: '0.125rem' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>{lIdx + 1}. {lesson.title}</div>
                                            {lesson.description && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{lesson.description}</div>}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{lesson.duration}m</div>
                                    </div>
                                ))}
                                {(!section.lessons || section.lessons.length === 0) && (
                                    <div style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>No lessons in this section yet.</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!course.sections || course.sections.length === 0) && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sections available for this course yet.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
