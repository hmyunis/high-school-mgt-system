import { makeApiRequest } from './apiClient';

export const teacherCoursesService = {
    getMyAssignedCourses: () => {
        return makeApiRequest('/teachers/me/courses');
    },
};
