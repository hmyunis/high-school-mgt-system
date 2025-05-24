const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');
const db = require('../models');
const { User } = db;

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, jwtConfig.secret);

            // Find user by ID from token, ensure they are active
            req.user = await User.findOne({ where: { id: decoded.userId, isActive: true } });

            if (!req.user) {
                return res
                    .status(401)
                    .json({ message: 'Not authorized, user not found or inactive' });
            }

            // Attach user's role and id from decoded token to request object
            req.auth = { userId: decoded.userId, role: decoded.role };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ message: 'Token expired. Please log in again.' });
            }
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ message: 'Invalid token. Please log in again.' });
            }
            console.error('Auth Error:', error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Middleware to authorize based on roles
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.auth || !req.auth.role || !roles.includes(req.auth.role)) {
            return res
                .status(403)
                .json({ message: 'Forbidden: You do not have permission to perform this action' });
        }
        next();
    };
};

module.exports = { protect, authorize };
