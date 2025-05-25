import { makeApiRequest } from './apiClient';

export const userService = {
    getAllUsers: (includeArchived, role = null) => {
        const params = new URLSearchParams();

        if (includeArchived) {
            params.append('includeArchived', 'true');
        }
        if (role) {
            params.append('role', role);
        }

        const queryString = params.toString();
        return makeApiRequest(`/users${queryString ? `?${queryString}` : ''}`);
    },

    getUserById: (userId) => {
        return makeApiRequest(`/users/${userId}`);
    },

    getMyProfile: () => {
        return makeApiRequest(`/users/profile`);
    },

    createUser: (userData) => {
        return makeApiRequest('/users', {
            method: 'POST',
            body: userData,
        });
    },

    updateUser: (userId, userData) => {
        return makeApiRequest(`/users/${userId}`, {
            method: 'PUT',
            body: userData,
        });
    },

    archiveUser: (userId) => {
        return makeApiRequest(`/users/${userId}/archive`, { method: 'PATCH' });
    },
    restoreUser: (userId) => {
        return makeApiRequest(`/users/${userId}/restore`, { method: 'PATCH' });
    },
    permanentDeleteUser: (userId) => {
        return makeApiRequest(`/users/${userId}/permanent`, { method: 'DELETE' });
    },
};
