const express = require('express');
const studentController = require('../controllers/studentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();


router.use(protect);

router.post('/users/:userId/student-profile', authorize('ADMIN'), studentController.createStudentProfile);
router.get('/users/:userId/student-profile', authorize('ADMIN'), studentController.getStudentProfile);
router.put('/users/:userId/student-profile', authorize('ADMIN'), studentController.updateStudentProfile);
router.delete('/users/:userId/student-profile', authorize('ADMIN'), studentController.deleteStudentProfile);

router.get('/students/me/assessments/:assessmentId/score', protect, authorize('STUDENT'), studentController.getMyScoreForAssessment);
router.get('/students/me/scores', protect, authorize('STUDENT'), studentController.getMyAllScores);

module.exports = router;