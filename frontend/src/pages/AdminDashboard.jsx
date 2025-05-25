import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { courseService } from '../api/course.service';
import { Card, CardHeader, CardBody } from '@heroui/react';
import { Spinner } from '@heroui/react';
import {
    Users, UserX, UserCog, BookOpen, GraduationCap, School, BarChart3, Activity, AlertTriangle
} from 'lucide-react';
import { Link } from 'react-router-dom';

// A reusable Stat Card component
const StatCard = ({ title, value, icon, color = "blue", linkTo, description }) => {
    const IconComponent = icon || BarChart3;
    const colors = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-300" },
        green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-300" },
        yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-300" },
        red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-300" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-300" },
        indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-300" },
    };
    const selectedColor = colors[color] || colors.blue;

    return (
        <Card className={`shadow-lg hover:shadow-xl transition-shadow duration-300 border ${selectedColor.border}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className={`text-sm font-medium ${selectedColor.text}`}>{title}</div>
                <IconComponent className={`h-5 w-5 ${selectedColor.text} opacity-80`} />
            </CardHeader>
            <CardBody>
                <div className={`text-3xl font-bold ${selectedColor.text}`}>{value}</div>
                {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                {linkTo && (
                    <Link to={linkTo} className="text-xs text-blue-500 hover:text-blue-700 mt-2 inline-block">
                        View Details →
                    </Link>
                )}
            </CardBody>
        </Card>
    );
};


const AdminDashboard = () => {
    // Fetch all users (including archived, and their profiles)
    const { data: usersQuery, isLoading: isLoadingUsers, isError: isUsersError } = useQuery({
        queryKey: ['allUsersForDashboard'],
        queryFn: () => userService.getAllUsers(true), // true to include archived for total counts
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        select: (response) => response?.data || [],
    });

    // Fetch all courses (which include teacher assignments)
    const { data: coursesQuery, isLoading: isLoadingCourses, isError: isCoursesError } = useQuery({
        queryKey: ['allCoursesForDashboard'],
        queryFn: () => courseService.getAllCourses(),
        staleTime: 1000 * 60 * 5,
        select: (response) => response?.data || [],
    });

    const users = useMemo(() => usersQuery || [], [usersQuery]);
    const courses = useMemo(() => coursesQuery || [], [coursesQuery]);

    // Calculate Statistics using useMemo
    const stats = useMemo(() => {
        if (!users.length && !courses.length) {
            return {
                totalUsers: 0, activeUsers: 0, archivedUsers: 0,
                adminCount: 0, teacherCount: 0, studentCount: 0,
                studentsWithoutProfile: 0, teachersWithoutProfile: 0,
                studentsUnderProbation: 0,
                totalCourses: 0, coursesWithoutTeachers: 0, averageTeachersPerCourse: 0,
            };
        }

        const activeUsersList = users.filter(u => u.isActive && !u.isArchived);

        const adminCount = activeUsersList.filter(u => u.role === 'ADMIN').length;
        // Count actual teachers and students by checking for their profiles
        const teacherCount = activeUsersList.filter(u => u.role === 'TEACHER' && u.teacherProfile).length;
        const studentCount = activeUsersList.filter(u => u.role === 'STUDENT' && u.studentProfile).length;

        const studentsWithoutProfile = activeUsersList.filter(u => u.role === 'STUDENT' && !u.studentProfile).length;
        const teachersWithoutProfile = activeUsersList.filter(u => u.role === 'TEACHER' && !u.teacherProfile).length;

        const studentsUnderProbation = activeUsersList.filter(u => u.role === 'STUDENT' && u.studentProfile?.underProbation).length;

        const totalCourses = courses.length;
        const coursesWithoutTeachers = courses.filter(c => !c.teachers || c.teachers.length === 0).length;
        const totalTeacherAssignments = courses.reduce((acc, course) => acc + (course.teachers?.length || 0), 0);
        const averageTeachersPerCourse = totalCourses > 0 ? (totalTeacherAssignments / totalCourses).toFixed(1) : 0;


        return {
            totalUsers: users.length, // Includes archived
            activeUsers: activeUsersList.length,
            archivedUsers: users.filter(u => u.isArchived).length,
            adminCount,
            teacherCount,
            studentCount,
            studentsWithoutProfile,
            teachersWithoutProfile,
            studentsUnderProbation,
            totalCourses,
            coursesWithoutTeachers,
            averageTeachersPerCourse,
        };
    }, [users, courses]);

    if (isLoadingUsers || isLoadingCourses) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner label="Loading Dashboard Data..." size="lg" />
            </div>
        );
    }

    if (isUsersError || isCoursesError) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Error Loading Dashboard Data</p>
                <p className="text-center">Could not fetch necessary information. Please try again later or contact support.</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <BarChart3 className="mr-3 text-blue-600" /> Admin Dashboard
                </h1>
                <p className="text-gray-500">Overview of the High School Management System.</p>
            </header>

            {/* Key Metric Cards Section */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Key Metrics</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    <StatCard title="Total Active Users" value={stats.activeUsers} icon={Users} color="blue" linkTo="/dashboard/users" />
                    <StatCard title="Active Students" value={stats.studentCount} icon={GraduationCap} color="green" linkTo="/dashboard/users" />
                    <StatCard title="Active Teachers" value={stats.teacherCount} icon={School} color="purple" linkTo="/dashboard/users" />
                    <StatCard title="Total Courses" value={stats.totalCourses} icon={BookOpen} color="indigo" linkTo="/dashboard/courses" />
                </div>
            </section>

            {/* User Breakdown Section */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">User Overview</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Admin Accounts" value={stats.adminCount} icon={UserCog} color="red" />
                    <StatCard title="Total Users (inc. archived)" value={stats.totalUsers} icon={Users} description={`${stats.archivedUsers} archived`} />
                    <StatCard title="Users Needing Profile" value={stats.studentsWithoutProfile + stats.teachersWithoutProfile} icon={UserX} color="yellow" description={`${stats.studentsWithoutProfile} Students, ${stats.teachersWithoutProfile} Teachers`} linkTo="/dashboard/user/profiles" />
                </div>
            </section>

            {/* Student Specifics Section */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Student Insights</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Students Under Probation" value={stats.studentsUnderProbation} icon={AlertTriangle} color="red" description="Needs attention" />
                    {/* Add more student stats here if data is available, e.g., by grade level */}
                </div>
            </section>

            {/* Course Specifics Section */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Course Insights</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Courses w/o Teachers" value={stats.coursesWithoutTeachers} icon={BookOpen} color="yellow" description="Needs teacher assignment" linkTo="/dashboard/courses" />
                    <StatCard title="Avg. Teachers per Course" value={stats.averageTeachersPerCourse} icon={Activity} />
                    {/* Add more course stats here */}
                </div>
            </section>

            {/* Potentially add recent activity or quick links section here */}

        </div>
    );
};

export default AdminDashboard;