'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Teacher extends Model {
        static associate(models) {
            Teacher.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user',
                allowNull: false,
            });
            Teacher.belongsToMany(models.Course, {
                through: models.CourseTeacher,
                foreignKey: 'teacher_id',
                otherKey: 'course_id',
                as: 'coursesTaught',
            });
            Teacher.hasMany(models.Assessment, {
                foreignKey: 'author_id',
                as: 'authoredAssessments',
            });
        }
    }
    Teacher.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            user_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true, // One user can only have one teacher profile
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            salary: {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'Teacher',
            tableName: 'Teachers',
            timestamps: true,
        }
    );
    return Teacher;
};
