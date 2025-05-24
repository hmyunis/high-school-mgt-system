const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');

const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const comparePassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

const generateToken = (payload) => {
    // Payload should be an object, e.g., { userId: user.id, role: user.role }
    return jwt.sign(payload, jwtConfig.secret, {
        expiresIn: jwtConfig.expiresIn,
    });
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, jwtConfig.secret);
    } catch (error) {
        return null; // Or throw error to be caught by middleware
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    generateToken,
    verifyToken,
};
