'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Course extends Model {
        static associate(models) {
            Course.belongsToMany(models.Teacher, {
                through: models.CourseTeacher,
                foreignKey: 'course_id',
                otherKey: 'teacher_id',
                as: 'teachers',
            });
            Course.hasMany(models.Assessment, {
                foreignKey: 'course_id',
                as: 'assessments',
            });
        }
    }
    Course.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
        },
        {
            sequelize,
            modelName: 'Course',
            tableName: 'Courses',
            timestamps: true,
        }
    );
    return Course;
};
