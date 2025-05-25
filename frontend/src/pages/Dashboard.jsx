import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { role } = useAuth();
    const navigate = useNavigate();

    const redirectToDashboard = () => {
        switch (role) {
            case 'ADMIN':
                navigate('/dashboard/admin');
                break;
            case 'TEACHER':
                navigate('/dashboard/teacher');
                break;
            case 'STUDENT':
                navigate('/dashboard/student');
                break;
            default:
                navigate('/');
        }
    };
    useEffect(() => {
        redirectToDashboard();
    }, [role, navigate]);
};

export default Dashboard;
