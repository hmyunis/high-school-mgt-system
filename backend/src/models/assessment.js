'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Assessment extends Model {
        static associate(models) {
            Assessment.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course',
                allowNull: false,
            });
            Assessment.belongsTo(models.Teacher, {
                foreignKey: 'author_id',
                as: 'author',
                allowNull: false,
            });
            Assessment.belongsToMany(models.Student, {
                through: models.StudentAssessment,
                foreignKey: 'assessment_id',
                otherKey: 'student_id',
                as: 'studentsTaking',
            });
        }
    }
    Assessment.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            course_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Courses',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE', // If course is deleted, its assessments are deleted
            },
            author_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Teachers',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'SET NULL',
            },
            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            weight: {
                type: DataTypes.DECIMAL(5, 2), // e.g., 20.00 for 20%
                allowNull: false,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
        },
        {
            sequelize,
            modelName: 'Assessment',
            tableName: 'Assessments',
            timestamps: true,
        }
    );
    return Assessment;
};
