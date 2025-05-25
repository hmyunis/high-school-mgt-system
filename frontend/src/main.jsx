import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Toaster as Sonner } from 'sonner';

import './index.css';
import App from './App.jsx';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext.jsx';
import { HeroUIProvider } from '@heroui/react';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import Profile from './pages/Profile.jsx';
import UserManagementPage from './pages/UserManagement.jsx';
import ProfileManagementPage from './pages/ProfileManagement.jsx';
import CourseManagementPage from './pages/CourseManagement.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Dashboard from './pages/Dashboard.jsx';

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/login" replace />,
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: 'dashboard',
        element: <App />,
        children: [
            {
                index: true,
                element: (
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                ),
            },

            // Admin pages
            {
                path: 'admin',
                element: (
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <AdminDashboard />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'users',
                element: (
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <UserManagementPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'courses',
                element: (
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <CourseManagementPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'user/profiles',
                element: (
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                        <ProfileManagementPage />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'profile',
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                ),
            },

            // Teacher pages
            {
                path: 'teacher',
                element: (
                    <ProtectedRoute allowedRoles={['TEACHER']}>
                        <div>Teacher's Dashboard</div>
                    </ProtectedRoute>
                ),
            },
            
            // Student pages
            {
                path: 'student',
                element: (
                    <ProtectedRoute allowedRoles={['STUDENT']}>
                        <div>Student's Dashboard</div>
                    </ProtectedRoute>
                ),
            },

        ],
    },
    {
        path: '*',
        element: <div className="text-7xl font-light p-8">Not Found</div>,
    },
]);

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <HeroUIProvider>
            <Sonner position="top-right" closeButton richColors />
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <RouterProvider router={router}></RouterProvider>
                </AuthProvider>
            </QueryClientProvider>
        </HeroUIProvider>
    </StrictMode>
);
