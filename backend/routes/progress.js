const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// Mark lesson as completed
router.post('/progress', verifyToken, async (req, res) => {
    try {
        const { course_id, lesson_id } = req.body;

        // Verify enrollment or ownership or admin
        const [enrollment] = await pool.query('SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?', [req.userId, course_id]);
        let authorized = enrollment.length > 0;

        if (!authorized) {
            const [course] = await pool.query('SELECT instructor_id FROM courses WHERE id = ?', [course_id]);
            authorized = (course.length > 0 && course[0].instructor_id === req.userId) || req.userRole === 'admin';
        }

        if (!authorized) {
            return res.status(403).json({ message: 'Must be enrolled to track progress' });
        }

        // Insert or ignore if already marked complete
        await pool.query(
            'INSERT IGNORE INTO progress (user_id, course_id, lesson_id, status) VALUES (?, ?, ?, ?)',
            [req.userId, course_id, lesson_id, 'completed']
        );

        res.status(200).json({ message: 'Progress updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get progress for a specific course
router.get('/progress/:courseId', verifyToken, async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const [progress] = await pool.query(
            'SELECT lesson_id, status FROM progress WHERE user_id = ? AND course_id = ?',
            [req.userId, courseId]
        );

        const [total] = await pool.query('SELECT COUNT(*) as count FROM lessons WHERE course_id = ?', [courseId]);
        const totalLessons = total[0].count;
        const completedLessons = progress.length;

        res.json({
            completed_lessons: completedLessons,
            total_lessons: totalLessons,
            progress_percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            completed_lesson_ids: progress.map(p => p.lesson_id)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
