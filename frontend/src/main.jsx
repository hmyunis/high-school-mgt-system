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
                        <div className="text-7xl font-light p-8">Dashboard</div>
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
                path: 'profile',
                element: (
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                ),
            },
            {
                path: 'setting',
                element: (
                    <ProtectedRoute allowedRoles={['TEACHER']}>
                        <div className="text-7xl font-light p-8">Setting</div>,
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
