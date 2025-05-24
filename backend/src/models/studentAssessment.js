'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class StudentAssessment extends Model {
        static associate(models) {
            StudentAssessment.belongsTo(models.Student, { foreignKey: 'student_id' });
            StudentAssessment.belongsTo(models.Assessment, { foreignKey: 'assessment_id' });
        }
    }
    StudentAssessment.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            student_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Students',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            assessment_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: 'Assessments',
                    key: 'id',
                },
                onUpdate: 'CASCADE',
                onDelete: 'CASCADE',
            },
            score: {
                type: DataTypes.DECIMAL(5, 2),
                allowNull: false,
                validate: {
                    min: 0,
                    max: 100,
                },
            },
        },
        {
            sequelize,
            modelName: 'StudentAssessment',
            tableName: 'StudentAssessments',
            timestamps: true,
            indexes: [
                {
                    unique: true,
                    fields: ['student_id', 'assessment_id'], // A student can only have one score per assessment
                },
            ],
        }
    );
    return StudentAssessment;
};
