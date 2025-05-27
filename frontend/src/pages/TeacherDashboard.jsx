// src/pages/teacher/TeacherDashboard.jsx (Example path)
import React, { useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query'; // useQueries for parallel fetching
import { teacherCoursesService } from '../api/teacherCourses.service'; // Adjust path
import { assessmentService } from '../api/assessment.service'; // Adjust path
import { useAuth } from '../contexts/AuthContext'; // To get current user info
import { toast } from 'sonner';
import { Card, CardHeader, CardBody, Spinner, Button } from '@heroui/react';
import {
    LayoutDashboard, BookOpen, ClipboardList, Users, AlertTriangle} from 'lucide-react';
import { Link } from 'react-router-dom';

// Reusable Stat Card component (can be moved to shared components)
const StatCard = ({ title, value, icon, color = "blue", linkTo, description, isLoading }) => {
    const IconComponent = icon || LayoutDashboard;
    const colors = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-300" },
        green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-300" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-300" },
        yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-300" },
    };
    const selectedColor = colors[color] || colors.blue;

    return (
        <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 border ${selectedColor.border}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h1 className={`text-sm font-medium ${selectedColor.text}`}>{title}</h1>
                {isLoading ? <Spinner size="sm" color="current" /> : <IconComponent className={`h-5 w-5 ${selectedColor.text} opacity-80`} />}
            </CardHeader>
            <CardBody>
                {isLoading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2"></div>
                ) : (
                    <div className={`text-3xl font-bold ${selectedColor.text}`}>{value}</div>
                )}
                {description && !isLoading && <p className="text-xs text-gray-500 mt-1">{description}</p>}
                {linkTo && !isLoading && (
                    <Link to={linkTo} className="text-xs text-blue-500 hover:text-blue-700 mt-2 inline-block">
                        View Details →
                    </Link>
                )}
            </CardBody>
        </Card>
    );
};

const TeacherDashboard = () => {
    const { user } = useAuth(); // Assuming user object has teacher's user ID

    // 1. Fetch assigned courses for the teacher
    const {
        data: assignedCoursesQuery,
        isLoading: isLoadingCourses,
        isError: isCoursesError,
    } = useQuery({
        queryKey: ['teacherMyAssignedCourses'],
        queryFn: () => teacherCoursesService.getMyAssignedCourses(),
        enabled: !!user, // Only run if user is available
        select: (response) => response?.data || [],
        onError: () => toast.error("Failed to load assigned courses."),
    });
    const assignedCourses = useMemo(() => assignedCoursesQuery || [], [assignedCoursesQuery]);

    // 2. For each assigned course, fetch its assessments
    // This uses `useQueries` for parallel fetching if there are multiple courses.
    // This can lead to many requests if a teacher has many courses.
    // A backend endpoint that aggregates this data would be more efficient.
    const courseAssessmentQueries = useQueries({
        queries: assignedCourses.map(course => ({
            queryKey: ['assessmentsForCourse', course.id, 'dashboard'], // Add 'dashboard' to differentiate
            queryFn: () => assessmentService.getAssessmentsForCourse(course.id),
            enabled: !!course.id,
            select: (response) => ({ courseId: course.id, courseName: course.name, assessments: response?.data || [] }),
        })),
    });

    const isLoadingAssessments = courseAssessmentQueries.some(q => q.isLoading);
    const allAssessmentsByCourse = useMemo(() => {
        return courseAssessmentQueries
            .filter(q => q.isSuccess && q.data)
            .map(q => q.data);
    }, [courseAssessmentQueries]);

    // Calculate Statistics
    const stats = useMemo(() => {
        const totalAssignedCourses = assignedCourses.length;
        let totalAssessmentsCreated = 0;
        // let upcomingAssessments = []; // Requires dueDate on assessments
        // let assessmentsNeedingGrading = 0; // Requires tracking grading status

        allAssessmentsByCourse.forEach(courseData => {
            totalAssessmentsCreated += courseData.assessments.length;
            // Example for upcoming:
            // courseData.assessments.forEach(assessment => {
            //     if (assessment.dueDate && new Date(assessment.dueDate) > new Date() && new Date(assessment.dueDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
            //         upcomingAssessments.push({ ...assessment, courseName: courseData.courseName });
            //     }
            // });
        });

        // To get total unique students, we'd ideally have an endpoint.
        // For now, this is a placeholder.
        const placeholderTotalStudents = "N/A";

        return {
            totalAssignedCourses,
            totalAssessmentsCreated,
            // upcomingAssessments,
            // assessmentsNeedingGrading,
            placeholderTotalStudents,
        };
    }, [assignedCourses, allAssessmentsByCourse]);


    const overallLoading = isLoadingCourses; // isLoadingAssessments will make cards show individual spinners

    if (overallLoading && !assignedCourses.length) { // Show full page spinner only on initial hard load of courses
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner label="Loading Dashboard..." size="lg" />
            </div>
        );
    }
    if (isCoursesError && !isLoadingCourses) {
         return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Error Loading Dashboard</p>
                <p className="text-center">Could not fetch your dashboard data. Please try again later.</p>
            </div>
        );
    }


    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <LayoutDashboard className="mr-3 text-blue-600" /> Teacher Dashboard
                </h1>
                <p className="text-gray-500">Welcome back, {user?.fullName || 'Teacher'}! Here's an overview of your activities.</p>
            </header>

            {/* Key Metric Cards Section */}
            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Overview</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard title="Assigned Courses" value={stats.totalAssignedCourses} icon={BookOpen} color="blue" linkTo="/dashboard/my-courses" isLoading={isLoadingCourses} />
                    <StatCard title="Total Assessments Created" value={stats.totalAssessmentsCreated} icon={ClipboardList} color="green" description="Across all your courses" isLoading={isLoadingCourses || isLoadingAssessments} />
                    <StatCard title="Total Students Taught" value={stats.placeholderTotalStudents} icon={Users} color="purple" description="(Placeholder)" isLoading={false} />
                </div>
            </section>

            {/* My Courses Quick List */}
            <section>
                <Card className="shadow-md border">
                    <CardHeader>
                        <h1 className="text-xl font-semibold text-gray-700 flex items-center">
                            <BookOpen className="mr-2 text-blue-500" /> My Courses
                        </h1>
                    </CardHeader>
                    <CardBody>
                        {isLoadingCourses ? (
                            <div className="py-4"><Spinner label="Loading courses..." /></div>
                        ) : assignedCourses.length > 0 ? (
                            <ul className="space-y-3">
                                {assignedCourses.slice(0, 5).map(course => ( // Show first 5, for example
                                    <li key={course.id} className="flex justify-between items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-md">
                                        <div>
                                            <Link to={`/dashboard/assessments/courses/${course.id}`} className="font-medium text-blue-600 hover:underline">
                                                {course.name}
                                            </Link>
                                            <p className="text-xs text-gray-500">Code: {course.code}</p>
                                        </div>
                                        <Link to={`/dashboard/assessments/courses/${course.id}`}>
                                            <Button size="sm" variant="light" color="primary">Manage</Button>
                                        </Link>
                                    </li>
                                ))}
                                {assignedCourses.length > 5 && (
                                    <li className="pt-2 text-center">
                                        <Link to="/dashboard/my-courses" className="text-sm text-blue-600 hover:underline">
                                            View All My Courses ({assignedCourses.length}) →
                                        </Link>
                                    </li>
                                )}
                            </ul>
                        ) : (
                            <p className="text-gray-500 italic">You are not currently assigned to any courses.</p>
                        )}
                    </CardBody>
                </Card>
            </section>


        </div>
    );
};

export default TeacherDashboard;