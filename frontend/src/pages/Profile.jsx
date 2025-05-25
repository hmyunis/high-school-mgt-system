import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';

import {
    User,
    Mail,
    Phone,
    CalendarDays,
    KeyRound,
    ShieldCheck,
    Save,
    Loader2,
    Info,
} from 'lucide-react';

const SimpleSpinner = () => (
    <div className="flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
);

const Profile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        password: '',
        currentPassword: '',
    });

    const {
        data: profileData,
        isLoading: isLoadingProfile,
        isError: isProfileError,
    } = useQuery({
        queryKey: ['profile', user?.id],
        queryFn: () => userService.getMyProfile(),
        enabled: !!user?.id,
        staleTime: 1000 * 60 * 5,
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to load profile data.');
        },
    });

    useEffect(() => {
        if (profileData?.data) {
            const { fullName, username, email, phone, dateOfBirth, gender } = profileData.data;
            setFormData((prev) => ({
                ...prev,
                fullName: fullName || '',
                username: username || '',
                email: email || '',
                phone: phone || '',
                dateOfBirth: dateOfBirth ? dateOfBirth.slice(0, 10) : '',
                gender: gender || '',
                password: '',
                currentPassword: '',
            }));
        }
    }, [profileData]);

    const updateUserMutation = useMutation({
        mutationFn: (updatedData) => userService.updateUser(user?.id, updatedData),
        onSuccess: (data) => {
            queryClient.invalidateQueries(['profile', user?.id]);
            toast.success(data?.message || 'Profile updated successfully!');
            setFormData((prev) => ({ ...prev, password: '', currentPassword: '' }));
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message || 'Profile update failed. Please try again.'
            );
        },
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = { ...formData };

        if (!dataToSubmit.password) {
            delete dataToSubmit.password;
        }
        if (!dataToSubmit.currentPassword && dataToSubmit.password) {
            toast.error('Current password is required to set a new password.');
            return;
        }
        updateUserMutation.mutate(dataToSubmit);
    };

    if (isLoadingProfile) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <SimpleSpinner />
            </div>
        );
    }
    if (isProfileError || !profileData?.data) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <ShieldCheck size={48} className="mb-4" />
                <p className="text-xl text-center">Could not load your profile information.</p>
                <p className="text-center">Please refresh the page or try again later.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card className="w-full max-w-4xl mx-auto shadow-lg border border-blue-300">
                <CardHeader className="flex flex-col items-start pl-8 pt-8">
                    <div className="flex items-center">
                        <User className="w-7 h-7 text-blue-600 mr-3" />
                        <h2 className="text-2xl font-bold text-blue-700">Manage Profile</h2>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        Update your personal information and password.
                    </p>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardBody className="py-6 px-6 sm:px-8 space-y-6">
                        <h3 className="text-lg font-semibold text-blue-600 border-b border-blue-200 pb-2 mb-4">
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            {/* Full Name */}
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                >
                                    <User className="w-4 h-4" /> Full Name
                                </label>
                                <Input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    placeholder="Your full name"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={updateUserMutation.isLoading}
                                    className="mt-1"
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label
                                    htmlFor="username"
                                    className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                >
                                    <User className="w-4 h-4" /> Username
                                </label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Your username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={updateUserMutation.isLoading}
                                    className="mt-1"
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                >
                                    <Mail className="w-4 h-4" /> Email Address
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={updateUserMutation.isLoading}
                                    className="mt-1"
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                >
                                    <Phone className="w-4 h-4" /> Phone Number
                                </label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+251 912 345 678"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    disabled={updateUserMutation.isLoading}
                                    className="mt-1"
                                />
                            </div>

                            {/* Date of Birth */}
                            <div>
                                <label
                                    htmlFor="dateOfBirth"
                                    className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                >
                                    <CalendarDays className="w-4 h-4" /> Date of Birth
                                </label>
                                <Input
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={handleChange}
                                    disabled={updateUserMutation.isLoading}
                                    className="mt-1"
                                />
                            </div>

                            {/* Gender */}
                            <div>
                                <label
                                    htmlFor="gender"
                                    className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                >
                                    <User className="w-4 h-4" /> Gender
                                </label>
                                <Input
                                    name="gender"
                                    value={formData.gender}
                                    disabled
                                    className="w-full mt-1"
                                />
                            </div>
                        </div>

                        {/* Role - Display Only */}
                        <div className="mt-6">
                            <label className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1">
                                <ShieldCheck className="w-4 h-4" /> Your Role
                            </label>
                            <Input
                                type="text"
                                value={profileData?.data?.role || 'N/A'}
                                readOnly
                                className="mt-1 bg-gray-100 cursor-not-allowed border-gray-300"
                            />
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                                <Info size={12} className="mr-1 text-blue-500" /> Your role is
                                assigned by an administrator and cannot be changed here.
                            </p>
                        </div>

                        {/* Password Section */}
                        <div className="mt-8 pt-6 border-t border-blue-200">
                            <h3 className="text-lg font-semibold text-blue-600 pb-2 mb-4">
                                Change Password
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div>
                                    <label
                                        htmlFor="currentPassword"
                                        className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                    >
                                        <KeyRound className="w-4 h-4" /> Current Password
                                    </label>
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        placeholder="Required for password change"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        disabled={updateUserMutation.isLoading}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Only required if you want to change your password.
                                    </p>
                                </div>
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-blue-700 flex items-center gap-2 mb-1"
                                    >
                                        <KeyRound className="w-4 h-4" /> New Password
                                    </label>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="Leave blank to keep current"
                                        value={formData.password}
                                        onChange={handleChange}
                                        disabled={updateUserMutation.isLoading}
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter className="border-t border-blue-200 pt-6 px-6 sm:px-8 flex justify-end">
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                            disabled={updateUserMutation.isLoading}
                        >
                            {updateUserMutation.isLoading ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Profile;
