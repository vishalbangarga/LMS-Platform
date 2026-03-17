import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, Book, PlayCircle, CheckCircle, Star } from 'lucide-react';
import { API_URL } from '../config';

export default function CourseDetails() {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();

    const [reviews, setReviews] = useState([]);
    const [myReview, setMyReview] = useState(null);
    const [reviewText, setReviewText] = useState('');
    const [rating, setRating] = useState(5);
    const [submittingReview, setSubmittingReview] = useState(false);

    useEffect(() => {
        const fetchCourseAndEnrollment = async () => {
            try {
                const res = await axios.get(`${API_URL}/course/${courseId}`);
                setCourse(res.data);

                if (user) {
                    const token = localStorage.getItem('token');
                    if (token) {
                        try {
                            const enrollRes = await axios.get(`${API_URL}/course/${courseId}/check-enrollment`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setIsEnrolled(enrollRes.data.enrolled);

                            const myReviewRes = await axios.get(`${API_URL}/reviews/${courseId}/me`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            if (myReviewRes.data) {
                                setMyReview(myReviewRes.data);
                                setRating(myReviewRes.data.rating);
                                setReviewText(myReviewRes.data.review_text);
                            }
                        } catch (err) {
                            console.error("Error checking enrollment:", err);
                        }
                    }
                }

                try {
                    const reviewsRes = await axios.get(`${API_URL}/reviews/${courseId}`);
                    setReviews(reviewsRes.data);
                } catch (err) {
                    console.error("Error fetching reviews:", err);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourseAndEnrollment();
    }, [courseId, user]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/reviews/${courseId}`, { rating, review_text: reviewText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Refresh reviews
            const reviewsRes = await axios.get(`${API_URL}/reviews/${courseId}`);
            setReviews(reviewsRes.data);
            
            const myReviewRes = await axios.get(`${API_URL}/reviews/${courseId}/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyReview(myReviewRes.data);
            alert('Review submitted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleEnroll = async () => {
        if (!user) {
            navigate('/login');
            return;
        }

        // If course has a price, redirect to checkout
        if (Number(course.price) > 0) {
            navigate(`/checkout/${courseId}`);
            return;
        }

        setEnrolling(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/enroll`, { course_id: courseId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate(`/learn/${courseId}`);
        } catch (err) {
            if (err.response?.data?.message === 'Already enrolled in this course') {
                navigate(`/learn/${courseId}`);
            } else {
                alert(err.response?.data?.message || 'Failed to enroll');
            }
            setEnrolling(false);
        }
    };

    if (loading) return <div className="container mt-4">Loading...</div>;
    if (!course) return <div className="container mt-4">Course not found</div>;

    return (
        <div>
            {/* Hero Section */}
            <div style={{ backgroundColor: '#111827', color: 'white', padding: '2rem 0' }}>
                <div className="container grid grid-cols-1 md:grid-cols-2" style={{ gap: '2rem', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '1rem' }}>{course.category}</div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>{course.title}</h1>
                        <p style={{ fontSize: '1.125rem', color: '#9ca3af', marginBottom: '1rem', lineHeight: 1.6 }}>{course.description}</p>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '2rem' }}>
                            {Number(course.price) === 0 || !course.price ? 'Free' : `$${Number(course.price).toFixed(2)}`}
                        </div>

                        <div className="flex items-center gap-6" style={{ marginBottom: '2rem' }}>
                            <div className="flex items-center gap-2">
                                <img src={`https://ui-avatars.com/api/?name=${course.instructor_name}&background=random`} alt="Instructor" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                <span style={{ fontWeight: 500 }}>{course.instructor_name}</span>
                            </div>
                            <div className="flex items-center gap-2 color-muted">
                                <Book size={18} /> {course.total_lessons} Lessons
                            </div>
                            <div className="flex items-center gap-2 color-muted">
                                <Clock size={18} /> {Math.floor(course.total_duration / 60)}h {course.total_duration % 60}m
                            </div>
                            <div className="flex items-center gap-2" style={{ color: '#fbbf24' }}>
                                <Star size={18} fill="currentColor" />
                                <span style={{ fontWeight: 600 }}>{Number(course.average_rating || 0).toFixed(1)}</span>
                                <span style={{ color: '#9ca3af', fontWeight: 400 }}>({course.total_reviews || 0} reviews)</span>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid #374151' }}>
                        <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface)', color: 'var(--text-main)' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Ready to start learning?</h3>
                            {user?.role === 'instructor' ? (
                                <div style={{ padding: '1rem', backgroundColor: 'rgba(79, 70, 229, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--primary)', marginBottom: '1rem' }}>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', textAlign: 'center' }}>
                                        As an instructor, you cannot enroll in courses.
                                    </p>
                                </div>
                            ) : isEnrolled ? (
                                <Link to={`/learn/${courseId}`} className="btn btn-primary w-full flex justify-center items-center gap-2" style={{ padding: '1rem', fontSize: '1.125rem', marginBottom: '1rem' }}>
                                    Go to Course <PlayCircle size={20} />
                                </Link>
                            ) : (
                                <button
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                    className="btn btn-primary w-full flex justify-center items-center gap-2"
                                    style={{ padding: '1rem', fontSize: '1.125rem', marginBottom: '1rem' }}
                                >
                                    {enrolling ? 'Enrolling...' : (
                                        <>
                                            {Number(course.price) === 0 || !course.price ? 'Enroll for Free ' : `Buy for $${Number(course.price).toFixed(2)} `}
                                            <PlayCircle size={20} />
                                        </>
                                    )}
                                </button>
                            )}
                            <p className="text-center text-muted" style={{ fontSize: '0.875rem' }}>Full lifetime access. Access on mobile and TV.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content */}
            <div className="container" style={{ padding: '4rem 1.5rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Course Content</h2>

                <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
                    {course.sections?.map((section, idx) => (
                        <div key={section.id} style={{ borderBottom: idx !== course.sections.length - 1 ? '1px solid var(--border)' : 'none' }}>
                            <div style={{ padding: '1rem 1.5rem', backgroundColor: 'var(--surface)', color: 'var(--text-main)', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>Section {section.order_number}: {section.title}</span>
                                <span className="text-muted" style={{ fontWeight: 400 }}>{section.lessons?.length || 0} lessons</span>
                            </div>
                            <div style={{ padding: '0.5rem 0' }}>
                                {section.lessons?.map((lesson, lIdx) => (
                                    <div key={lesson.id} style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                        <PlayCircle size={18} className="text-muted" style={{ marginTop: '0.125rem' }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)' }}>{lIdx + 1}. {lesson.title}</div>
                                            {lesson.description && <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{lesson.description}</div>}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{lesson.duration}m</div>
                                    </div>
                                ))}
                                {(!section.lessons || section.lessons.length === 0) && (
                                    <div style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>No lessons in this section yet.</div>
                                )}
                            </div>
                        </div>
                    ))}
                    {(!course.sections || course.sections.length === 0) && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sections available for this course yet.</div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="container" style={{ padding: '2rem 1.5rem 4rem', maxWidth: '800px', marginLeft: 'auto', marginRight: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '2rem' }}>Reviews</h2>

                {/* Leave a Review Form for Enrolled Students */}
                {isEnrolled && (
                    <div style={{ padding: '1.5rem', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
                            {myReview ? 'Update your review' : 'Leave a review'}
                        </h3>
                        <form onSubmit={handleReviewSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', className: 'text-muted', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Rating</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            style={{ color: star <= rating ? '#fbbf24' : 'var(--text-muted)' }}
                                            aria-label={`Rate ${star} stars`}
                                        >
                                            <Star fill={star <= rating ? 'currentColor' : 'none'} size={24} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', className: 'text-muted', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Review (optional)</label>
                                <textarea
                                    value={reviewText}
                                    onChange={(e) => setReviewText(e.target.value)}
                                    className="input-field"
                                    rows="3"
                                    placeholder="Tell others what you thought of this course..."
                                ></textarea>
                            </div>
                            <button type="submit" disabled={submittingReview} className="btn btn-primary">
                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Reviews List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {reviews.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No reviews yet.</div>
                    ) : (
                        reviews.map((review) => (
                            <div key={review.id} style={{ paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-3" style={{ marginBottom: '0.5rem' }}>
                                    <img src={`https://ui-avatars.com/api/?name=${review.user_name}&background=random`} alt={review.user_name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{review.user_name}</div>
                                        <div className="flex items-center gap-1" style={{ color: '#fbbf24', marginTop: '0.125rem' }}>
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} fill={i < review.rating ? 'currentColor' : 'none'} size={14} style={{ color: i < review.rating ? '#fbbf24' : 'var(--border)' }} />
                                            ))}
                                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {review.review_text && (
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', lineHeight: 1.5, marginTop: '0.75rem' }}>
                                        {review.review_text}
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
