const express = require('express');
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.post('/users/:userId/student-profile', studentController.createStudentProfile);
router.get('/users/:userId/student-profile', studentController.getStudentProfile);
router.put('/users/:userId/student-profile', studentController.updateStudentProfile);
router.delete('/users/:userId/student-profile', studentController.deleteStudentProfile);

// You could also have routes like GET /api/students (to list all student profiles, not users)
// router.get('/students', studentController.getAllStudentProfiles); // Implement this in controller if needed

module.exports = router;