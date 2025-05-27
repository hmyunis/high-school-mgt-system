// src/controllers/assessmentController.js
const db = require('../models');
const { Assessment, Course, Teacher, CourseTeacher, User } = db; // User for author details
const { Op } = require('sequelize');

// Helper function to check if the logged-in teacher is assigned to the course
// and can therefore manage its assessments.
const canTeacherManageCourse = async (teacherProfileId, courseId) => {
    const assignment = await CourseTeacher.findOne({
        where: {
            teacher_id: teacherProfileId,
            course_id: courseId,
        },
    });
    return !!assignment;
};

// 1. Create a new Assessment for a Course
exports.createAssessment = async (req, res) => {
    const { courseId } = req.params; // Assessment is created within a course context
    const { name, weight /*, dueDate, maxScore, description */ } = req.body;
    const loggedInUserId = req.user.id; // From 'protect' middleware

    if (!name || weight === undefined) {
        return res.status(400).json({ message: 'Assessment name and weight are required.' });
    }
    if (typeof weight !== 'number' || weight < 0 || weight > 100) {
        return res.status(400).json({ message: 'Weight must be a number between 0 and 100.' });
    }

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId } });
        if (!teacherProfile) {
            return res.status(403).json({ message: "Forbidden: User is not a teacher or profile not found." });
        }

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: `Course with ID ${courseId} not found.` });
        }

        // Authorization: Check if this teacher is assigned to this course
        if (!await canTeacherManageCourse(teacherProfile.id, courseId)) {
            return res.status(403).json({ message: "Forbidden: You are not assigned to teach this course." });
        }

        const newAssessment = await Assessment.create({
            course_id: courseId,
            author_id: teacherProfile.id, // Logged-in teacher is the author
            name,
            weight,
            // dueDate: dueDate || null,
            // maxScore: maxScore || null,
            // description: description || null,
        });

        res.status(201).json({ message: 'Assessment created successfully', data: newAssessment });
    } catch (error) {
        console.error('Error creating assessment:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 2. Get all Assessments for a specific Course
// (Teachers should only see assessments for courses they teach)
exports.getAssessmentsForCourse = async (req, res) => {
    const { courseId } = req.params;
    const loggedInUserId = req.user.id;

    try {
        const user = await User.findByPk(loggedInUserId);
        if (!user && user.role == 'TEACHER') {
            const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId } });
            if (!teacherProfile) {
                return res.status(403).json({ message: "Forbidden: Teacher profile not found." });
            }
    
            // Authorization: Check if this teacher is assigned to this course
            if (!await canTeacherManageCourse(teacherProfile.id, courseId)) {
                return res.status(403).json({ message: "Forbidden: You are not assigned to view assessments for this course." });
            }
        }

        const assessments = await Assessment.findAll({
            where: { course_id: courseId },
            include: [
                { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
                {
                    model: Teacher, as: 'author',
                    attributes: ['id', 'user_id'],
                    include: [{ model: User, as: 'user', attributes: ['fullName'] }]
                }
            ],
            order: [['createdAt', 'ASC']],
        });
        res.json({ message: `Assessments for course ID ${courseId} retrieved successfully`, data: assessments });
    } catch (error) {
        console.error('Error retrieving assessments:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 3. Get a single Assessment by its ID
// (Teacher should only be able to get it if they teach the course it belongs to)
exports.getAssessmentById = async (req, res) => {
    const { assessmentId } = req.params;
    const loggedInUserId = req.user.id;

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId } });
        if (!teacherProfile) {
            return res.status(403).json({ message: "Forbidden: User is not a teacher or profile not found." });
        }

        const assessment = await Assessment.findByPk(assessmentId, {
            include: [
                { model: Course, as: 'course', attributes: ['id', 'name', 'code'] },
                {
                    model: Teacher, as: 'author',
                    attributes: ['id', 'user_id'],
                    include: [{ model: User, as: 'user', attributes: ['fullName'] }]
                }
            ]
        });

        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found.' });
        }

        // Authorization: Check if the teacher can manage the course this assessment belongs to
        if (!await canTeacherManageCourse(teacherProfile.id, assessment.course_id)) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to view this assessment." });
        }

        res.json({ message: 'Assessment retrieved successfully', data: assessment });
    } catch (error) {
        console.error('Error retrieving assessment:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 4. Update an Assessment
exports.updateAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const { name, weight /*, dueDate, maxScore, description */ } = req.body;
    const loggedInUserId = req.user.id;

    if (weight !== undefined && (typeof weight !== 'number' || weight < 0 || weight > 100)) {
        return res.status(400).json({ message: 'Weight must be a number between 0 and 100 if provided.' });
    }

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId } });
        if (!teacherProfile) {
            return res.status(403).json({ message: "Forbidden: User is not a teacher or profile not found." });
        }

        const assessment = await Assessment.findByPk(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found.' });
        }

        // Authorization: Teacher must be assigned to the course OR be the author of the assessment.
        // Stricter: Only author can edit. More lenient: Any teacher of the course can edit.
        // For now, let's say any teacher of the course can edit assessments for that course.
        const canManage = await canTeacherManageCourse(teacherProfile.id, assessment.course_id);
        // if (assessment.author_id !== teacherProfile.id && !canManage) { // Stricter: only author or course teacher
        if (!canManage) { // Any teacher of the course can edit
             return res.status(403).json({ message: "Forbidden: You are not authorized to update this assessment." });
        }

        if (name !== undefined) assessment.name = name;
        if (weight !== undefined) assessment.weight = weight;
        // if (dueDate !== undefined) assessment.dueDate = dueDate;
        // if (maxScore !== undefined) assessment.maxScore = maxScore;
        // if (description !== undefined) assessment.description = description;

        await assessment.save();
        res.json({ message: 'Assessment updated successfully', data: assessment });
    } catch (error) {
        console.error('Error updating assessment:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 5. Delete an Assessment
exports.deleteAssessment = async (req, res) => {
    const { assessmentId } = req.params;
    const loggedInUserId = req.user.id;

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: loggedInUserId } });
        if (!teacherProfile) {
            return res.status(403).json({ message: "Forbidden: User is not a teacher or profile not found." });
        }

        const assessment = await Assessment.findByPk(assessmentId);
        if (!assessment) {
            return res.status(404).json({ message: 'Assessment not found.' });
        }

        // Authorization: Same logic as update. For now, any teacher of the course.
        const canManage = await canTeacherManageCourse(teacherProfile.id, assessment.course_id);
        if (!canManage) {
            return res.status(403).json({ message: "Forbidden: You are not authorized to delete this assessment." });
        }

        // Deleting an assessment will also delete its scores due to onDelete: 'CASCADE' in Assessment -> StudentAssessment
        await assessment.destroy();
        res.json({ message: 'Assessment deleted successfully.' });
    } catch (error)
    {
        console.error('Error deleting assessment:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};