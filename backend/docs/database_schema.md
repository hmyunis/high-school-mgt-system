# High School Management System - Database Schema

This document outlines the database schema for the High School Management System.
The system uses JWT for authentication, and users can have roles like ADMIN, TEACHER, or STUDENT.

## Table Overview

1.  **User**: Stores common information for all system users.
2.  **Student**: Stores student-specific information.
3.  **Teacher**: Stores teacher-specific information.
4.  **Course**: Stores information about courses offered.
5.  **CourseTeacher**: A junction table for the many-to-many relationship between Courses and Teachers.
6.  **Assessment**: Stores information about assessments created for courses.
7.  **StudentAssessment**: A junction table to store student scores for specific assessments.

---

## Table Definitions

### 1. `User`

Stores login credentials and common profile information for all users.

| Column        | Data Type      | Constraints                                     | Description                                     |
|---------------|----------------|-------------------------------------------------|-------------------------------------------------|
| `id`          | INT / BIGINT   | PRIMARY KEY, AUTO_INCREMENT                     | Unique identifier for the user.                 |
| `username`    | VARCHAR(255)   | NOT NULL, UNIQUE                                | Unique username for login.                      |
| `password`    | VARCHAR(255)   | NOT NULL                                        | Hashed password.                                |
| `fullName`    | VARCHAR(255)   | NOT NULL                                        | Full name of the user.                          |
| `phone`       | VARCHAR(20)    | NULLABLE                                        | Phone number of the user.                       |
| `email`       | VARCHAR(255)   | NOT NULL, UNIQUE                                | Email address of the user.                      |
| `gender`      | VARCHAR(50)    | NOT NULL, CHECK (`gender` IN ('MALE', 'FEMALE'))                                        | Gender of the user (Male, Female). |
| `dateOfBirth` | DATE           | NULLABLE                                        | User's date of birth.                           |
| `role`        | VARCHAR(50)    | NOT NULL, CHECK (`role` IN ('ADMIN', 'TEACHER', 'STUDENT')) | Role of the user in the system.             |
| `isActive`    | BOOLEAN        | NOT NULL, DEFAULT TRUE                          | Whether the user account is active.             |
| `lastLogin`   | TIMESTAMP      | NULLABLE                                        | Timestamp of the user's last login.             |

---

### 2. `Student`

Stores information specific to students, linked to a `User` record.

| Column           | Data Type     | Constraints                             | Description                                    |
|------------------|---------------|-----------------------------------------|------------------------------------------------|
| `id`             | INT / BIGINT  | PRIMARY KEY, AUTO_INCREMENT             | Unique identifier for the student record.      |
| `user_id`        | INT / BIGINT  | NOT NULL, UNIQUE, FOREIGN KEY (`User`.`id`) | Links to the corresponding `User` record.    |
| `gradeLevel`     | INT           | NOT NULL                                | Current grade level of the student.            |
| `section`        | VARCHAR(50)   | NULLABLE                                | Section the student belongs to (e.g., A, B).   |
| `absentCount`    | INT           | NOT NULL, DEFAULT 0                     | Total number of absences for the student.      |
| `underProbation` | BOOLEAN       | NOT NULL, DEFAULT FALSE                 | Whether the student is currently under probation. |

---

### 3. `Teacher`

Stores information specific to teachers, linked to a `User` record.

| Column    | Data Type     | Constraints                             | Description                                  |
|-----------|---------------|-----------------------------------------|----------------------------------------------|
| `id`      | INT / BIGINT  | PRIMARY KEY, AUTO_INCREMENT             | Unique identifier for the teacher record.    |
| `user_id` | INT / BIGINT  | NOT NULL, UNIQUE, FOREIGN KEY (`User`.`id`) | Links to the corresponding `User` record.  |
| `salary`  | DECIMAL(10,2) | NULLABLE                                | Salary of the teacher.                       |

---

### 4. `Course`

Defines the courses offered in the school.

| Column | Data Type     | Constraints                      | Description                               |
|--------|---------------|----------------------------------|-------------------------------------------|
| `id`   | INT / BIGINT  | PRIMARY KEY, AUTO_INCREMENT      | Unique identifier for the course.         |
| `name` | VARCHAR(255)  | NOT NULL                         | Name of the course (e.g., "Mathematics 101"). |
| `code` | VARCHAR(50)   | NOT NULL, UNIQUE                 | Unique code for the course (e.g., "MATH101"). |

---

### 5. `CourseTeacher`

Junction table to manage the many-to-many relationship between `Course` and `Teacher` (a teacher can teach multiple courses, and a course can be taught by multiple teachers).

| Column       | Data Type    | Constraints                                                               | Description                                  |
|--------------|--------------|---------------------------------------------------------------------------|----------------------------------------------|
| `id`         | INT / BIGINT | PRIMARY KEY, AUTO_INCREMENT                                               | Unique identifier for the assignment record. |
| `teacher_id` | INT / BIGINT | NOT NULL, FOREIGN KEY (`Teacher`.`id`)                                      | Links to the `Teacher` record.               |
| `course_id`  | INT / BIGINT | NOT NULL, FOREIGN KEY (`Course`.`id`)                                       | Links to the `Course` record.                |
|              |              | UNIQUE (`teacher_id`, `course_id`)                                        | Ensures a teacher is assigned to a course only once. |

---

### 6. `Assessment`

Defines assessments (e.g., exams, quizzes, homework) for courses.

| Column      | Data Type      | Constraints                                  | Description                                      |
|-------------|----------------|----------------------------------------------|--------------------------------------------------|
| `id`        | INT / BIGINT   | PRIMARY KEY, AUTO_INCREMENT                  | Unique identifier for the assessment.            |
| `course_id` | INT / BIGINT   | NOT NULL, FOREIGN KEY (`Course`.`id`)          | Links to the `Course` this assessment belongs to. |
| `author_id` | INT / BIGINT   | NOT NULL, FOREIGN KEY (`Teacher`.`id`)         | Links to the `Teacher` who created the assessment. |
| `name`      | VARCHAR(255)   | NOT NULL                                     | Name of the assessment (e.g., "Midterm Exam").   |
| `weight`    | DECIMAL(5,2)   | NOT NULL, CHECK (`weight` >= 0 AND `weight` <= 100) | Weight of the assessment in the course grade (e.g., 20.00 for 20%). |

---

### 7. `StudentAssessment`

Junction table to record scores for students on specific assessments.

| Column          | Data Type    | Constraints                                                                  | Description                                      |
|-----------------|--------------|------------------------------------------------------------------------------|--------------------------------------------------|
| `id`            | INT / BIGINT | PRIMARY KEY, AUTO_INCREMENT                                                  | Unique identifier for the score record.          |
| `student_id`    | INT / BIGINT | NOT NULL, FOREIGN KEY (`Student`.`id`)                                         | Links to the `Student` record.                   |
| `assessment_id` | INT / BIGINT | NOT NULL, FOREIGN KEY (`Assessment`.`id`)                                      | Links to the `Assessment` record.                |
| `score`         | DECIMAL(5,2) | NOT NULL, CHECK (`score` >= 0)                                                 | Score obtained by the student for the assessment. |
|                 |              | UNIQUE (`student_id`, `assessment_id`)                                       | Ensures a student has only one score per assessment. |

---

## Notes

*   **Data Types**: `INT / BIGINT` can be chosen based on the expected number of records. `VARCHAR` lengths are suggestions and should be adjusted based on requirements. `DECIMAL(p,s)` where `p` is precision and `s` is scale.
*   **AUTO_INCREMENT**: Or `SERIAL` / `IDENTITY` depending on the specific SQL dialect (e.g., MySQL, PostgreSQL, SQL Server).
*   **Foreign Keys**: Assumed to have `ON DELETE RESTRICT` or `ON DELETE NO ACTION` by default. Consider `ON DELETE CASCADE` or `ON DELETE SET NULL` where appropriate based on business logic (e.g., if a User is deleted, should their Student/Teacher record be deleted?). For simplicity, default behavior is often sufficient initially.
*   **Indexing**: Primary keys are inherently indexed. `UNIQUE` constraints typically create indexes. Additional indexes might be needed on foreign keys or frequently queried columns for performance but are not detailed here to maintain simplicity.