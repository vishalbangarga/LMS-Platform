import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock, Book, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { getCourseThumbnail } from '../utils';


export default function Courses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [enrolledCourseIds, setEnrolledCourseIds] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCoursesAndEnrollments = async () => {
            try {
                // Fetch all courses
                const res = await axios.get(`${API_URL}/courses`);
                setCourses(res.data);

                // Fetch enrolled courses if student
                if (user?.role === 'student' || user?.role === 'admin') {
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const enrollRes = await axios.get(`${API_URL}/my-courses`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const ids = enrollRes.data.map(c => c.id);
                            setEnrolledCourseIds(ids);
                        } catch (err) {
                            console.error("Failed to fetch enrolled courses", err);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch courses", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCoursesAndEnrollments();
    }, [user]);

    if (loading) return <div className="container mt-4">Loading courses...</div>;

    return (
        <div className="container mt-4 mb-8">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Explore Courses</h1>

            {user?.role === 'instructor' ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Instructor Access Restricted</h2>
                    <p className="text-muted">As an instructor, you cannot enroll in courses. Please use the <Link to="/instructor" style={{ color: 'var(--primary)', fontWeight: 600 }}>Instructor Portal</Link> to manage your own courses.</p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" style={{ gap: '2rem' }}>
                        {courses.map(course => (
                            <div key={course.id} className="card flex flex-col" style={{ height: '100%' }}>
                                <div style={{ height: '160px', backgroundColor: '#e2e8f0', backgroundImage: `url(${getCourseThumbnail(course.thumbnail)})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                                            {course.category}
                                        </span>
                                        <div className="flex items-center gap-2" style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 600 }}>
                                            {course.total_reviews > 0 ? (
                                                <>
                                                    <Star size={14} fill="currentColor" /> {Number(course.average_rating || 0).toFixed(1)} 
                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: '0.25rem' }}>({course.total_reviews})</span>
                                                </>
                                            ) : (
                                                <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>New</span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: 1.3 }}>{course.title}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem', flex: 1 }}>{course.description?.substring(0, 100)}...</p>

                                    <div className="flex items-center gap-4 text-muted" style={{ fontSize: '0.875rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                                        <div className="flex items-center gap-2">
                                            <Book size={14} /> {course.total_lessons || 0} Lessons
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} /> {Math.floor((course.total_duration || 0) / 60)}h {(course.total_duration || 0) % 60}m
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                                            {Number(course.price) === 0 || !course.price ? (
                                                <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>Free</span>
                                            ) : (
                                                <span style={{ fontWeight: 'bold' }}>${Number(course.price).toFixed(2)}</span>
                                            )}
                                            <span style={{ margin: '0 0.5rem', color: 'var(--border)' }}>|</span>
                                            By <span style={{ color: 'var(--text-main)' }}>{course.instructor_name}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Link to={`/course/${course.id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>View</Link>

                                            {enrolledCourseIds.includes(course.id) ? (
                                                <Link to={`/learn/${course.id}`} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--primary)', borderColor: 'var(--primary)' }}>Enrolled ➔</Link>
                                            ) : Number(course.price) > 0 ? (
                                                <Link to={`/checkout/${course.id}`} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Buy Now</Link>
                                            ) : (
                                                <Link to={`/course/${course.id}`} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>Enroll</Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    {courses.length === 0 && (
                        <div className="text-center text-muted py-10">No courses available yet.</div>
                    )}
                </>
            )}
        </div>
    );
}
