const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isInstructor } = require('../middleware/auth');

// Get all courses (Public)
router.get('/courses', async (req, res) => {
    try {
        // Includes instructor name and basic stats
        const query = `
            SELECT 
                c.*, 
                u.name as instructor_name,
                (SELECT COUNT(*) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id) as total_lessons,
                (SELECT COALESCE(SUM(duration), 0) FROM lessons l JOIN sections s ON l.section_id = s.id WHERE s.course_id = c.id) as total_duration,
                (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id) as total_reviews,
                (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.course_id = c.id) as average_rating
            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            ORDER BY c.created_at DESC
        `;
        const [courses] = await pool.query(query);
        res.json(courses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single course details (Public)
router.get('/course/:id', async (req, res) => {
    try {
        const courseId = req.params.id;

        // Course info
        const [courseResult] = await pool.query(`
            SELECT 
                c.*, 
                u.name as instructor_name,
                (SELECT COUNT(*) FROM reviews r WHERE r.course_id = c.id) as total_reviews,
                (SELECT COALESCE(AVG(rating), 0) FROM reviews r WHERE r.course_id = c.id) as average_rating

            FROM courses c
            JOIN users u ON c.instructor_id = u.id
            WHERE c.id = ?
        `, [courseId]);

        if (courseResult.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const course = courseResult[0];

        // Sections
        const [sections] = await pool.query('SELECT * FROM sections WHERE course_id = ? ORDER BY order_number', [courseId]);

        // Lessons per section
        const [lessons] = await pool.query('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_number', [courseId]);

        // Structure sections with embedded lessons
        const structuredSections = sections.map(section => ({
            ...section,
            lessons: lessons.filter(l => l.section_id === section.id)
        }));

        res.json({
            ...course,
            sections: structuredSections,
            total_lessons: lessons.length,
            total_duration: lessons.reduce((acc, curr) => acc + curr.duration, 0)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new course (Instructor/Admin only)
router.post('/course', verifyToken, isInstructor, async (req, res) => {
    try {
        const { title, description, thumbnail, category, price, difficulty, sections } = req.body;

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Insert course
            const [courseResult] = await connection.query(
                'INSERT INTO courses (title, description, thumbnail, category, price, difficulty, instructor_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [title, description, thumbnail, category, price || 0, difficulty, req.userId]
            );
            const courseId = courseResult.insertId;

            // Optional: Insert sections and lessons if provided in one go
            if (sections && Array.isArray(sections)) {
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    const [sectionResult] = await connection.query(
                        'INSERT INTO sections (course_id, title, order_number) VALUES (?, ?, ?)',
                        [courseId, section.title, i + 1]
                    );
                    const sectionId = sectionResult.insertId;

                    if (section.lessons && Array.isArray(section.lessons)) {
                        for (let j = 0; j < section.lessons.length; j++) {
                            const lesson = section.lessons[j];
                            await connection.query(
                                'INSERT INTO lessons (course_id, section_id, title, order_number, youtube_url, duration, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                [courseId, sectionId, lesson.title, j + 1, lesson.youtube_url, lesson.duration || 0, lesson.description]
                            );
                        }
                    }
                }
            }

            await connection.commit();
            res.status(201).json({ message: 'Course created successfully', courseId });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete course (Instructor/Admin only)
router.delete('/course/:id', verifyToken, isInstructor, async (req, res) => {
    try {
        const courseId = req.params.id;

        // Verify ownership
        const [courseResult] = await pool.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);

        if (courseResult.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // Only allow the original instructor (or an admin conceptually, but sticking to instructor for now)
        if (courseResult[0].instructor_id !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to delete this course' });
        }

        // Delete course (CASCADE will handle sections, lessons, enrollments, progress)
        await pool.query('DELETE FROM courses WHERE id = ?', [courseId]);

        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update an existing course (Instructor/Admin only)
router.put('/course/:id', verifyToken, isInstructor, async (req, res) => {
    try {
        const courseId = req.params.id;
        const { title, description, thumbnail, category, price, difficulty, sections } = req.body;

        // Verify ownership
        const [courseResult] = await pool.query('SELECT instructor_id FROM courses WHERE id = ?', [courseId]);
        if (courseResult.length === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        if (courseResult[0].instructor_id !== req.userId && req.userRole !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to modify this course' });
        }

        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Update course details
            await connection.query(
                'UPDATE courses SET title = ?, description = ?, thumbnail = ?, category = ?, price = ?, difficulty = ? WHERE id = ?',
                [title, description, thumbnail, category, price || 0, difficulty, courseId]
            );

            if (sections && Array.isArray(sections)) {
                // Collect incoming section and lesson IDs to know what to keep
                const incomingSectionIds = sections.filter(s => s.id).map(s => s.id);
                const incomingLessonIds = sections.reduce((acc, section) => {
                    const lIds = (section.lessons || []).filter(l => l.id).map(l => l.id);
                    return acc.concat(lIds);
                }, []);

                // Delete removed lessons
                if (incomingLessonIds.length > 0) {
                    await connection.query('DELETE FROM lessons WHERE course_id = ? AND id NOT IN (?)', [courseId, incomingLessonIds]);
                } else {
                    await connection.query('DELETE FROM lessons WHERE course_id = ?', [courseId]);
                }

                // Delete removed sections
                if (incomingSectionIds.length > 0) {
                    await connection.query('DELETE FROM sections WHERE course_id = ? AND id NOT IN (?)', [courseId, incomingSectionIds]);
                } else {
                    await connection.query('DELETE FROM sections WHERE course_id = ?', [courseId]);
                }

                // Upsert passed sections and lessons
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i];
                    let currentSectionId = section.id;

                    if (currentSectionId) {
                        await connection.query('UPDATE sections SET title = ?, order_number = ? WHERE id = ?', [section.title, i + 1, currentSectionId]);
                    } else {
                        const [sRes] = await connection.query('INSERT INTO sections (course_id, title, order_number) VALUES (?, ?, ?)', [courseId, section.title, i + 1]);
                        currentSectionId = sRes.insertId;
                    }

                    if (section.lessons && Array.isArray(section.lessons)) {
                        for (let j = 0; j < section.lessons.length; j++) {
                            const lesson = section.lessons[j];
                            if (lesson.id) {
                                await connection.query(
                                    'UPDATE lessons SET section_id = ?, title = ?, order_number = ?, youtube_url = ?, duration = ?, description = ? WHERE id = ?',
                                    [currentSectionId, lesson.title, j + 1, lesson.youtube_url, lesson.duration || 0, lesson.description, lesson.id]
                                );
                            } else {
                                await connection.query(
                                    'INSERT INTO lessons (course_id, section_id, title, order_number, youtube_url, duration, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
                                    [courseId, currentSectionId, lesson.title, j + 1, lesson.youtube_url, lesson.duration || 0, lesson.description]
                                );
                            }
                        }
                    }
                }
            }

            await connection.commit();
            res.json({ message: 'Course updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
