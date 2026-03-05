const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isInstructor } = require('../middleware/auth');

// Get all lessons for a course (Requires enrollment or instructor/admin)
router.get('/course/:id/lessons', verifyToken, async (req, res) => {
    try {
        const courseId = req.params.id;

        // Verify enrollment or instructor role
        const [enrollment] = await pool.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [req.userId, courseId]);
        const [course] = await pool.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);

        if (enrollment.length === 0 && (course.length === 0 || course[0].instructor_id !== req.userId) && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Must be enrolled to view lessons' });
        }

        const [lessons] = await pool.query('SELECT * FROM lessons WHERE course_id = ? ORDER BY section_id, order_number', [courseId]);
        res.json(lessons);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add lesson to course (Instructor/Admin)
router.post('/lesson', verifyToken, isInstructor, async (req, res) => {
    try {
        const { course_id, section_id, title, order_number, youtube_url, duration, description } = req.body;

        // Verify the user owns the course
        const [course] = await pool.query('SELECT instructor_id FROM courses WHERE id = ?', [course_id]);
        if (course.length === 0) return res.status(404).json({ message: 'Course not found' });
        if (course[0].instructor_id !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to modify this course' });
        }

        const [result] = await pool.query(
            'INSERT INTO lessons (course_id, section_id, title, order_number, youtube_url, duration, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [course_id, section_id, title, order_number, youtube_url, duration || 0, description]
        );

        res.status(201).json({ message: 'Lesson added successfully', lessonId: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
