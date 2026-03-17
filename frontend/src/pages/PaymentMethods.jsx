import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { CreditCard, Wallet, AlertCircle, CheckCircle2, Smartphone } from 'lucide-react';
import { API_URL } from '../config';

export default function PaymentMethods() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState('card');
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axios.get(`${API_URL}/course/${courseId}`);
                if (Number(res.data.price) === 0 || !res.data.price) {
                    // If course is free, shouldn't be here, redirect back to details
                    navigate(`/course/${courseId}`);
                } else {
                    setCourse(res.data);
                }
            } catch (err) {
                setError('Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, navigate]);

    const handlePayment = async () => {
        setProcessing(true);
        setError('');

        // Simulate payment delay
        setTimeout(async () => {
            try {
                const token = localStorage.getItem('token');
                await axios.post(`${API_URL}/enroll`, { course_id: courseId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                setSuccess(true);
                // Redirect to learn interface after success message
                setTimeout(() => {
                    navigate(`/learn/${courseId}`);
                }, 2000);
            } catch (err) {
                if (err.response?.data?.message === 'Already enrolled in this course') {
                    navigate(`/learn/${courseId}`);
                } else {
                    setError(err.response?.data?.message || 'Payment failed. Please try again.');
                    setProcessing(false);
                }
            }
        }, 1500);
    };

    if (loading) return <div className="container mt-4">Loading checkout...</div>;
    if (!course) return <div className="container mt-4 text-center">Course not found.</div>;

    if (success) return (
        <div className="container mt-8 flex justify-center items-center" style={{ minHeight: '60vh' }}>
            <div className="card text-center" style={{ padding: '3rem', maxWidth: '500px', width: '100%' }}>
                <CheckCircle2 size={64} style={{ color: 'var(--secondary)', margin: '0 auto 1.5rem auto' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Payment Successful!</h2>
                <p className="text-muted mb-4">You are now enrolled in {course.title}. Redirecting to the course...</p>
            </div>
        </div>
    );

    return (
        <div className="container mt-8 mb-8 flex justify-center">
            <div className="card" style={{ padding: '2rem', maxWidth: '800px', width: '100%' }}>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '2rem', textAlign: 'center' }}>Secure Checkout</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)' }}>Order Summary</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div style={{ width: '100px', height: '60px', borderRadius: 'var(--radius-sm)', backgroundImage: `url(${course.thumbnail || 'https://via.placeholder.com/100x60'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem' }}>{course.title}</div>
                                <div className="text-muted" style={{ fontSize: '0.875rem' }}>By {course.instructor_name}</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                            <span className="text-muted">Original Price</span>
                            <span>${Number(course.price).toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem' }}>
                            <span>Total</span>
                            <span>${Number(course.price).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <div style={{ backgroundColor: 'var(--surface)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem' }}>Payment Method</h2>

                        {error && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${selectedMethod === 'card' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }}>
                                <input type="radio" value="card" checked={selectedMethod === 'card'} onChange={() => setSelectedMethod('card')} style={{ width: '1.2rem', height: '1.2rem' }} />
                                <CreditCard size={24} style={{ color: selectedMethod === 'card' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 500 }}>Credit or Debit Card</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${selectedMethod === 'phonepe' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }}>
                                <input type="radio" value="phonepe" checked={selectedMethod === 'phonepe'} onChange={() => setSelectedMethod('phonepe')} style={{ width: '1.2rem', height: '1.2rem' }} />
                                <Smartphone size={24} style={{ color: selectedMethod === 'phonepe' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 500 }}>PhonePe UPI</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${selectedMethod === 'paytm' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }}>
                                <input type="radio" value="paytm" checked={selectedMethod === 'paytm'} onChange={() => setSelectedMethod('paytm')} style={{ width: '1.2rem', height: '1.2rem' }} />
                                <Smartphone size={24} style={{ color: selectedMethod === 'paytm' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 500 }}>Paytm UPI</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${selectedMethod === 'gpay' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }}>
                                <input type="radio" value="gpay" checked={selectedMethod === 'gpay'} onChange={() => setSelectedMethod('gpay')} style={{ width: '1.2rem', height: '1.2rem' }} />
                                <Smartphone size={24} style={{ color: selectedMethod === 'gpay' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 500 }}>Google Pay</span>
                            </label>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: `2px solid ${selectedMethod === 'paypal' ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'var(--transition)' }}>
                                <input type="radio" value="paypal" checked={selectedMethod === 'paypal'} onChange={() => setSelectedMethod('paypal')} style={{ width: '1.2rem', height: '1.2rem' }} />
                                <Wallet size={24} style={{ color: selectedMethod === 'paypal' ? 'var(--primary)' : 'var(--text-muted)' }} />
                                <span style={{ fontWeight: 500 }}>PayPal</span>
                            </label>
                        </div>

                        {selectedMethod === 'card' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Name on Card</label>
                                    <input type="text" className="input" placeholder="John Doe" defaultValue={user?.name || ''} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Card Number</label>
                                    <input type="text" className="input" placeholder="0000 0000 0000 0000" />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Expiry (MM/YY)</label>
                                        <input type="text" className="input" placeholder="12/26" />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>CVC</label>
                                        <input type="text" className="input" placeholder="123" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handlePayment}
                            disabled={processing}
                            className="btn btn-primary w-full"
                            style={{ padding: '1rem', fontSize: '1.125rem' }}
                        >
                            {processing ? 'Processing...' : `Pay $${Number(course.price).toFixed(2)}`}
                        </button>
                        <p className="text-center text-muted mt-4" style={{ fontSize: '0.75rem' }}>
                            Payments are securely encrypted. By continuing, you agree to our Terms of Service.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
