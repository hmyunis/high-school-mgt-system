// src/api/studentAssessmentService.js (or merge into assessmentService.js)
import { makeApiRequest } from './apiClient';

export const studentAssessmentService = {
    /**
     * Get all students for a given course.
     * This might need adjustment based on how your backend provides this data.
     * It could be a dedicated endpoint or a modification to userService.getAllUsers.
     * For this example, assuming a dedicated endpoint.
     * @param {string|number} courseId
     */
    getStudentsForCourse: (courseId) => {
        // This endpoint needs to be implemented on the backend.
        // It should return users with role STUDENT associated with this course.
        // Example: GET /api/courses/:courseId/students
        // The response should include student.id (PK of Student table) and user details.
        return makeApiRequest(`/courses/${courseId}/students`);
    },

    /**
     * Get all scores for a specific assessment.
     * @param {string|number} assessmentId
     */
    getScoresForAssessment: (assessmentId) => {
        return makeApiRequest(`/assessments/${assessmentId}/scores`);
    },

    /**
     * Submit/update scores for an assessment.
     * Expects an array of score objects.
     * Each object: { student_id, score }
     * The backend should handle create or update logic (upsert).
     * @param {string|number} assessmentId
     * @param {Array<object>} scoresData
     */
    submitScoresForAssessment: (assessmentId, scoresData) => {
        return makeApiRequest(`/assessments/${assessmentId}/scores`, {
            method: 'POST', // Or PUT if your backend prefers that for batch upsert
            body: { scores: scoresData }, // Backend expects an object like { scores: [...] }
        });
    },

     /**
     * Fetches the logged-in student's score for a specific assessment.
     * Assumes the backend can identify the student from JWT and lookup their score.
     * @param {string|number} assessmentId
     */
     getMyScoreForAssessment: (assessmentId) => {
        // Example: GET /api/students/me/assessments/:assessmentId/score
        // It should return an object like { score: 85.50, studentAssessmentId: 123 } or null/404 if no score.
        return makeApiRequest(`/students/me/assessments/${assessmentId}/score`);
    },

    /**
     * Fetches all StudentAssessment records for the currently logged-in student.
     * The backend should include details of the Assessment and its associated Course.
     */
    getMyAllScores: () => {
        // Example: GET /api/students/me/scores
        // Response should be an array of StudentAssessment objects, each including:
        // { id, student_id, assessment_id, score, createdAt, updatedAt,
        //   assessment: { id, name, weight, course_id, course: { id, name, code } }
        // }
        return makeApiRequest('/students/me/scores');
    },
};