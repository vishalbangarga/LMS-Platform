import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Profile() {
    const { user } = useAuth();

    if (!user) return <div className="container mt-4 text-center">Loading profile...</div>;

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    return (
        <div className="container mt-8 mb-8 flex justify-center">
            <div className="card" style={{ padding: '2rem', maxWidth: '600px', width: '100%' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '96px', height: '96px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.25rem' }}>{getGreeting()}, {user.name}!</h1>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', backgroundColor: 'rgba(79, 70, 229, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '9999px', textTransform: 'capitalize', marginTop: '0.5rem' }}>
                        {user.role}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                            <User className="text-muted" size={24} />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Full Name</div>
                            <div style={{ fontWeight: 500 }}>{user.name}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                            <Mail className="text-muted" size={24} />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email Address</div>
                            <div style={{ fontWeight: 500 }}>{user.email}</div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-md)' }}>
                            <Shield className="text-muted" size={24} />
                        </div>
                        <div>
                            <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>Account Role</div>
                            <div style={{ fontWeight: 500, textTransform: 'capitalize' }}>{user.role}</div>
                        </div>
                    </div>

                    {user.role === 'student' && (
                        <div style={{ marginTop: '1rem' }}>
                            <Link to="/resume-builder" className="btn btn-primary w-full flex items-center justify-center gap-2" style={{ padding: '1rem' }}>
                                <Sparkles size={20} /> Launch AI Resume Builder
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
