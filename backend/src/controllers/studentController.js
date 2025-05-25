// src/controllers/studentController.js
const db = require('../models');
const { Student, User, Assessment } = db;
const { Op } = require('sequelize');

// 1. Create a Student Profile for an Existing User
exports.createStudentProfile = async (req, res) => {
    const { userId } = req.params; // The ID of the User record
    const { gradeLevel, section, absentCount, underProbation } = req.body;

    if (!gradeLevel) {
        // section can be null, absentCount defaults to 0, underProbation defaults to false
        return res.status(400).json({ message: 'Grade level is required.' });
    }

    try {
        // Find the user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found.` });
        }

        // Check if the user's role is 'STUDENT'
        if (user.role !== 'STUDENT') {
            return res
                .status(400)
                .json({
                    message: `User with ID ${userId} is not a student. Current role: ${user.role}`,
                });
        }

        // Check if a student profile already exists for this user
        const existingStudentProfile = await Student.findOne({ where: { user_id: userId } });
        if (existingStudentProfile) {
            return res
                .status(400)
                .json({ message: `A student profile already exists for user ID ${userId}.` });
        }

        // Create the student profile
        const newStudentProfile = await Student.create({
            user_id: userId,
            gradeLevel,
            section: section || null,
            absentCount: absentCount !== undefined ? absentCount : 0,
            underProbation: underProbation !== undefined ? underProbation : false,
        });

        res.status(201).json({
            message: 'Student profile created successfully.',
            data: newStudentProfile,
        });
    } catch (error) {
        console.error('Error creating student profile:', error);
        if (error.name === 'SequelizeValidationError') {
            return res
                .status(400)
                .json({ message: 'Validation error', errors: error.errors.map((e) => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 2. Get Student Profile by User ID (or Student ID)
exports.getStudentProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const studentProfile = await Student.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: { exclude: ['password', 'isArchived'] }, // Exclude sensitive User fields
                },
                {
                    model: Assessment,
                    as: 'assessmentsTaken',
                    attributes: ['id', 'name', 'weight'],
                    through: { attributes: [] },
                },
            ],
        });

        if (!studentProfile) {
            return res
                .status(404)
                .json({ message: `Student profile not found for user ID ${userId}.` });
        }
        res.json({ message: 'Student profile retrieved successfully.', data: studentProfile });
    } catch (error) {
        console.error('Error retrieving student profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 3. Update Student Profile by User ID
exports.updateStudentProfile = async (req, res) => {
    const { userId } = req.params;
    const { gradeLevel, section, absentCount, underProbation } = req.body;

    try {
        const studentProfile = await Student.findOne({ where: { user_id: userId } });
        if (!studentProfile) {
            return res
                .status(404)
                .json({ message: `Student profile not found for user ID ${userId}.` });
        }

        // Update fields if provided
        if (gradeLevel !== undefined) studentProfile.gradeLevel = gradeLevel;
        if (section !== undefined) studentProfile.section = section; // Allow setting to null
        if (absentCount !== undefined) studentProfile.absentCount = absentCount;
        if (underProbation !== undefined) studentProfile.underProbation = underProbation;

        await studentProfile.save();
        res.json({ message: 'Student profile updated successfully.', data: studentProfile });
    } catch (error) {
        console.error('Error updating student profile:', error);
        if (error.name === 'SequelizeValidationError') {
            return res
                .status(400)
                .json({ message: 'Validation error', errors: error.errors.map((e) => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 4. Delete Student Profile by User ID (or Student ID)
// Note: Deleting a Student profile usually means the User is no longer a student.
// The User record itself might remain or be archived/deleted separately.
// The `onDelete: 'CASCADE'` on the User model for the studentProfile association handles
// deleting the Student record if the User record is deleted.
// This endpoint would be for detaching the student role/profile from a User without deleting the User.
exports.deleteStudentProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const studentProfile = await Student.findOne({ where: { user_id: userId } });
        if (!studentProfile) {
            return res
                .status(404)
                .json({ message: `Student profile not found for user ID ${userId}.` });
        }

        await studentProfile.destroy();
        res.json({ message: 'Student profile deleted successfully.' });
    } catch (error) {
        console.error('Error deleting student profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};
