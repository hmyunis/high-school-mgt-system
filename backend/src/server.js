require('dotenv').config();

const express = require('express');
const db = require('./models');
const cors = require('cors');
const { seedAdmin } = require('./controllers/authController');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = ['http://localhost:5173'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg =
                'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware
// app.use(cors());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', studentRoutes);
app.use('/api', teacherRoutes);

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Something went wrong!', error: err.message });
});

const startServer = async () => {
    try {
        await db.sequelize.sync();
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
