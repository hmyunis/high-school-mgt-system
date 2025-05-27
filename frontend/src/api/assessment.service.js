// src/api/assessmentService.js
import { makeApiRequest } from './apiClient'; // Your central API request function

export const assessmentService = {
    // --- Assessment CRUD for a specific course ---

    /**
     * Get all assessments for a specific course.
     * @param {string|number} courseId - The ID of the course.
     */
    getAssessmentsForCourse: (courseId) => {
        return makeApiRequest(`/course/${courseId}/assessments`);
    },

    /**
     * Create a new assessment for a specific course.
     * @param {string|number} courseId - The ID of the course.
     * @param {object} assessmentData - Data for the new assessment (name, weight, etc.).
     */
    createAssessment: (courseId, assessmentData) => {
        return makeApiRequest(`/course/${courseId}/assessments`, {
            method: 'POST',
            body: assessmentData,
        });
    },

    /**
     * Get a single assessment by its ID.
     * Note: The backend controller already checks if the teacher can access this.
     * @param {string|number} assessmentId - The ID of the assessment.
     */
    getAssessmentById: (assessmentId) => {
        return makeApiRequest(`/assessments/${assessmentId}`);
    },

    /**
     * Update an existing assessment.
     * @param {string|number} assessmentId - The ID of the assessment to update.
     * @param {object} assessmentData - Data to update.
     */
    updateAssessment: (assessmentId, assessmentData) => {
        return makeApiRequest(`/assessments/${assessmentId}`, {
            method: 'PUT',
            body: assessmentData,
        });
    },

    /**
     * Delete an assessment.
     * @param {string|number} assessmentId - The ID of the assessment to delete.
     */
    deleteAssessment: (assessmentId) => {
        return makeApiRequest(`/assessments/${assessmentId}`, {
            method: 'DELETE',
        });
    },
};