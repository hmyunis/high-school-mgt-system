const db = require('../models');
const { User } = db;
const { comparePassword, generateToken, hashPassword } = require('../utils/authUtils');

const seedAdmin = async () => {
    try {
        const existingAdmin = await User.findOne({ where: { role: 'ADMIN' } });
        if (!existingAdmin) {
            const hashedPassword = await hashPassword('admin123'); // Choose a strong password
            await User.create({
                username: 'admin',
                password: hashedPassword,
                fullName: 'Site Administrator',
                email: 'admin@example.com',
                gender: 'FEMALE',
                role: 'ADMIN',
                isActive: true,
            });
            console.log('Admin user created.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please provide username and password' });
    }

    try {
        const user = await User.scope('withPassword').findOne({ where: { username } });

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials or user inactive' });
        }

        const isMatch = await comparePassword(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Update lastLogin
        user.lastLogin = new Date();
        await user.save();

        const tokenPayload = {
            userId: user.id,
            username: user.username,
            role: user.role,
        };
        const token = generateToken(tokenPayload);

        res.json({
            message: 'Login successful',
            data: {
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    lastLogin: user.lastLogin,
                },
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const getMe = async (req, res) => {
    // req.user is attached by the 'protect' middleware
    // req.auth contains { userId, role } from the token
    if (!req.user) {
        return res.status(404).json({
            message: 'User not found (this should not happen if protect middleware is correct)',
        });
    }
    res.json({
        message: 'User info retrieved successfully',
        data: {
            id: req.user.id,
            username: req.user.username,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
            lastLogin: req.user.lastLogin,
        },
    });
};

module.exports = {
    login,
    getMe,
    seedAdmin,
};
