import React, { useState } from 'react';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { User, LockKeyhole } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { Navigate, useNavigate } from 'react-router-dom';

const Login = () => {
    const { login, isAuthenticated, role } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    if (isAuthenticated && role) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await login(username, password);
            if (result.success) {
                toast.success(`Welcome back, ${result.role.toLowerCase()}!`);
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Login failed. Please check your credentials and try again.');
            return;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50 px-4">
            <Card className="w-full max-w-md shadow-lg border border-blue-300 p-8">
                <CardHeader className="text-center flex flex-col">
                    <h2 className="text-2xl font-bold text-blue-700">High School Portal</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Please enter your credentials to access the portal.
                    </p>
                </CardHeader>
                <CardBody>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Username
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-blue-700 flex items-center gap-2">
                                <LockKeyhole className="w-4 h-4" />
                                Password
                            </label>
                            <Input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </CardBody>
                <CardFooter className="flex justify-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} High School Management System
                </CardFooter>
            </Card>
        </div>
    );
};

export default Login;
