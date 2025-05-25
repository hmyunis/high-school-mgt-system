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
  User.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE'),
      allowNull: true
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('ADMIN', 'TEACHER', 'STUDENT'),
      allowNull: false
    },
    isActive: { // User can be active/inactive for login purposes
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    isArchived: { // For soft-delete
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    // Add a default scope to exclude archived users from normal queries
    defaultScope: {
      where: {
        isArchived: false,
      },
      attributes: { exclude: ['password'] }, // Exclude password by default
    },
    scopes: {
      withPassword: {
        attributes: {}, // Include all attributes, overriding exclude in defaultScope
      },
      archived: { // Scope to explicitly get archived users
        where: {
          isArchived: true,
        },
        attributes: { exclude: ['password'] },
      },
      all: { // Scope to get all users, including archived, overriding defaultScope's where
        where: {},
        attributes: { exclude: ['password'] },
      }
    }
  });
  return User;
};