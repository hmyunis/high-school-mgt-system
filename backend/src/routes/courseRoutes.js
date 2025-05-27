const express = require('express');
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', authorize('ADMIN'), courseController.createCourse);
router.get('/', authorize('ADMIN', 'TEACHER', 'STUDENT'), courseController.getAllCourses);
router.get('/:id', authorize('ADMIN', 'TEACHER', 'STUDENT'),courseController.getCourseById);
router.put('/:id', authorize('ADMIN'), courseController.updateCourse);
router.delete('/:id', authorize('ADMIN'), courseController.deleteCourse);

router.get('/:courseId/students', protect, authorize('TEACHER', 'ADMIN'), courseController.getStudentsForCourse);

// Routes for managing teacher assignments to courses
router.post('/:courseId/teachers', authorize('ADMIN'), courseController.assignTeacherToCourse);
router.delete('/:courseId/teachers/:teacherId', authorize('ADMIN'), courseController.removeTeacherFromCourse);

module.exports = router;