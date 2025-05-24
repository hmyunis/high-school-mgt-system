'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class Student extends Model {
        static associate(models) {
            Student.belongsTo(models.User, {
                foreignKey: 'user_id',
                as: 'user',
                allowNull: false,
            });
            Student.belongsToMany(models.Assessment, {
                through: models.StudentAssessment,
                foreignKey: 'student_id',
                otherKey: 'assessment_id',
                as: 'assessmentsTaken',
            });
        }
    }
    Student.init(
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
                unique: true, // One user can only have one student profile
                references: {
                    model: 'Users',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            gradeLevel: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
            section: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            absentCount: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },
            underProbation: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },
        },
        {
            sequelize,
            modelName: 'Student',
            tableName: 'Students',
            timestamps: true,
        }
    );
    return Student;
};
