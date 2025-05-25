const db = require('../models');
const { Course, Teacher, User, CourseTeacher } = db;
const { Op } = require('sequelize');

// 1. Create a new Course
exports.createCourse = async (req, res) => {
    const { name, code } = req.body;

    if (!name || !code) {
        return res.status(400).json({ message: 'Course name and code are required.' });
    }

    try {
        // Check if course code already exists
        const existingCourse = await Course.findOne({ where: { code } });
        if (existingCourse) {
            return res.status(400).json({ message: `Course code '${code}' already exists.` });
        }

        const newCourse = await Course.create({ name, code });
        res.status(201).json({ message: 'Course created successfully', data: newCourse });
    } catch (error) {
        console.error('Error creating course:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Internal server error during course creation.' });
    }
};

// 2. Get all Courses (with teacher details)
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.findAll({
            include: [{
                model: Teacher,
                as: 'teachers', // This alias must match the one in your Course.belongsToMany(Teacher) association
                attributes: ['id', 'user_id', 'salary'], // Specify attributes you want from Teacher
                through: { attributes: [] }, // Don't include CourseTeacher attributes if not needed
                include: [{ // Optionally include User details for the teacher
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email'] // Specify user attributes
                }]
            }],
            order: [['name', 'ASC']], // Default sort order
        });
        res.json({ message: 'Courses retrieved successfully', data: courses });
    } catch (error) {
        console.error('Error retrieving courses:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 3. Get a single Course by ID (with teacher details)
exports.getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await Course.findByPk(id, {
            include: [{
                model: Teacher,
                as: 'teachers',
                attributes: ['id', 'user_id', 'salary'],
                through: { attributes: [] },
                 include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'fullName', 'email']
                }]
            }],
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        res.json({ message: 'Course retrieved successfully', data: course });
    } catch (error) {
        console.error('Error retrieving course:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 4. Update a Course
exports.updateCourse = async (req, res) => {
    const { id } = req.params;
    const { name, code } = req.body;

    try {
        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Check if new code conflicts with another course
        if (code && code !== course.code) {
            const existingCourseWithCode = await Course.findOne({ where: { code, id: { [Op.ne]: id } } });
            if (existingCourseWithCode) {
                return res.status(400).json({ message: `Course code '${code}' is already in use by another course.` });
            }
        }

        // Update fields if provided
        if (name !== undefined) course.name = name;
        if (code !== undefined) course.code = code;

        await course.save();
        res.json({ message: 'Course updated successfully', data: course });
    } catch (error) {
        console.error('Error updating course:', error);
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({ message: 'Validation error', errors: error.errors.map(e => e.message) });
        }
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 5. Delete a Course
exports.deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await Course.findByPk(id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // Sequelize's belongsToMany with a 'through' table might require manual removal
        // of associations or rely on onDelete: 'CASCADE' on the CourseTeacher model's foreign keys.
        // If onDelete: 'CASCADE' is set up correctly on CourseTeacher for course_id,
        // deleting the course should also delete related CourseTeacher entries.
        await course.destroy();
        res.json({ message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// 6. Assign a Teacher to a Course
exports.assignTeacherToCourse = async (req, res) => {
  const { courseId } = req.params;
  const { teacherId } = req.body;

  if (!teacherId) {
      return res.status(400).json({ message: 'Teacher ID is required.' });
  }

  try {
      const course = await Course.findByPk(courseId);
      if (!course) {
          return res.status(404).json({ message: 'Course not found.' });
      }

      const teacher = await Teacher.findByPk(teacherId);
      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found.' });
      }

      const existingAssignment = await CourseTeacher.findOne({
          where: { course_id: courseId, teacher_id: teacherId }
      });

      if (existingAssignment) {
          return res.status(400).json({ message: 'Teacher is already assigned to this course.' });
      }

      // Create the assignment in the CourseTeacher table
      // One way is to use the association methods Sequelize provides:
      await course.addTeacher(teacher); // 'addTeacher' comes from the 'as: teachers' alias in belongsToMany

      // Or create directly:
      // await CourseTeacher.create({ course_id: courseId, teacher_id: teacherId });

      res.status(201).json({ message: 'Teacher assigned to course successfully.' });
  } catch (error) {
      console.error('Error assigning teacher to course:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};

// 7. Remove a Teacher from a Course
exports.removeTeacherFromCourse = async (req, res) => {
  const { courseId, teacherId } = req.params;

  try {
      const course = await Course.findByPk(courseId);
      if (!course) {
          return res.status(404).json({ message: 'Course not found.' });
      }

      const teacher = await Teacher.findByPk(teacherId);
      if (!teacher) {
          return res.status(404).json({ message: 'Teacher not found.' });
      }

      // Remove the assignment
      // Using association methods:
      const result = await course.removeTeacher(teacher); // 'removeTeacher' from 'as: teachers'

      // Or destroy directly:
      // const result = await CourseTeacher.destroy({
      //    where: { course_id: courseId, teacher_id: teacherId }
      // });

      if (result) { // `removeTeacher` returns 1 if removed, 0 if not found
          res.json({ message: 'Teacher removed from course successfully.' });
      } else {
          res.status(404).json({ message: 'Teacher was not assigned to this course.' });
      }
  } catch (error) {
      console.error('Error removing teacher from course:', error);
      res.status(500).json({ message: 'Internal server error.' });
  }
};