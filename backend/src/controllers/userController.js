const { Op } = require('sequelize');
const db = require('../models');
const { User, Student, Teacher } = db;
const { hashPassword, comparePassword } = require('../utils/authUtils');

const ROLES = {
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
};

const getAllUsers = async (req, res) => {
    const includeArchived = req.query.includeArchived === 'true';

    const baseQueryOptions = {
        include: [
            { model: Student, as: 'studentProfile' },
            { model: Teacher, as: 'teacherProfile' },
        ],
    };

    try {
        let users;
        if (includeArchived) {
            users = await User.scope('all').findAll(baseQueryOptions);
        } else {
            users = await User.findAll(baseQueryOptions);
        }

        res.json({ message: 'Users retrieved successfully', data: users });
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserById = async (req, res) => {
    const userId = req.params.id;
    const includeArchived = req.query.includeArchived === 'true'; // Allow fetching archived by ID

    let queryOptions = {
        // Default scope already excludes password and filters isArchived:false
        include: [
            { model: Student, as: 'studentProfile' },
            { model: Teacher, as: 'teacherProfile' },
        ],
    };

    try {
        // If we want to fetch an archived user by ID, we need to bypass the default scope's `isArchived: false`
        const user = includeArchived
            ? await User.scope('all').findByPk(userId, queryOptions)
            : await User.findByPk(userId, queryOptions);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        // If the user is archived and includeArchived wasn't true, treat as not found for regular requests
        if (user.isArchived && !includeArchived) {
            return res.status(404).json({ message: 'User not found (or is archived)' });
        }

        res.json({ message: 'User retrieved successfully', data: user });
    } catch (error) {
        console.error('Error retrieving user:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const getMyProfile = async (req, res) => {
    const userId = req.auth.userId;

    try {
        const user = await User.scope('all').findByPk(userId, {
            include: [
                { model: Student, as: 'studentProfile' },
                { model: Teacher, as: 'teacherProfile' },
            ],
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Remove password from response
        const userResponse = { ...user.toJSON() };
        delete userResponse.password;

        res.json({ message: 'User profile retrieved successfully', data: userResponse });
    } catch (error) {
        console.error('Error retrieving user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const createUser = async (req, res) => {
    const { username, password, fullName, email, phone, dateOfBirth, gender, role } = req.body;

    if (!username || !password || !fullName || !email || !role) {
        return res.status(400).json({
            message: 'Missing required fields: username, password, fullName, email, role',
        });
    }

    try {
        const existingUserByUsername = await User.scope('all').findOne({ where: { username } });
        if (existingUserByUsername) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const existingUserByEmail = await User.scope('all').findOne({ where: { email } });
        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            fullName,
            email,
            phone: phone || null,
            gender: gender || null,
            dateOfBirth: dateOfBirth || null,
            role,
        });

        const userResponse = { ...newUser.toJSON() };
        delete userResponse.password;

        res.status(201).json({ message: 'User created successfully', data: userResponse });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.name === 'SequelizeValidationError') {
            return res
                .status(400)
                .json({ message: 'Validation error', errors: error.errors.map((e) => e.message) });
        }
        res.status(500).json({ message: 'Internal server error during user creation' });
    }
};

const updateUser = async (req, res) => {
    const targetUserId = parseInt(req.params.id, 10); // User being updated
    const editorUser = req.user;

    if (!editorUser) {
        return res.status(401).json({ message: 'Not authorized' }); // Should be caught by middleware
    }

    const {
        username,
        password,
        currentPassword,
        fullName,
        email,
        phone,
        dateOfBirth,
        gender,
        role,
        isActive,
    } = req.body;

    try {
        // Fetch target user, including archived ones, as an admin might update an archived user
        const targetUser = await User.scope('all').findByPk(targetUserId);

        if (!targetUser) {
            return res.status(404).json({ message: 'User to update not found' });
        }

        const isSelfUpdate = editorUser.id === targetUser.id;
        const updateFields = {};

        // Username update
        if (username && username !== targetUser.username) {
            const existingUser = await User.scope('all').findOne({
                where: { username, id: { [Op.ne]: targetUser.id } }, // Check other users
            });
            if (existingUser) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            updateFields.username = username;
        }

        // Email update
        if (email && email !== targetUser.email) {
            const existingEmail = await User.scope('all').findOne({
                where: { email, id: { [Op.ne]: targetUser.id } }, // Check other users
            });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already taken' });
            }
            updateFields.email = email;
        }

        // Password update
        if (password) {
            if (isSelfUpdate) {
                if (!currentPassword) {
                    return res
                        .status(400)
                        .json({ message: 'Current password is required to change your password.' });
                }
                // Need to fetch user with password for comparison
                const userWithPassword = await User.scope('withPassword').findByPk(editorUser.id);
                const isMatch = await comparePassword(currentPassword, userWithPassword.password);
                if (!isMatch) {
                    return res.status(401).json({ message: 'Incorrect current password.' });
                }
            } else if (editorUser.role !== ROLES.ADMIN) {
                // Only admin can change others' passwords without current password
                return res
                    .status(403)
                    .json({ message: "Forbidden: You cannot change another user's password." });
            }
            updateFields.password = await hashPassword(password);
        }

        // Other common fields (can be updated by self or admin)
        if (fullName !== undefined) updateFields.fullName = fullName;
        if (phone !== undefined) updateFields.phone = phone?.trim() || null;
        if (dateOfBirth !== undefined) updateFields.dateOfBirth = dateOfBirth?.trim() || null;
        if (gender !== undefined) updateFields.gender = gender;

        // Role update (only by ADMIN, and not on self if admin is only role)
        if (role !== undefined && role !== targetUser.role) {
            if (editorUser.role === ROLES.ADMIN) {
                if (
                    isSelfUpdate &&
                    targetUser.role === ROLES.ADMIN &&
                    (await User.count({ where: { role: ROLES.ADMIN, isArchived: false } })) === 1
                ) {
                    return res
                        .status(400)
                        .json({ message: 'Cannot change role of the only active admin.' });
                }
                updateFields.role = role;
            } else if (!isSelfUpdate || (isSelfUpdate && role !== targetUser.role)) {
                // Non-admins cannot change roles at all.
                return res
                    .status(403)
                    .json({ message: 'Forbidden: You cannot change user roles.' });
            }
        }

        // isActive update (complex logic)
        if (isActive !== undefined && isActive !== targetUser.isActive) {
            if (isSelfUpdate) {
                return res
                    .status(403)
                    .json({ message: 'Forbidden: You cannot change your own active status.' });
            }
            if (editorUser.role === ROLES.ADMIN) {
                // Admin can change anyone's (except if target is the only active admin and trying to deactivate)
                if (
                    targetUser.role === ROLES.ADMIN &&
                    !isActive &&
                    (await User.count({
                        where: {
                            role: ROLES.ADMIN,
                            isActive: true,
                            isArchived: false,
                            id: { [Op.ne]: targetUser.id },
                        },
                    })) === 0
                ) {
                    return res
                        .status(400)
                        .json({ message: 'Cannot deactivate the only active admin.' });
                }
                updateFields.isActive = isActive;
            } else if (editorUser.role === ROLES.TEACHER && targetUser.role === ROLES.STUDENT) {
                // Teacher can change STUDENT's isActive status
                updateFields.isActive = isActive;
            } else {
                return res.status(403).json({
                    message:
                        "Forbidden: You do not have permission to change this user's active status.",
                });
            }
        }

        if (Object.keys(updateFields).length === 0) {
            return res.status(200).json({
                message: 'No fields provided for update, no changes made.',
                data: targetUser,
            });
        }

        await targetUser.update(updateFields);

        // Return updated user without password
        const updatedUserResponse = { ...targetUser.toJSON() };
        delete updatedUserResponse.password;

        res.json({ message: 'User updated successfully', data: updatedUserResponse });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.name === 'SequelizeValidationError') {
            return res
                .status(400)
                .json({ message: 'Validation error', errors: error.errors.map((e) => e.message) });
        }
        res.status(500).json({ message: 'Internal server error during user update' });
    }
};

// "Delete" user by marking as archived (soft delete)
const archiveUser = async (req, res) => {
    const userId = req.params.id;
    const editorUser = req.user;

    try {
        const userToArchive = await User.scope('all').findByPk(userId);

        if (!userToArchive) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userToArchive.isArchived) {
            return res.status(400).json({ message: 'User is already archived.' });
        }

        // Prevent archiving the last active admin
        if (userToArchive.role === ROLES.ADMIN && userToArchive.isActive) {
            const activeAdminCount = await User.count({
                where: { role: ROLES.ADMIN, isActive: true, isArchived: false },
            });
            if (activeAdminCount <= 1 && userToArchive.id === editorUser.id) {
                return res.status(400).json({ message: 'Cannot archive the only active admin.' });
            }
            if (
                activeAdminCount <= 1 &&
                userToArchive.id !== editorUser.id &&
                editorUser.role === ROLES.ADMIN
            ) {
                // An admin is trying to archive the last other active admin.
                return res.status(400).json({ message: 'Cannot archive the last active admin.' });
            }
        }

        userToArchive.isArchived = true;
        userToArchive.isActive = false;
        await userToArchive.save();

        res.json({ message: 'User archived successfully (moved to trash bin)' });
    } catch (error) {
        console.error('Error archiving user:', error);
        res.status(500).json({ message: 'Internal server error during user archiving' });
    }
};

const restoreUser = async (req, res) => {
    const userId = req.params.id;

    try {
        // Fetch user including archived ones
        const userToRestore = await User.scope('all').findByPk(userId);

        if (!userToRestore) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!userToRestore.isArchived) {
            return res.status(400).json({ message: 'User is not archived.' });
        }

        userToRestore.isArchived = false;
        userToRestore.isActive = true;
        await userToRestore.save();

        res.json({ message: 'User restored successfully' });
    } catch (error) {
        console.error('Error restoring user:', error);
        res.status(500).json({ message: 'Internal server error during user restoration' });
    }
};

const permanentDeleteUser = async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.scope('all').findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role === ROLES.ADMIN) {
            const adminCount = await User.scope('all').count({ where: { role: ROLES.ADMIN } });
            if (adminCount <= 1) {
                return res
                    .status(400)
                    .json({ message: 'Cannot permanently delete the only admin account.' });
            }
        }

        await user.destroy();

        res.json({ message: 'User permanently deleted successfully' });
    } catch (error) {
        console.error('Error permanently deleting user:', error);
        res.status(500).json({ message: 'Internal server error during permanent user deletion' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    getMyProfile,
    createUser,
    updateUser,
    archiveUser,
    restoreUser,
    permanentDeleteUser,
};
