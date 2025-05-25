const db = require('../models');
const { Teacher, User, Course } = db;
const { Op } = require('sequelize');

// 1. Create a Teacher Profile for an Existing User
exports.createTeacherProfile = async (req, res) => {
    const { userId } = req.params;
    const { salary } = req.body;

    // salary can be null or a number
    if (salary !== undefined && (typeof salary !== 'number' || salary < 0)) {
        return res.status(400).json({ message: 'Salary must be a non-negative number if provided.' });
    }

    try {
        // Find the user
        const user = await User.findByPk(userId);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${userId} not found.` });
        }

        // Check if the user's role is 'TEACHER'
        if (user.role !== 'TEACHER') {
            return res.status(400).json({ message: `User with ID ${userId} is not a teacher. Current role: ${user.role}` });
        }

        // Check if a teacher profile already exists for this user
        const existingTeacherProfile = await Teacher.findOne({ where: { user_id: userId } });
        if (existingTeacherProfile) {
            return res.status(400).json({ message: `A teacher profile already exists for user ID ${userId}.` });
        }

        const newTeacherProfile = await Teacher.create({
            user_id: userId,
            salary: salary !== undefined ? salary : null,
            // ...other teacher fields
        });

        res.status(201).json({ message: 'Teacher profile created successfully.', data: newTeacherProfile });

    } catch (error) {
        console.error('Error creating teacher profile:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 2. Get Teacher Profile by User ID
exports.getTeacherProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const teacherProfile = await Teacher.findOne({
            where: { user_id: userId },
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: { exclude: ['password', 'isArchived'] }
                },
                {
                    model: Course,
                    as: 'coursesTaught',
                    attributes: ['id', 'name', 'code'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!teacherProfile) {
            return res.status(404).json({ message: `Teacher profile not found for user ID ${userId}.` });
        }
        res.json({ message: 'Teacher profile retrieved successfully.', data: teacherProfile });
    } catch (error) {
        console.error('Error retrieving teacher profile:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 3. Update Teacher Profile by User ID
exports.updateTeacherProfile = async (req, res) => {
    const { userId } = req.params;
    const { salary } = req.body;

    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: userId } });
        if (!teacherProfile) {
            return res.status(404).json({ message: `Teacher profile not found for user ID ${userId}.` });
        }

        if (salary !== undefined) {
             if (typeof salary !== 'number' || salary < 0) {
                return res.status(400).json({ message: 'Salary must be a non-negative number.' });
            }
            teacherProfile.salary = salary;
        }
        // Update other fields...

        await teacherProfile.save();
        res.json({ message: 'Teacher profile updated successfully.', data: teacherProfile });
    } catch (error) {
        console.error('Error updating teacher profile:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 4. Delete Teacher Profile by User ID
exports.deleteTeacherProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const teacherProfile = await Teacher.findOne({ where: { user_id: userId } });
        if (!teacherProfile) {
            return res.status(404).json({ message: `Teacher profile not found for user ID ${userId}.` });
        }

        // Important: Consider what happens to CourseTeacher assignments.
        // If onDelete: 'CASCADE' is set on CourseTeacher for teacher_id, those will be handled.
        // Otherwise, you might need to manually remove them or the DB will throw an error.
        await teacherProfile.destroy();
        res.json({ message: 'Teacher profile deleted successfully.' });
    } catch (error) {
        console.error('Error deleting teacher profile:', error);
        // Check for foreign key constraint errors if onDelete: 'CASCADE' isn't set
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            return res.status(400).json({ message: 'Cannot delete teacher profile. They might still be assigned to courses. Please unassign them first.' });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};