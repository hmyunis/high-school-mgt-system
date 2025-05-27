const express = require('express');
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);

router.post('/users/:userId/teacher-profile', authorize('ADMIN'), teacherController.createTeacherProfile);
router.get('/users/:userId/teacher-profile', authorize('ADMIN'), teacherController.getTeacherProfile);
router.put('/users/:userId/teacher-profile', authorize('ADMIN'), teacherController.updateTeacherProfile);
router.delete('/users/:userId/teacher-profile', authorize('ADMIN'), teacherController.deleteTeacherProfile);

router.get('/teachers/me/courses', authorize('TEACHER'), teacherController.getTeacherAssignedCourses);

module.exports = router;