'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            User.hasOne(models.Student, {
                foreignKey: 'user_id',
                as: 'studentProfile',
                onDelete: 'CASCADE',
            });
            User.hasOne(models.Teacher, {
                foreignKey: 'user_id',
                as: 'teacherProfile',
                onDelete: 'CASCADE',
            });
        }
    }
    User.init(
        {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: DataTypes.INTEGER,
            },
            username: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            fullName: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            phone: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            email: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    isEmail: true,
                },
            },
            gender: {
                type: DataTypes.ENUM('MALE', 'FEMALE'),
                allowNull: false,
            },
            dateOfBirth: {
                type: DataTypes.DATEONLY,
                allowNull: true,
            },
            role: {
                type: DataTypes.ENUM('ADMIN', 'TEACHER', 'STUDENT'),
                allowNull: false,
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            lastLogin: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: 'User',
            tableName: 'Users',
            timestamps: true, // Adds createdAt and updatedAt fields
        }
    );
    return User;
};
