const express = require('express');
const courseController = require('../controllers/courseController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN')); // Only ADMINs can manage courses

router.post('/', courseController.createCourse);
router.get('/', courseController.getAllCourses);
router.get('/:id', courseController.getCourseById);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);

// Routes for managing teacher assignments to courses
router.post('/:courseId/teachers', courseController.assignTeacherToCourse);
router.delete('/:courseId/teachers/:teacherId', courseController.removeTeacherFromCourse);

module.exports = router;