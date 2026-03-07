import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';
import { API_URL } from '../config';

export default function InstructorDashboard() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    const [editingCourseId, setEditingCourseId] = useState(null);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [category, setCategory] = useState('Technology');
    const [price, setPrice] = useState('');
    const [sections, setSections] = useState([{ title: '', lessons: [{ title: '', youtube_url: '', duration: '' }] }]);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const res = await axios.get(`${API_URL}/courses`);
            setCourses(res.data.filter(c => c.instructor_id === user.id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = {
                title, description, thumbnail, category, price, difficulty: 'All Levels', sections
            };

            if (editingCourseId) {
                await axios.put(`${API_URL}/course/${editingCourseId}`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } else {
                await axios.post(`${API_URL}/course`, payload, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setShowCreateForm(false);
            setEditingCourseId(null);
            fetchCourses();
            resetForm();
        } catch (err) {
            alert('Failed to save course');
            console.error(err);
        }
    };

    const resetForm = () => {
        setTitle(''); setDescription(''); setThumbnail(''); setCategory('Technology'); setPrice('');
        setSections([{ title: '', lessons: [{ title: '', youtube_url: '', duration: '' }] }]);
        setEditingCourseId(null);
    };

    const handleEditCourse = async (courseId) => {
        try {
            const res = await axios.get(`${API_URL}/course/${courseId}`);
            const data = res.data;
            setTitle(data.title || '');
            setDescription(data.description || '');
            setThumbnail(data.thumbnail || '');
            setCategory(data.category || 'Technology');
            setPrice(data.price || '');

            if (data.sections && data.sections.length > 0) {
                setSections(data.sections.map(s => ({
                    id: s.id,
                    title: s.title || '',
                    lessons: (s.lessons || []).map(l => ({
                        id: l.id,
                        title: l.title || '',
                        youtube_url: l.youtube_url || '',
                        duration: l.duration || ''
                    }))
                })));
            } else {
                setSections([{ title: '', lessons: [{ title: '', youtube_url: '', duration: '' }] }]);
            }

            setEditingCourseId(courseId);
            setShowCreateForm(true);
        } catch (err) {
            alert('Failed to fetch course details for editing');
            console.error(err);
        }
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchCourses();
        } catch (err) {
            alert('Failed to delete course');
            console.error(err);
        }
    };

    const addSection = () => {
        setSections([...sections, { title: '', lessons: [] }]);
    };

    const removeSection = (index) => {
        if (!window.confirm('Are you sure you want to remove this section?')) return;
        const newSections = [...sections];
        newSections.splice(index, 1);
        setSections(newSections);
    };

    const addLesson = (sectionIndex) => {
        const newSections = [...sections];
        newSections[sectionIndex].lessons.push({ title: '', youtube_url: '', duration: '' });
        setSections(newSections);
    };

    const removeLesson = (sIndex, lIndex) => {
        if (!window.confirm('Are you sure you want to remove this lesson?')) return;
        const newSections = [...sections];
        newSections[sIndex].lessons.splice(lIndex, 1);
        setSections(newSections);
    };

    const updateSection = (index, val) => {
        const newSections = [...sections];
        newSections[index].title = val;
        setSections(newSections);
    };

    const updateLesson = (sIndex, lIndex, field, val) => {
        const newSections = [...sections];
        newSections[sIndex].lessons[lIndex][field] = val;
        setSections(newSections);
    };

    return (
        <div className="container mt-4 mb-8">
            <div className="flex justify-between items-center mb-8">
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Instructor Dashboard</h1>
                <button onClick={() => {
                    if (showCreateForm) {
                        setShowCreateForm(false);
                        resetForm();
                    } else {
                        resetForm();
                        setShowCreateForm(true);
                    }
                }} className="btn btn-primary flex items-center gap-2">
                    {showCreateForm ? 'Cancel Form' : <><Plus size={18} /> Create New Course</>}
                </button>
            </div>

            {showCreateForm ? (
                <div className="card" style={{ padding: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                        {editingCourseId ? 'Edit Course Details' : 'Course Details'}
                    </h2>
                    <form onSubmit={handleCreateCourse}>
                        <div className="flex flex-col gap-4 mb-8">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Course Title</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input" required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Description</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} className="textarea" rows="4" required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Thumbnail URL</label>
                                <input type="url" value={thumbnail} onChange={e => setThumbnail(e.target.value)} className="input" placeholder="https://..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className="select">
                                    <option>Technology</option><option>Business</option><option>Design</option>
                                    <option>Marketing</option><option>Personal Development</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Price ($) (Leave 0 for Free)</label>
                                <input type="number" step="0.01" min="0" value={price} onChange={e => setPrice(e.target.value)} className="input" placeholder="e.g. 19.99" />
                            </div>
                        </div>

                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>Curriculum</h2>

                        {sections.map((section, sIdx) => (
                            <div key={sIdx} style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, marginRight: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Section {sIdx + 1} Title</label>
                                        <input type="text" value={section.title} onChange={e => updateSection(sIdx, e.target.value)} className="input" required placeholder="e.g. Getting Started" />
                                    </div>
                                    <button type="button" onClick={() => removeSection(sIdx)} className="btn btn-outline" style={{ color: '#ef4444', borderColor: '#ef4444', marginTop: '1.5rem' }}>Remove Section</button>
                                </div>

                                <div style={{ marginLeft: '1.5rem', paddingLeft: '1.5rem', borderLeft: '2px solid var(--border)' }}>
                                    {section.lessons.map((lesson, lIdx) => (
                                        <div key={lIdx} style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '0.75rem', position: 'relative' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600 }}>Lesson {lIdx + 1}</h4>
                                                <button type="button" onClick={() => removeLesson(sIdx, lIdx)} style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Remove</button>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4 mb-2">
                                                <input type="text" value={lesson.title} onChange={e => updateLesson(sIdx, lIdx, 'title', e.target.value)} className="input" required placeholder="Lesson Title" />
                                                <input type="number" value={lesson.duration} onChange={e => updateLesson(sIdx, lIdx, 'duration', e.target.value)} className="input" required placeholder="Duration (minutes)" />
                                            </div>
                                            <input type="url" value={lesson.youtube_url} onChange={e => updateLesson(sIdx, lIdx, 'youtube_url', e.target.value)} className="input" required placeholder="YouTube URL (e.g. https://www.youtube.com/watch?v=...)" />
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => addLesson(sIdx)} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                        <Plus size={14} /> Add Lesson
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                            <button type="button" onClick={addSection} className="btn " style={{ border: '1px dashed var(--border)', width: '100%', padding: '1rem' }}>
                                <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Another Section
                            </button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
                            <button type="button" onClick={() => { setShowCreateForm(false); resetForm(); }} className="btn btn-outline">Cancel</button>
                            <button type="submit" className="btn btn-primary">{editingCourseId ? 'Update Course' : 'Publish Course'}</button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>My Courses</h2>
                    {courses.length === 0 ? (
                        <div className="card text-center" style={{ padding: '3rem' }}>
                            <p className="text-muted mb-4">You haven't created any courses yet.</p>
                            <button onClick={() => { resetForm(); setShowCreateForm(true); }} className="btn btn-primary">Create Your First Course</button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                            {courses.map(course => (
                                <div key={course.id} className="card flex flex-col" style={{ padding: '1.5rem', height: '100%' }}>
                                    <div style={{ height: '120px', backgroundColor: '#e2e8f0', backgroundImage: `url(${course.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }} />
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{course.title}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{course.total_lessons || 0} Lessons</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                        <button onClick={() => handleEditCourse(course.id)} className="btn btn-primary" style={{ flex: 1, padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>
                                            Edit Course
                                        </button>
                                        <button onClick={() => handleDeleteCourse(course.id)} className="btn" style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
