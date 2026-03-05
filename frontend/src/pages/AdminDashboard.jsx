import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen } from 'lucide-react';
import { API_URL } from '../config';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);

    // An admin would realistically have separate endpoints for platform stats
    // We'll reuse the course get endpoint for this basic implementation
    useEffect(() => {
        const fetchPlatformData = async () => {
            try {
                const res = await axios.get(`${API_URL}/courses`);
                setCourses(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPlatformData();
    }, []);

    // Placeholder admin features
    return (
        <div className="container mt-4 mb-8">
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Admin Dashboard</h1>

            <div className="grid md:grid-cols-2 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {/* This grid will expand to 2 cols on md screens due to our index.css class md:grid-cols-2 */}
                <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '50%', color: 'var(--secondary)' }}>
                        <BookOpen size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Courses</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{courses.length}</h3>
                    </div>
                </div>

                <div className="card" style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
                    <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '50%', color: 'var(--primary)' }}>
                        <Users size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Students</p>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>1,204</h3> {/* Display static string since API isn't setup for user count */}
                    </div>
                </div>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Platform Courses</h2>

            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Course Title</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Instructor</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Category</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Lessons</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.map((course, idx) => (
                                <tr key={course.id} style={{ borderBottom: idx !== courses.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500 }}>{course.title}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{course.instructor_name}</td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem' }}><span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>{course.category}</span></td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{course.total_lessons || 0}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        {/* In a real app this would call an API endpoint to delete the course or mark as inactive */}
                                        <button className="btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', color: '#ef4444', backgroundColor: '#fee2e2', borderRadius: '9999px' }}>
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
