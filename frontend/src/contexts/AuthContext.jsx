import React, { createContext, useContext, useState, useEffect } from 'react';
import { isTokenExpired, decodeJwt } from '../lib/jwtUtils';
import { toast } from 'sonner';
import { authService } from '../api/auth.service';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState({
        token: null,
        user: null,
        role: null,
        isAuthenticated: false,
        isLoading: true,
    });

    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem('token');

            if (storedToken && !isTokenExpired(storedToken)) {
                // get user data using /me api
                const response = await authService.me();
                const user = response.data;

                /*
                Example user object from backend:
                {
                    "id": 1,
                    "username": "admin",
                    "fullName": "Site Administrator",
                    "email": "admin@example.com",
                    "role": "ADMIN",
                    "lastLogin": "2025-05-23T20:28:02.551Z"
                }
                */

                setAuthState((prevState) => ({
                    ...prevState,
                    token: storedToken,
                    isAuthenticated: true,
                    user: user,
                    role: user.role,
                    isLoading: false,
                }));
            } else {
                localStorage.removeItem('token');
                setAuthState((prevState) => ({
                    ...prevState,
                    isLoading: false,
                }));
            }
        };

        initializeAuth();
    }, []);

    const login = async (username, password) => {
        try {
            // Get JWT token from API
            const res = await authService.login(username, password);
            const response = res?.data;

            if (!response || !response.token) {
                throw new Error('Authentication failed');
            }

            const token = response.token;

            // Store token in localStorage
            localStorage.setItem('token', token);

            // Extract user info from token
            const payload = decodeJwt(token);
            if (!payload) {
                throw new Error('Invalid token format');
            }

            const role = payload.role;

            // Store user info
            const user = {
                id: response.user.id,
                username: response.user.username,
                fullName: response.user.fullName,
                email: response.user.email,
                role: response.user.role,
                lastLogin: response.user.lastLogin,
            };

            setAuthState((prevState) => ({
                ...prevState,
                token: token,
                user: user,
                role: role,
                isAuthenticated: true,
                isLoading: false,
            }));

            return { success: true, role: role };
        } catch (error) {
            toast.error('Login failed: ' + error.message);
            return { success: false, role: null };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAuthState({
            token: null,
            user: null,
            role: null,
            isAuthenticated: false,
            isLoading: false,
        });
        window.location.href = '/login';
        toast.success('Logged out successfully');
    };

    return (
        <AuthContext.Provider
            value={{
                ...authState,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
