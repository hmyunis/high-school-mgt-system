require('dotenv').config();

const express = require('express');
const db = require('./models');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { seedAdmin } = require('./controllers/authController');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:5173'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg =
                'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true, // If you need to allow cookies or authorization headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allowed headers
};

// Middleware
// app.use(cors()); // Enable CORS for all routes
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);

// Example of a simple protected route
const { protect, authorize } = require('./middlewares/authMiddleware');
app.get('/api/admin-only', protect, authorize('ADMIN'), (req, res) => {
    res.json({ message: 'Welcome Admin! This is a protected admin area.', user: req.auth });
});
app.get('/api/teacher-area', protect, authorize('TEACHER', 'ADMIN'), (req, res) => {
    res.json({ message: 'Welcome Teacher/Admin! This is the teacher area.', user: req.auth });
});
app.get('/api/student-info', protect, authorize('STUDENT', 'ADMIN'), (req, res) => {
    res.json({ message: 'Welcome Student/Admin! This is your info area.', user: req.auth });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

const startServer = async () => {
    try {
        await db.sequelize.sync({ alter: true, force: true });
        console.log('Database synchronized successfully.');

        await seedAdmin();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(
                `JWT Secret Loaded: ${process.env.JWT_SECRET ? 'Yes' : 'NO!!! CHECK .env'}`
            );
            console.log(`JWT Expires In: ${process.env.JWT_EXPIRES_IN}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database or start server:', error);
    }
};

startServer();
