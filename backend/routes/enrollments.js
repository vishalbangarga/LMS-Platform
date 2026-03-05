const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Enroll in a course
router.post('/enroll', verifyToken, async (req, res) => {
    try {
        const { course_id } = req.body;

        const [course] = await pool.query('SELECT id FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Check if already enrolled
        const [existing] = await pool.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [req.userId, course_id]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Already enrolled in this course' });
        }

        await pool.query('INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)', [req.userId, course_id]);

        res.status(201).json({ message: 'Successfully enrolled' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's enrolled courses
router.get('/my-courses', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT c.*, u.name as instructor_name, e.enrolled_at,
            (SELECT COUNT(*) FROM lessons WHERE course_id = c.id) as total_lessons,
            (SELECT COUNT(*) FROM progress WHERE user_id = ? AND course_id = c.id) as completed_lessons
            FROM courses c
            JOIN enrollments e ON c.id = e.course_id
            JOIN users u ON c.instructor_id = u.id
            WHERE e.user_id = ?
            ORDER BY e.enrolled_at DESC
        `;
        const [courses] = await pool.query(query, [req.userId, req.userId]);

        const coursesWithProgress = courses.map(course => ({
            ...course,
            progress_percentage: course.total_lessons > 0 ? Math.round((course.completed_lessons / course.total_lessons) * 100) : 0
        }));

        res.json(coursesWithProgress);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
