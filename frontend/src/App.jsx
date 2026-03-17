import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import LearningInterface from './pages/LearningInterface';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MyCourses from './pages/MyCourses';
import PaymentMethods from './pages/PaymentMethods';
import Profile from './pages/Profile';
import ResumeBuilder from './pages/ResumeBuilder';
import { LogOut, BookOpen, Sun, Moon, User, Menu, X } from 'lucide-react';

const ProtectedRoute = ({ children, roleRequired }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;

    if (roleRequired && user.role !== roleRequired && user.role !== 'admin') {
        return <Navigate to="/" />;
    }

    return children;
};

const Header = () => {
    const { user, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const isDark = localStorage.getItem('darkMode') === 'true';
        setDarkMode(isDark);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newMode = !darkMode;
        setDarkMode(newMode);
        localStorage.setItem('darkMode', newMode);
        if (newMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <header className="header">
            <div className="container header-inner">
                <Link to="/" onClick={closeMobileMenu} className="flex items-center gap-2" style={{ fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
                    <BookOpen />
                    ProPath
                </Link>

                {/* Desktop Nav */}
                <nav className="nav-links hidden-mobile">
                    <button
                        onClick={toggleDarkMode}
                        className="nav-link flex items-center justify-center p-2 rounded-full"
                        aria-label="Toggle dark mode"
                        style={{ border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px' }}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <Link to="/courses" className="nav-link">Courses</Link>
                    {user ? (
                        <>
                            {user.role === 'student' && <Link to="/my-courses" className="nav-link">My Courses</Link>}
                            {user.role === 'instructor' && <Link to="/instructor" className="nav-link">Instructor Portal</Link>}
                            {user.role === 'admin' && <Link to="/admin" className="nav-link">Admin Portal</Link>}

                            <Link to="/profile" className="nav-link flex items-center justify-center p-2 rounded-full" style={{ border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', marginLeft: '0.5rem' }} title="Profile">
                                <User size={18} />
                            </Link>

                            <button onClick={logout} className="nav-link flex items-center gap-2">
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-link">Log in</Link>
                            <Link to="/signup" className="btn btn-primary">Sign up</Link>
                        </>
                    )}
                </nav>

                {/* Mobile Menu Toggle */}
                <div className="show-mobile" style={{ display: 'none', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={toggleDarkMode} className="nav-link" style={{ padding: '0.5rem' }}>
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button onClick={toggleMobileMenu} className="nav-link" style={{ padding: '0.5rem' }}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="show-mobile" style={{ display: 'none', flexDirection: 'column', position: 'absolute', top: '4rem', left: 0, width: '100%', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '1rem', zIndex: 50, boxShadow: 'var(--shadow-lg)' }}>
                    <Link to="/courses" onClick={closeMobileMenu} className="nav-link" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>Courses</Link>
                    {user ? (
                        <>
                            {user.role === 'student' && <Link to="/my-courses" onClick={closeMobileMenu} className="nav-link" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>My Courses</Link>}
                            {user.role === 'instructor' && <Link to="/instructor" onClick={closeMobileMenu} className="nav-link" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>Instructor Portal</Link>}
                            {user.role === 'admin' && <Link to="/admin" onClick={closeMobileMenu} className="nav-link" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>Admin Portal</Link>}
                            <Link to="/profile" onClick={closeMobileMenu} className="nav-link" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>Profile</Link>
                            <button onClick={() => { logout(); closeMobileMenu(); }} className="nav-link" style={{ padding: '0.75rem 0', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={closeMobileMenu} className="nav-link" style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>Log in</Link>
                            <div style={{ paddingTop: '1rem' }}>
                                <Link to="/signup" onClick={closeMobileMenu} className="btn btn-primary w-full">Sign up</Link>
                            </div>
                        </>
                    )}
                </div>
            )}
        </header>
    );
};

import Chatbot from './components/Chatbot';

function GlobalChatbot() {
    const { user } = useAuth();
    if (user && user.role === 'student') {
        return <Chatbot currentLesson={null} />; // We remove currentLesson dependency or handle it via local storage/context later
    }
    return null;
}

function AppRoutes() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main style={{ flex: 1 }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/courses" element={<Courses />} />
                    <Route path="/course/:courseId" element={<CourseDetails />} />
                    <Route path="/learn/:courseId" element={<ProtectedRoute><LearningInterface /></ProtectedRoute>} />
                    <Route path="/checkout/:courseId" element={<ProtectedRoute roleRequired="student"><PaymentMethods /></ProtectedRoute>} />
                    <Route path="/my-courses" element={<ProtectedRoute roleRequired="student"><MyCourses /></ProtectedRoute>} />
                    <Route path="/instructor" element={<ProtectedRoute roleRequired="instructor"><InstructorDashboard /></ProtectedRoute>} />
                    <Route path="/admin" element={<ProtectedRoute roleRequired="admin"><AdminDashboard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/resume-builder" element={<ProtectedRoute roleRequired="student"><ResumeBuilder /></ProtectedRoute>} />
                </Routes>
            </main>
            <GlobalChatbot />
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppRoutes />
            </Router>
        </AuthProvider>
    );
}

export default App;
