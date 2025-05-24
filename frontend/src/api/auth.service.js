import { makeApiRequest } from './apiClient';

export const authService = {
    login: (username, password) => {
        return makeApiRequest('/auth/login', {
            method: 'POST',
            body: { username, password },
        });
    },

    me: () => {
        return makeApiRequest('/auth/me', {
            method: 'GET',
        });
    },
};
