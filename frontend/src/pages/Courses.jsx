import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Clock, Book, Star } from 'lucide-react';
import { API_URL } from '../config';

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axios.get(`${API_URL}/courses`);
                setCourses(res.data);
            } catch (err) {
                console.error("Failed to fetch courses", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) return <div className="container mt-4">Loading courses...</div>;

    return (
        <div className="container mt-4 mb-8">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Explore Courses</h1>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                {courses.map(course => (
                    <div key={course.id} className="card flex flex-col" style={{ height: '100%' }}>
                        <div style={{ height: '160px', backgroundColor: '#e2e8f0', backgroundImage: `url(${course.thumbnail || 'https://via.placeholder.com/400x200?text=Course'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />

                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                                    {course.category}
                                </span>
                                <div className="flex items-center gap-2" style={{ color: '#f59e0b', fontSize: '0.875rem', fontWeight: 600 }}>
                                    <Star size={14} fill="currentColor" /> 4.8
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
                                <Link to={`/course/${course.id}`} className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>View Course</Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {courses.length === 0 && (
                <div className="text-center text-muted py-10">No courses available yet.</div>
            )}
        </div>
    );
}
