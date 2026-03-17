const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Get all reviews for a specific course
router.get('/reviews/:courseId', async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const query = `
            SELECT r.*, u.name as user_name 
            FROM reviews r
            JOIN users u ON r.user_id = u.id
            WHERE r.course_id = ?
            ORDER BY r.created_at DESC
        `;
        const [reviews] = await pool.query(query, [courseId]);
        res.json(reviews);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get the current user's review for a course
router.get('/reviews/:courseId/me', verifyToken, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const query = 'SELECT * FROM reviews WHERE course_id = ? AND user_id = ?';
        const [reviews] = await pool.query(query, [courseId, req.userId]);

        if (reviews.length > 0) {
            res.json(reviews[0]);
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add or update a review for a course
router.post('/reviews/:courseId', verifyToken, async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { rating, review_text } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5' });
        }

        // Verify that the user is enrolled in the course
        const checkEnrollmentQuery = 'SELECT id FROM enrollments WHERE course_id = ? AND user_id = ?';
        const [enrollment] = await pool.query(checkEnrollmentQuery, [courseId, req.userId]);

        if (enrollment.length === 0) {
            return res.status(403).json({ message: 'You must be enrolled in this course to leave a review.' });
        }

        // Insert or update review
        const upsertQuery = `
            INSERT INTO reviews (course_id, user_id, rating, review_text)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE rating = VALUES(rating), review_text = VALUES(review_text)
        `;
        await pool.query(upsertQuery, [courseId, req.userId, rating, review_text]);

        res.json({ message: 'Review submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
