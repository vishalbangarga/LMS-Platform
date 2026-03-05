import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="container">
            <section className="hero">
                <h1>Master New Skills with LMS Platform</h1>
                <p>An intuitive learning experience powered by industry experts. Browse our catalog and start your learning journey today.</p>
                <div className="flex justify-center gap-4 mt-4">
                    <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
                    <Link to="/signup" className="btn btn-outline">Join for Free</Link>
                </div>
            </section>
        </div>
    );
}
