// src/routes/assessmentRoutes.js
const express = require('express');
const assessmentController = require('../controllers/assessmentController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true }); // Enable mergeParams to access :courseId from parent router

router.use(protect);

// For routes like /api/course/:courseId/assessments
router.post('/', authorize('TEACHER'), assessmentController.createAssessment);
router.get('/', authorize('TEACHER', 'STUDENT'), assessmentController.getAssessmentsForCourse);

// For routes like /api/assessments/:assessmentId (direct access to an assessment)
// These are separate from the course-nested ones for specific assessment operations
const singleAssessmentRouter = express.Router();
singleAssessmentRouter.use(protect); // Redundant if top-level router.use(protect) is hit first, but good for clarity
singleAssessmentRouter.use(authorize('TEACHER'));

singleAssessmentRouter.get('/:assessmentId', assessmentController.getAssessmentById);
singleAssessmentRouter.put('/:assessmentId', assessmentController.updateAssessment);
singleAssessmentRouter.delete('/:assessmentId', assessmentController.deleteAssessment);

module.exports = { courseAssessmentsRouter: router, assessmentsRouter: singleAssessmentRouter };