import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await signup(name, email, password, role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed');
        }
    };

    return (
        <div className="container flex justify-center" style={{ paddingTop: '5rem' }}>
            <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: '400px' }}>
                <h2 className="text-center mb-4" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Create Account</h2>
                {error && <div style={{ color: 'red', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Full Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Email Account</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" required />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.875rem' }}>I want to...</label>
                        <select value={role} onChange={e => setRole(e.target.value)} className="select">
                            <option value="student">Learn (Student)</option>
                            <option value="instructor">Teach (Instructor)</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4" style={{ padding: '0.75rem' }}>Create Account</button>

                    <p className="text-center text-muted mt-4" style={{ fontSize: '0.875rem' }}>
                        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Log in</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
