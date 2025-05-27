// src/routes/studentAssessmentRoutes.js
const express = require('express');
const studentAssessmentController = require('../controllers/studentAssessmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true }); // Enable mergeParams to access :assessmentId from parent

// All routes require TEACHER role and are protected
router.use(protect);
router.use(authorize('TEACHER'));

// These routes will be nested under /api/assessments/:assessmentId/scores
router.get('/', studentAssessmentController.getScoresForAssessment);
router.post('/', studentAssessmentController.submitScoresForAssessment); // For batch create/update

module.exports = router;