import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { DatePicker } from '@heroui/react';
import { parseDate } from "@internationalized/date";

import {
    User, Mail, Phone, CalendarDays, KeyRound, ShieldCheck, Save, Loader2, Info, Settings
} from 'lucide-react';

const SimpleSpinner = () => (
    <div className="flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
);

const Profile = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // Store dateOfBirth as "YYYY-MM-DD" string or null in formData
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        dateOfBirth: null, // "YYYY-MM-DD" string or null
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
                dateOfBirth: dateOfBirth || null, // API provides "YYYY-MM-DD" string
                gender: gender || '',
                password: '',
                currentPassword: '',
            }));
        }
    }, [profileData]);

    const updateUserMutation = useMutation({
        mutationFn: (updatedData) => userService.updateUser(user?.id, updatedData),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
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

    // DatePicker's onChange provides a CalendarDate object
    const handleDateChange = (calendarDate) => {
        // Convert CalendarDate object to "YYYY-MM-DD" string for formData
        setFormData((prev) => ({
            ...prev,
            dateOfBirth: calendarDate ? calendarDate.toString() : null,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // formData.dateOfBirth is already in "YYYY-MM-DD" string format or null
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

    // For DatePicker value prop, convert the string from formData to CalendarDate object
    const datePickerValue = formData.dateOfBirth ? parseDate(formData.dateOfBirth) : null;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Settings className="mr-3 text-blue-600" />
                    My Profile
                </h1>
                <p className="text-gray-500">View and update your personal details.</p>
            </header>

            <Card className="shadow-xl border border-gray-200 rounded-xl">
                <CardHeader className="flex flex-col items-start p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-700">Profile Information</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Keep your personal information up to date.
                    </p>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardBody className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div>
                                <label
                                    htmlFor="fullName"
                                    className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                >
                                    <User className="w-4 h-4 mr-2 text-gray-500" /> Full Name
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

                            <div>
                                <label
                                    htmlFor="username"
                                    className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                >
                                    <User className="w-4 h-4 mr-2 text-gray-500" /> Username
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

                            <div>
                                <label
                                    htmlFor="email"
                                    className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                >
                                    <Mail className="w-4 h-4 mr-2 text-gray-500" /> Email Address
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

                            <div>
                                <label
                                    htmlFor="phone"
                                    className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                >
                                    <Phone className="w-4 h-4 mr-2 text-gray-500" /> Phone Number
                                </label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    placeholder="+1 234 567 890"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    disabled={updateUserMutation.isLoading}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <label
                                    className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                >
                                    <CalendarDays className="w-4 h-4 mr-2 text-gray-500" /> Date of Birth
                                </label>
                                <DatePicker
                                    aria-label="Date of Birth"
                                    value={datePickerValue}
                                    onChange={handleDateChange}
                                    className="w-full mt-1"
                                    granularity="day"
                                    isDisabled={updateUserMutation.isLoading}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="gender"
                                    className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                >
                                    <User className="w-4 h-4 mr-2 text-gray-500" /> Gender
                                </label>
                                <Input
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    readOnly
                                    className="w-full mt-1 bg-gray-100 border-gray-300 cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                             <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                Account Information
                            </h3>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                                    <ShieldCheck className="w-4 h-4 mr-2 text-gray-500" /> Your Role
                                </label>
                                <Input
                                    type="text"
                                    value={profileData?.data?.role || 'N/A'}
                                    readOnly
                                    className="mt-1 bg-gray-100 cursor-not-allowed border-gray-300"
                                />
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                    <Info size={12} className="mr-1 text-blue-500" /> Role is assigned by administration.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4">
                                Security Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                <div>
                                    <label
                                        htmlFor="currentPassword"
                                        className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                    >
                                        <KeyRound className="w-4 h-4 mr-2 text-gray-500" /> Current Password
                                    </label>
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type="password"
                                        placeholder="Required to change password"
                                        value={formData.currentPassword}
                                        onChange={handleChange}
                                        disabled={updateUserMutation.isLoading}
                                        className="mt-1"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Enter if you are changing your password.
                                    </p>
                                </div>
                                <div>
                                    <label
                                        htmlFor="password"
                                        className="text-sm font-medium text-gray-700 mb-1 flex items-center"
                                    >
                                        <KeyRound className="w-4 h-4 mr-2 text-gray-500" /> New Password
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
                                     <p className="text-xs text-gray-500 mt-1">
                                        Minimum 8 characters recommended.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardBody>
                    <CardFooter className="p-6 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-xl">
                        <Button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] px-6 py-2.5"
                            disabled={updateUserMutation.isLoading}
                        >
                            {updateUserMutation.isLoading ? (
                                <span className="flex items-center justify-center">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Saving...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center">
                                    <Save className="mr-2 h-5 w-5" />
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