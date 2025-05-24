import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';

export const ProtectedRoute = ({ children, allowedRoles }) => {
    const { isAuthenticated, role, isLoading } = useAuth();
    const location = useLocation();

    useEffect(() => {
        // Check for access denied messages from state
        if (location.state?.accessDenied) {
            toast.error("You don't have access to the requested page");
            // Clear the state so the message doesn't show again on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAuthenticated || !role) {
        // Redirect to login page but save the location they were trying to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(role)) {
            toast.error(`This page is restricted to specific roles`);
            return <Navigate to="/dashboard" state={{ accessDenied: true }} replace />;
        }
    }

    return <>{children}</>;
};
