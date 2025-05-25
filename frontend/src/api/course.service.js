// src/api/courseService.js
import { makeApiRequest } from './apiClient'; // Your central API request function

export const courseService = {
    // --- Core Course CRUD ---
    createCourse: (courseData) => {
        return makeApiRequest('/courses', {
            method: 'POST',
            body: courseData,
        });
    },
    getAllCourses: () => {
        // This endpoint in your controller already includes teacher details
        return makeApiRequest('/courses');
    },
    getCourseById: (courseId) => {
        return makeApiRequest(`/courses/${courseId}`);
    },
    updateCourse: (courseId, courseData) => {
        return makeApiRequest(`/courses/${courseId}`, {
            method: 'PUT',
            body: courseData,
        });
    },
    deleteCourse: (courseId) => {
        return makeApiRequest(`/courses/${courseId}`, {
            method: 'DELETE',
        });
    },

    // --- Course-Teacher Assignments ---
    assignTeacherToCourse: (courseId, teacherId) => {
        return makeApiRequest(`/courses/${courseId}/teachers`, {
            method: 'POST',
            body: { teacherId }, // Backend expects { teacherId } in body
        });
    },
    removeTeacherFromCourse: (courseId, teacherId) => {
        return makeApiRequest(`/courses/${courseId}/teachers/${teacherId}`, {
            method: 'DELETE',
        });
    },

    // We'll also need to fetch all teachers to populate the assignment dropdown/select.
    // Assuming this comes from userService or a dedicated teacherService.
    // For this example, let's assume it exists in userService.
    // getAllTeachers: () => {
    //     return makeApiRequest('/users?role=TEACHER&includeProfile=true'); // Example
    // }
};