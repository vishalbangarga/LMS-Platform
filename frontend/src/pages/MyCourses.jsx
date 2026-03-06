import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { PlayCircle } from 'lucide-react';
import { API_URL } from '../config';

export default function MyCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyCourses = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_URL}/my-courses`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCourses(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchMyCourses();
    }, []);

    if (loading) return <div className="container mt-4">Loading your courses...</div>;

    return (
        <div className="container mt-4 mb-8">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>My Enrolled Courses</h1>

            {courses.length === 0 ? (
                <div className="card text-center" style={{ padding: '3rem' }}>
                    <p className="text-muted mb-4">You haven't enrolled in any courses yet.</p>
                    <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                    {courses.map(course => (
                        <div key={course.id} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '140px', backgroundColor: 'var(--border)', backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />

                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.25rem' }}>{course.category}</div>
                                <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem', lineHeight: 1.2 }}>{course.title}</h3>
                                <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>By {course.instructor_name}</div>
                            </div>

                            <div style={{ marginTop: 'auto' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    <span>Progress</span>
                                    <span>{course.progress_percentage}%</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border)', borderRadius: '3px', overflow: 'hidden', marginBottom: '1rem' }}>
                                    <div style={{ width: `${course.progress_percentage}%`, height: '100%', backgroundColor: 'var(--secondary)', transition: 'width 0.3s ease' }} />
                                </div>

                                <Link to={`/learn/${course.id}`} className="btn btn-outline w-full flex justify-center items-center gap-2">
                                    <PlayCircle size={16} /> Continue Learning
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
