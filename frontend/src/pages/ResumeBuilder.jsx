import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config';
import { User, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, Plus, Trash2, Sparkles, Download, ArrowLeft, ArrowRight, Save, Layout, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function ResumeBuilder() {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [generating, setGenerating] = useState(false);
    const [exporting, setExporting] = useState(false);
    
    // Resume State
    const [resumeData, setResumeData] = useState({
        personal: {
            name: user?.name || '',
            email: user?.email || '',
            phone: '',
            location: '',
            summary: ''
        },
        experience: [
            { id: 1, role: '', company: '', duration: '', description: '' }
        ],
        education: [
            { id: 1, degree: '', school: '', year: '' }
        ],
        skills: [''],
        template: 'modern'
    });

    const updatePersonal = (field, value) => {
        setResumeData(prev => ({
            ...prev,
            personal: { ...prev.personal, [field]: value }
        }));
    };

    const addExperience = () => {
        setResumeData(prev => ({
            ...prev,
            experience: [...prev.experience, { id: Date.now(), role: '', company: '', duration: '', description: '' }]
        }));
    };

    const removeExperience = (id) => {
        setResumeData(prev => ({
            ...prev,
            experience: prev.experience.filter(exp => exp.id !== id)
        }));
    };

    const updateExperience = (id, field, value) => {
        setResumeData(prev => ({
            ...prev,
            experience: prev.experience.map(exp => exp.id === id ? { ...exp, [field]: value } : exp)
        }));
    };

    const addEducation = () => {
        setResumeData(prev => ({
            ...prev,
            education: [...prev.education, { id: Date.now(), degree: '', school: '', year: '' }]
        }));
    };

    const removeEducation = (id) => {
        setResumeData(prev => ({
            ...prev,
            education: prev.education.filter(edu => edu.id !== id)
        }));
    };

    const updateEducation = (id, field, value) => {
        setResumeData(prev => ({
            ...prev,
            education: prev.education.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
        }));
    };

    const addSkill = () => {
        setResumeData(prev => ({
            ...prev,
            skills: [...prev.skills, '']
        }));
    };

    const updateSkill = (index, value) => {
        const newSkills = [...resumeData.skills];
        newSkills[index] = value;
        setResumeData(prev => ({ ...prev, skills: newSkills }));
    };

    const removeSkill = (index) => {
        setResumeData(prev => ({
            ...prev,
            skills: prev.skills.filter((_, i) => i !== index)
        }));
    };

    const handleAIGenerate = async (type, index = null) => {
        setGenerating(true);
        try {
            const token = localStorage.getItem('token');
            let prompt = "";
            
            if (type === 'summary') {
                prompt = `Write a professional resume summary for a candidate with the following details: Name: ${resumeData.personal.name}, Skills: ${resumeData.skills.join(', ')}. Keep it concise and impactful (max 3-4 sentences).`;
            } else if (type === 'experience') {
                const exp = resumeData.experience[index];
                prompt = `Write a professional job description for the role of ${exp.role} at ${exp.company}. Focus on key achievements and responsibilities. Use bullet points.`;
            }

            // Fixed: backend expects 'messages' array and returns 'reply'
            const res = await axios.post(`${API_URL}/chat`, { 
                messages: [
                    { role: "user", content: prompt }
                ]
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (type === 'summary') {
                updatePersonal('summary', res.data.reply);
            } else if (type === 'experience') {
                updateExperience(resumeData.experience[index].id, 'description', res.data.reply);
            }
        } catch (err) {
            console.error("AI Generation failed", err);
            alert("Failed to generate AI content. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const downloadPDF = async () => {
        const element = document.getElementById('resume-preview');
        if (!element) return;

        setExporting(true);
        try {
            // Options for high-quality capture
            const canvas = await html2canvas(element, {
                scale: 2, // Higher scale for better quality
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            
            const imgX = (pdfWidth - imgWidth * ratio) / 2;
            const imgY = 0; // Start from top

            pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`${resumeData.personal.name || 'Resume'}_AI_Builder.pdf`);
        } catch (err) {
            console.error("PDF generation failed:", err);
            alert("Failed to export PDF. Please try again or use the browser's print function.");
        } finally {
            setExporting(false);
        }
    };

    // Template Definitions
    const templates = [
        { id: 'modern', name: 'Modern', icon: <Layout size={16} /> },
        { id: 'professional', name: 'Professional', icon: <Layout size={16} /> },
        { id: 'creative', name: 'Creative', icon: <Layout size={16} /> },
        { id: 'executive', name: 'Executive', icon: <Layout size={16} /> },
        { id: 'elegant', name: 'Elegant', icon: <Layout size={16} /> },
        { id: 'minimalist', name: 'Minimalist', icon: <Layout size={16} /> }
    ];

    return (
        <div className="container mt-8 mb-12">
            <div className="flex justify-between items-center mb-8 no-print">
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>AI Resume Builder</h1>
                    <p className="text-muted">Create a professional resume in minutes with AI assistance.</p>
                </div>
                <div className="flex gap-4">
                    <button 
                        onClick={downloadPDF} 
                        disabled={exporting}
                        className="btn btn-outline flex items-center gap-2" 
                        title="Download as PDF"
                    >
                        {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />} 
                        {exporting ? 'Exporting...' : 'Save as PDF'}
                    </button>
                    <button className="btn btn-primary flex items-center gap-2">
                        <Save size={18} /> Save Resume
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }} className="resume-grid">
                {/* Editor Panel */}
                <div className="no-print">
                    <div className="card" style={{ padding: '2rem' }}>
                        {/* Step Navigation */}
                        <div className="flex gap-2 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                            {[1, 2, 3, 4, 5].map(i => (
                                <button 
                                    key={i} 
                                    onClick={() => setStep(i)}
                                    className={`btn ${step === i ? 'btn-primary' : 'btn-outline'}`}
                                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.75rem' }}
                                >
                                    {i === 5 ? 'Template' : `Step ${i}`}
                                </button>
                            ))}
                        </div>

                        {step === 1 && (
                            <div className="flex flex-col gap-4">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Personal Information</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Full Name" value={resumeData.personal.name} onChange={e => updatePersonal('name', e.target.value)} className="input" />
                                    <input type="email" placeholder="Email" value={resumeData.personal.email} onChange={e => updatePersonal('email', e.target.value)} className="input" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Phone" value={resumeData.personal.phone} onChange={e => updatePersonal('phone', e.target.value)} className="input" />
                                    <input type="text" placeholder="Location" value={resumeData.personal.location} onChange={e => updatePersonal('location', e.target.value)} className="input" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="font-semibold">Professional Summary</label>
                                        <button 
                                            onClick={() => handleAIGenerate('summary')} 
                                            disabled={generating}
                                            className="btn btn-primary" 
                                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                        >
                                            <Sparkles size={12} /> {generating ? 'Generating...' : 'AI Generate'}
                                        </button>
                                    </div>
                                    <textarea 
                                        rows="5" 
                                        className="textarea" 
                                        placeholder="Briefly describe your professional background and goals..."
                                        value={resumeData.personal.summary}
                                        onChange={e => updatePersonal('summary', e.target.value)}
                                    ></textarea>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-6">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Work Experience</h2>
                                {resumeData.experience.map((exp, idx) => (
                                    <div key={exp.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                                        <button onClick={() => removeExperience(exp.id)} className="text-red-500 absolute top-4 right-4"><Trash2 size={18} /></button>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <input type="text" placeholder="Job Title" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} className="input" />
                                            <input type="text" placeholder="Company" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} className="input" />
                                        </div>
                                        <input type="text" placeholder="Duration (e.g. Jan 2020 - Present)" value={exp.duration} onChange={e => updateExperience(exp.id, 'duration', e.target.value)} className="input mb-4" />
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="font-semibold text-sm">Description</label>
                                            <button 
                                                onClick={() => handleAIGenerate('experience', idx)} 
                                                disabled={generating || !exp.role}
                                                className="btn btn-primary" 
                                                style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                            >
                                                <Sparkles size={12} /> {generating ? 'Generating...' : 'AI Suggest'}
                                            </button>
                                        </div>
                                        <textarea 
                                            rows="4" 
                                            className="textarea" 
                                            value={exp.description} 
                                            onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                                        ></textarea>
                                    </div>
                                ))}
                                <button onClick={addExperience} className="btn btn-outline flex items-center justify-center gap-2"><Plus size={18} /> Add Experience</button>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col gap-6">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Education</h2>
                                {resumeData.education.map(edu => (
                                    <div key={edu.id} style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', position: 'relative' }}>
                                        <button onClick={() => removeEducation(edu.id)} className="text-red-500 absolute top-4 right-4"><Trash2 size={18} /></button>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <input type="text" placeholder="Degree" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} className="input" />
                                            <input type="text" placeholder="School/University" value={edu.school} onChange={e => updateEducation(edu.id, 'school', e.target.value)} className="input" />
                                        </div>
                                        <input type="text" placeholder="Year (e.g. 2022)" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} className="input" />
                                    </div>
                                ))}
                                <button onClick={addEducation} className="btn btn-outline flex items-center justify-center gap-2"><Plus size={18} /> Add Education</button>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="flex flex-col gap-6">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Skills</h2>
                                <div className="grid grid-cols-2 gap-2">
                                    {resumeData.skills.map((skill, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input type="text" placeholder="Skill" value={skill} onChange={e => updateSkill(idx, e.target.value)} className="input" />
                                            <button onClick={() => removeSkill(idx)} className="text-red-500"><Trash2 size={18} /></button>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addSkill} className="btn btn-outline flex items-center justify-center gap-2"><Plus size={18} /> Add Skill</button>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="flex flex-col gap-6">
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Choose Template</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {templates.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => setResumeData(prev => ({ ...prev, template: t.id }))}
                                            className={`btn ${resumeData.template === t.id ? 'btn-primary' : 'btn-outline'} flex items-center justify-between p-4`}
                                        >
                                            <span style={{ fontWeight: 600 }}>{t.name}</span>
                                            {resumeData.template === t.id && <span>Active</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
                            <button disabled={step === 1} onClick={() => setStep(s => s - 1)} className="btn btn-outline flex items-center gap-2"><ArrowLeft size={18} /> Previous</button>
                            <button disabled={step === 5} onClick={() => setStep(s => s + 1)} className="btn btn-primary flex items-center gap-2">Next <ArrowRight size={18} /></button>
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="resume-preview-container">
                    <div id="resume-preview" className={`card resume-card template-${resumeData.template}`} 
                        style={{ 
                            padding: '0', 
                            overflow: 'hidden', 
                            minHeight: '842px', 
                            backgroundColor: 'white', 
                            color: '#1a202c',
                            width: '100%',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        }}>
                        
                        {/* 1. MODERN TEMPLATE */}
                        {resumeData.template === 'modern' && (
                            <>
                                <div style={{ backgroundColor: '#1e293b', color: 'white', padding: '3rem 2rem' }}>
                                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', lineHeight: 1 }}>{resumeData.personal.name || 'Your Name'}</h1>
                                    <div className="flex flex-wrap gap-4 mt-4" style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                        {resumeData.personal.email && <div className="flex items-center gap-1"><Mail size={14} /> {resumeData.personal.email}</div>}
                                        {resumeData.personal.phone && <div className="flex items-center gap-1"><Phone size={14} /> {resumeData.personal.phone}</div>}
                                        {resumeData.personal.location && <div className="flex items-center gap-1"><MapPin size={14} /> {resumeData.personal.location}</div>}
                                    </div>
                                </div>

                                <div style={{ padding: '2rem' }} className="flex flex-col gap-8">
                                    {resumeData.personal.summary && (
                                        <section>
                                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Summary</h2>
                                            <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{resumeData.personal.summary}</p>
                                        </section>
                                    )}

                                    <section>
                                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Experience</h2>
                                        <div className="flex flex-col gap-6">
                                            {resumeData.experience.map(exp => (
                                                <div key={exp.id}>
                                                    <div className="flex justify-between items-start">
                                                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{exp.role || 'Position'}</h3>
                                                        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#64748b' }}>{exp.duration}</span>
                                                    </div>
                                                    <div style={{ color: '#0f172a', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>{exp.company || 'Company Name'}</div>
                                                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#334155', whiteSpace: 'pre-line' }}>{exp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-2 gap-8">
                                        <section>
                                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Education</h2>
                                            <div className="flex flex-col gap-4">
                                                {resumeData.education.map(edu => (
                                                    <div key={edu.id}>
                                                        <h3 style={{ fontWeight: 700, fontSize: '0.875rem' }}>{edu.degree || 'Degree'}</h3>
                                                        <div style={{ fontSize: '0.8125rem', color: '#334155' }}>{edu.school}</div>
                                                        <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{edu.year}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>

                                        <section>
                                            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, textTransform: 'uppercase', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Skills</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {resumeData.skills.filter(s => s).map((skill, idx) => (
                                                    <span key={idx} style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{skill}</span>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* 2. PROFESSIONAL TEMPLATE */}
                        {resumeData.template === 'professional' && (
                            <div style={{ padding: '3rem' }}>
                                <div style={{ textAlign: 'center', marginBottom: '2.5rem', borderBottom: '2px solid #000', paddingBottom: '1.5rem' }}>
                                    <h1 style={{ fontSize: '2.5rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{resumeData.personal.name || 'Your Name'}</h1>
                                    <div className="flex justify-center gap-6" style={{ fontSize: '0.875rem' }}>
                                        {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
                                        {resumeData.personal.phone && <span>| {resumeData.personal.phone}</span>}
                                        {resumeData.personal.location && <span>| {resumeData.personal.location}</span>}
                                    </div>
                                </div>

                                <section style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #000', marginBottom: '0.75rem' }}>Professional Summary</h2>
                                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{resumeData.personal.summary}</p>
                                </section>

                                <section style={{ marginBottom: '2rem' }}>
                                    <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #000', marginBottom: '0.75rem' }}>Experience</h2>
                                    <div className="flex flex-col gap-6">
                                        {resumeData.experience.map(exp => (
                                            <div key={exp.id}>
                                                <div className="flex justify-between items-baseline">
                                                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{exp.company || 'Company'}</h3>
                                                    <span style={{ fontSize: '0.875rem' }}>{exp.duration}</span>
                                                </div>
                                                <div style={{ fontStyle: 'italic', marginBottom: '0.5rem' }}>{exp.role || 'Role'}</div>
                                                <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div className="grid grid-cols-2 gap-12">
                                    <section>
                                        <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #000', marginBottom: '0.75rem' }}>Education</h2>
                                        {resumeData.education.map(edu => (
                                            <div key={edu.id} style={{ marginBottom: '1rem' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{edu.school}</div>
                                                <div style={{ fontSize: '0.875rem' }}>{edu.degree}</div>
                                                <div style={{ fontSize: '0.8125rem', color: '#666' }}>{edu.year}</div>
                                            </div>
                                        ))}
                                    </section>
                                    <section>
                                        <h2 style={{ fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', borderBottom: '1px solid #000', marginBottom: '0.75rem' }}>Core Skills</h2>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            {resumeData.skills.filter(s => s).map((skill, idx) => (
                                                <div key={idx} style={{ fontSize: '0.875rem' }}>• {skill}</div>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {/* 3. CREATIVE TEMPLATE */}
                        {resumeData.template === 'creative' && (
                            <div style={{ display: 'flex', minHeight: '842px' }}>
                                {/* Sidebar */}
                                <div style={{ width: '35%', backgroundColor: '#4f46e5', color: 'white', padding: '3rem 1.5rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 900 }}>
                                            {resumeData.personal.name.charAt(0) || 'Y'}
                                        </div>
                                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.2 }}>{resumeData.personal.name || 'Your Name'}</h1>
                                    </div>

                                    <section style={{ marginBottom: '3rem' }}>
                                        <h2 style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>Contact</h2>
                                        <div className="flex flex-col gap-3" style={{ fontSize: '0.8125rem' }}>
                                            {resumeData.personal.email && <div className="flex items-center gap-2"><Mail size={12} /> {resumeData.personal.email}</div>}
                                            {resumeData.personal.phone && <div className="flex items-center gap-2"><Phone size={12} /> {resumeData.personal.phone}</div>}
                                            {resumeData.personal.location && <div className="flex items-center gap-2"><MapPin size={12} /> {resumeData.personal.location}</div>}
                                        </div>
                                    </section>

                                    <section>
                                        <h2 style={{ fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '0.5rem' }}>Skills</h2>
                                        <div className="flex flex-wrap gap-2">
                                            {resumeData.skills.filter(s => s).map((skill, idx) => (
                                                <span key={idx} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem' }}>{skill}</span>
                                            ))}
                                        </div>
                                    </section>
                                </div>

                                {/* Main Area */}
                                <div style={{ width: '65%', padding: '3rem 2rem' }}>
                                    <section style={{ marginBottom: '2.5rem' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5', marginBottom: '1rem' }}>Profile</h2>
                                        <p style={{ fontSize: '0.9375rem', lineHeight: 1.6 }}>{resumeData.personal.summary}</p>
                                    </section>

                                    <section style={{ marginBottom: '2.5rem' }}>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5', marginBottom: '1.5rem' }}>Work History</h2>
                                        <div className="flex flex-col gap-6">
                                            {resumeData.experience.map(exp => (
                                                <div key={exp.id} style={{ position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #e5e7eb' }}>
                                                    <div style={{ position: 'absolute', left: '-6px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4f46e5' }}></div>
                                                    <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.125rem' }}>{exp.role}</h3>
                                                    <div style={{ fontSize: '0.875rem', color: '#4f46e5', fontWeight: 600, marginBottom: '0.25rem' }}>{exp.company} | {exp.duration}</div>
                                                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>{exp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <section>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4f46e5', marginBottom: '1.5rem' }}>Education</h2>
                                        {resumeData.education.map(edu => (
                                            <div key={edu.id} style={{ marginBottom: '1rem' }}>
                                                <h3 style={{ fontWeight: 800, fontSize: '0.875rem' }}>{edu.degree}</h3>
                                                <div style={{ fontSize: '0.875rem' }}>{edu.school}, {edu.year}</div>
                                            </div>
                                        ))}
                                    </section>
                                </div>
                            </div>
                        )}

                        {/* 4. EXECUTIVE TEMPLATE */}
                        {resumeData.template === 'executive' && (
                            <div style={{ padding: '4rem 3rem' }}>
                                <div style={{ borderLeft: '8px solid #1e293b', paddingLeft: '1.5rem', marginBottom: '3rem' }}>
                                    <h1 style={{ fontSize: '2.75rem', fontWeight: 900, color: '#1e293b', lineHeight: 1, textTransform: 'uppercase', letterSpacing: '-1px' }}>{resumeData.personal.name || 'Your Name'}</h1>
                                    <div className="flex gap-4 mt-2" style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: 600 }}>
                                        {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
                                        {resumeData.personal.phone && <span>• {resumeData.personal.phone}</span>}
                                        {resumeData.personal.location && <span>• {resumeData.personal.location}</span>}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-10">
                                    <section>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            Profile <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                                        </h2>
                                        <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#334155' }}>{resumeData.personal.summary}</p>
                                    </section>

                                    <section>
                                        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            Experience <div style={{ flex: 1, height: '1px', backgroundColor: '#e2e8f0' }}></div>
                                        </h2>
                                        <div className="flex flex-col gap-8">
                                            {resumeData.experience.map(exp => (
                                                <div key={exp.id}>
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <h3 style={{ fontWeight: 800, fontSize: '1.125rem', color: '#0f172a' }}>{exp.role}</h3>
                                                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b' }}>{exp.duration}</span>
                                                    </div>
                                                    <div style={{ color: '#4f46e5', fontWeight: 700, fontSize: '0.9375rem', marginBottom: '0.75rem' }}>{exp.company}</div>
                                                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#334155' }}>{exp.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    <div className="grid grid-cols-2 gap-12">
                                        <section>
                                            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Education</h2>
                                            <div className="flex flex-col gap-4">
                                                {resumeData.education.map(edu => (
                                                    <div key={edu.id}>
                                                        <h3 style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{edu.degree}</h3>
                                                        <div style={{ fontSize: '0.875rem', color: '#475569' }}>{edu.school}, {edu.year}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                        <section>
                                            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Expertise</h2>
                                            <div className="flex flex-wrap gap-2">
                                                {resumeData.skills.filter(s => s).map((skill, idx) => (
                                                    <span key={idx} style={{ padding: '0.25rem 0', borderBottom: '2px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 600, color: '#334155', marginRight: '1rem' }}>{skill}</span>
                                                ))}
                                            </div>
                                        </section>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 5. ELEGANT TEMPLATE */}
                        {resumeData.template === 'elegant' && (
                            <div style={{ padding: '4rem' }}>
                                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                                    <h1 style={{ fontSize: '3rem', fontWeight: 300, color: '#111', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '1rem' }}>{resumeData.personal.name || 'Your Name'}</h1>
                                    <div className="flex justify-center gap-8" style={{ fontSize: '0.8125rem', color: '#666', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
                                        {resumeData.personal.phone && <span>{resumeData.personal.phone}</span>}
                                        {resumeData.personal.location && <span>{resumeData.personal.location}</span>}
                                    </div>
                                </div>

                                <section style={{ marginBottom: '3.5rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999' }}>Summary</span>
                                    </div>
                                    <p style={{ fontSize: '1rem', lineHeight: 1.8, color: '#444', textAlign: 'center', maxWidth: '90%', margin: '0 auto', fontStyle: 'italic' }}>"{resumeData.personal.summary}"</p>
                                </section>

                                <section style={{ marginBottom: '3.5rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999' }}>Selected Experience</span>
                                    </div>
                                    <div className="flex flex-col gap-10">
                                        {resumeData.experience.map(exp => (
                                            <div key={exp.id} style={{ textAlign: 'center' }}>
                                                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem', color: '#111' }}>{exp.role}</h3>
                                                <div style={{ fontSize: '0.875rem', color: '#777', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>{exp.company} | {exp.duration}</div>
                                                <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#555', maxWidth: '85%', margin: '0 auto' }}>{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', borderTop: '1px solid #eee', paddingTop: '3rem' }}>
                                    <section>
                                        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: '1.5rem' }}>Education</h2>
                                        {resumeData.education.map(edu => (
                                            <div key={edu.id} style={{ marginBottom: '1.5rem' }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: '#111' }}>{edu.degree}</div>
                                                <div style={{ fontSize: '0.875rem', color: '#777' }}>{edu.school}, {edu.year}</div>
                                            </div>
                                        ))}
                                    </section>
                                    <section>
                                        <h2 style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: '#999', marginBottom: '1.5rem' }}>Skills</h2>
                                        <div className="flex flex-wrap justify-start gap-4">
                                            {resumeData.skills.filter(s => s).map((skill, idx) => (
                                                <span key={idx} style={{ fontSize: '0.875rem', color: '#444' }}>{skill}</span>
                                            ))}
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {/* 6. MINIMALIST TEMPLATE */}
                        {resumeData.template === 'minimalist' && (
                            <div style={{ padding: '3rem' }}>
                                <div style={{ marginBottom: '3rem' }}>
                                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#000', marginBottom: '0.5rem' }}>{resumeData.personal.name || 'Your Name'}</h1>
                                    <div className="flex gap-4" style={{ fontSize: '0.875rem', color: '#666' }}>
                                        {resumeData.personal.email && <span>{resumeData.personal.email}</span>}
                                        {resumeData.personal.phone && <span>{resumeData.personal.phone}</span>}
                                        {resumeData.personal.location && <span>{resumeData.personal.location}</span>}
                                    </div>
                                </div>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <p style={{ fontSize: '0.9375rem', lineHeight: 1.6, color: '#333' }}>{resumeData.personal.summary}</p>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '0.25rem' }}>Experience</h2>
                                    <div className="flex flex-col gap-6">
                                        {resumeData.experience.map(exp => (
                                            <div key={exp.id}>
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{exp.company}</span>
                                                    <span style={{ fontSize: '0.8125rem' }}>{exp.duration}</span>
                                                </div>
                                                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem' }}>{exp.role}</div>
                                                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: '#444' }}>{exp.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section style={{ marginBottom: '2.5rem' }}>
                                    <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1.5rem', borderBottom: '1px solid #000', paddingBottom: '0.25rem' }}>Education</h2>
                                    {resumeData.education.map(edu => (
                                        <div key={edu.id} style={{ marginBottom: '1rem' }}>
                                            <div className="flex justify-between items-baseline">
                                                <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>{edu.school}</span>
                                                <span style={{ fontSize: '0.8125rem' }}>{edu.year}</span>
                                            </div>
                                            <div style={{ fontSize: '0.875rem' }}>{edu.degree}</div>
                                        </div>
                                    ))}
                                </section>

                                <section>
                                    <h2 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '1rem', borderBottom: '1px solid #000', paddingBottom: '0.25rem' }}>Skills</h2>
                                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                                        {resumeData.skills.filter(s => s).join(' • ')}
                                    </div>
                                </section>
                            </div>
                        )}

                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page { margin: 0; size: auto; }
                    body { margin: 0; background: white; }
                    .no-print { display: none !important; }
                    .header, .footer, .chatbot-container, nav { display: none !important; }
                    .container { max-width: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
                    .resume-grid { display: block !important; padding: 0 !important; margin: 0 !important; }
                    .resume-preview-container { width: 100% !important; margin: 0 !important; padding: 0 !important; }
                    .resume-card { 
                        box-shadow: none !important; 
                        border: none !important; 
                        margin: 0 !important; 
                        width: 210mm !important; 
                        height: 297mm !important;
                    }
                    div[style*="calc(100vh - 4rem)"] { height: auto !important; }
                }
                .resume-card h1, .resume-card h2, .resume-card h3, .resume-card p, .resume-card span, .resume-card div {
                    font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                }
            `}} />
        </div>
    );
}
