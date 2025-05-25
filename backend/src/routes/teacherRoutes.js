const express = require('express');
const teacherController = require('../controllers/teacherController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/users/:userId/teacher-profile', teacherController.createTeacherProfile);
router.get('/users/:userId/teacher-profile', teacherController.getTeacherProfile);
router.put('/users/:userId/teacher-profile', teacherController.updateTeacherProfile);
router.delete('/users/:userId/teacher-profile', teacherController.deleteTeacherProfile);
// router.get('/teachers', teacherController.getAllTeacherProfiles); // Implement if needed
module.exports = router;