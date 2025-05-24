'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CourseTeacher extends Model {
        static associate(models) {
            // to query CourseTeacher directly and include related data.
            CourseTeacher.belongsTo(models.Teacher, { foreignKey: 'teacher_id' });
            CourseTeacher.belongsTo(models.Course, { foreignKey: 'course_id' });
        }
    }
    CourseTeacher.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            teacher_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Teachers',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            course_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Courses',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
        },
        {
            sequelize,
            modelName: 'CourseTeacher',
            tableName: 'CourseTeachers',
            timestamps: true,
            // Ensure a teacher can only be assigned to a course once
            indexes: [
                {
                    unique: true,
                    fields: ['teacher_id', 'course_id'],
                },
            ],
        }
    );
    return CourseTeacher;
};
