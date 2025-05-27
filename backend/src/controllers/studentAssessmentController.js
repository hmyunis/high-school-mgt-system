// src/controllers/studentAssessmentController.js
const db = require('../models');
const { StudentAssessment, Assessment, Student, User, Course, Teacher, CourseTeacher } = db;
const { Op } = require('sequelize');

// Helper to check if teacher can manage the assessment (i.e., teaches the course)
const canTeacherManageAssessment = async (teacherProfileId, assessmentId) => {
    const assessment = await Assessment.findByPk(assessmentId);
    if (!assessment) return false;

    const assignment = await CourseTeacher.findOne({
        where: {
            teacher_id: teacherProfileId,
            course_id: assessment.course_id,
        },
    });
    return !!assignment;
};


// 1. Get all scores for a specific assessment
exports.getScoresForAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const loggedInUserId = req.user.id; // From 'protect' middleware

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId }});
        if (!teacherProfile) {
            return res.status(403).json({ message: "Forbidden: User is not a teacher." });
        }

        if (!await canTeacherManageAssessment(teacherProfile.id, assessmentId)) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view scores for this assessment." });
        }

        const scores = await StudentAssessment.findAll({
            where: { assessment_id: assessmentId },
            attributes: ['id', 'student_id', 'score', 'createdAt', 'updatedAt'], // Include PK of StudentAssessment
            // Optionally include student details if needed directly here,
            // though the frontend might fetch students separately
            // include: [{
            //     model: Student,
            //     as: 'student',
            //     attributes: ['id', 'user_id'],
            //     include: [{ model: User, as: 'user', attributes: ['fullName'] }]
            // }]
        });

        res.json({ message: 'Scores retrieved successfully.', data: scores });
    } catch (error) {
        console.error(`Error retrieving scores for assessment ${assessmentId}:`, error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 2. Submit/Update (Upsert) scores for an assessment (Batch operation)
exports.submitScoresForAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const { scores } = req.body; // Expects { scores: [{ student_id, score }, ...] }
    const loggedInUserId = req.user.id;

    if (!Array.isArray(scores) || scores.length === 0) {
        return res.status(400).json({ message: 'Scores data must be a non-empty array.' });
    }

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId }});
        if (!teacherProfile) {
            return res.status(403).json({ message: "Forbidden: User is not a teacher." });
        }

        const assessment = await Assessment.findByPk(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: "Assessment not found." });
        }

        if (!await canTeacherManageAssessment(teacherProfile.id, assessmentId)) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to submit scores for this assessment." });
        }

        const transaction = await db.sequelize.transaction();
        let createdCount = 0;
        let updatedCount = 0;

        try {
            for (const scoreEntry of scores) {
                if (scoreEntry.student_id === undefined || scoreEntry.score === undefined) {
                    await transaction.rollback();
                    return res.status(400).json({ message: 'Each score entry must have student_id and score.' });
                }
                // Validate score (e.g., numeric, within range if assessment.maxScore exists)
                const scoreValue = parseFloat(scoreEntry.score);
                if (isNaN(scoreValue) || scoreValue < 0) { // Basic validation
                     await transaction.rollback();
                    return res.status(400).json({ message: `Invalid score value '${scoreEntry.score}' for student ID ${scoreEntry.student_id}. Must be non-negative.` });
                }
                if (assessment.maxScore !== null && scoreValue > assessment.maxScore) {
                     await transaction.rollback();
                    return res.status(400).json({ message: `Score ${scoreValue} for student ID ${scoreEntry.student_id} exceeds max score of ${assessment.maxScore}.` });
                }


                const [studentAssessment, created] = await StudentAssessment.findOrCreate({
                    where: {
                        assessment_id: parseInt(assessmentId),
                        student_id: parseInt(scoreEntry.student_id),
                    },
                    defaults: {
                        score: scoreValue,
                    },
                    transaction,
                });

                if (created) {
                    createdCount++;
                } else {
                    // If found, update the score if it's different
                    if (studentAssessment.score !== scoreValue) {
                        studentAssessment.score = scoreValue;
                        await studentAssessment.save({ transaction });
                        updatedCount++;
                    }
                }
            }

            await transaction.commit();
            res.json({
                message: `Scores submitted successfully. ${createdCount} created, ${updatedCount} updated.`,
                data: { createdCount, updatedCount }
            });

        } catch (err) {
            await transaction.rollback();
            console.error(`Error processing scores for assessment ${assessmentId}:`, err);
            if (err.name === 'SequelizeForeignKeyConstraintError') {
                 return res.status(400).json({ message: 'Invalid student ID found in scores. Please check student data.' });
            }
            res.status(500).json({ message: 'Error processing scores.' });
        }

    } catch (error) {
        console.error(`Error submitting scores for assessment ${assessmentId}:`, error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};