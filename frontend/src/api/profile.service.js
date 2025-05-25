import { makeApiRequest } from './apiClient';

export const profileService = {
    // --- Student Profile Endpoints ---
    createStudentProfile: (userId, studentData) => {
        return makeApiRequest(`/users/${userId}/student-profile`, {
            method: 'POST',
            body: studentData,
        });
    },
    getStudentProfile: (userId) => {
        return makeApiRequest(`/users/${userId}/student-profile`);
    },
    updateStudentProfile: (userId, studentData) => {
        return makeApiRequest(`/users/${userId}/student-profile`, {
            method: 'PUT',
            body: studentData,
        });
    },
    deleteStudentProfile: (userId) => {
        return makeApiRequest(`/users/${userId}/student-profile`, {
            method: 'DELETE',
        });
    },

    // --- Teacher Profile Endpoints ---
    createTeacherProfile: (userId, teacherData) => {
        return makeApiRequest(`/users/${userId}/teacher-profile`, {
            method: 'POST',
            body: teacherData,
        });
    },
    getTeacherProfile: (userId) => {
        return makeApiRequest(`/users/${userId}/teacher-profile`);
    },
    updateTeacherProfile: (userId, teacherData) => {
        return makeApiRequest(`/users/${userId}/teacher-profile`, {
            method: 'PUT',
            body: teacherData,
        });
    },
    deleteTeacherProfile: (userId) => {
        return makeApiRequest(`/users/${userId}/teacher-profile`, {
            method: 'DELETE',
        });
    },

};