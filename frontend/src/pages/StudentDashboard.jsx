import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { studentAssessmentService } from '../api/student.assessment.service'; // Corrected import path
import { courseService } from '../api/course.service'; // Corrected import path
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import {
    Card, CardHeader, CardBody, CardFooter,
    Spinner, Button, Chip
} from '@heroui/react';
import {
    LayoutDashboard, UserCircle, BookOpen, ClipboardCheck, CalendarX2, ShieldAlert,
    AlertTriangle, ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate } from '../lib/dateUtils';

const StatCard = ({ title, value, icon, color = "blue", linkTo, description, isLoading, unit = "" }) => {
    const IconComponent = icon || LayoutDashboard;
    const colors = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", iconText: "text-blue-500" },
        green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-300", iconText: "text-green-500" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-300", iconText: "text-purple-500" },
        yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-300", iconText: "text-yellow-500" },
        red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-300", iconText: "text-red-500" },
    };
    const selectedColor = colors[color] || colors.blue;

    return (
        <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 border ${selectedColor.border} h-full flex flex-col`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <h1 className={`text-sm font-medium text-gray-500`}>{title}</h1>
                {isLoading ? <Spinner size="sm" color="current" /> : <IconComponent className={`h-5 w-5 ${selectedColor.iconText} opacity-90`} />}
            </CardHeader>
            <CardBody className="px-4 pb-4 flex-grow">
                {isLoading ? (
                    <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4 mt-1"></div>
                ) : (
                    <div className={`text-3xl font-bold ${selectedColor.text}`}>{value}{unit && <span className="text-xl">{unit}</span>}</div>
                )}
                {description && !isLoading && <p className="text-xs text-gray-500 mt-1">{description}</p>}
            </CardBody>
            {linkTo && !isLoading && (
                <CardFooter className="px-4 pt-0 pb-3 border-t mt-auto">
                    <Link to={linkTo} className={`text-xs ${selectedColor.text} hover:underline font-medium flex items-center`}>
                        View More <ExternalLink size={12} className="ml-1" />
                    </Link>
                </CardFooter>
            )}
        </Card>
    );
};

const StudentDashboard = () => {
    const { user: authUser } = useAuth();

    const {
        data: studentProfileData,
        isLoading: isLoadingProfile,
        isError: isProfileError,
    } = useQuery({
        queryKey: ['myStudentProfileData'],
        queryFn: () => userService.getMyProfile(),
        enabled: !!authUser?.id,
        select: (response) => response?.data,
        onError: () => toast.error("Failed to load your profile information."),
    });

    const {
        data: myScoresQuery,
        isLoading: isLoadingScores,
    } = useQuery({
        queryKey: ['myStudentAllScores'],
        queryFn: () => studentAssessmentService.getMyAllScores(),
        enabled: !!authUser?.id,
        select: (response) => response?.data || [],
        staleTime: 1000 * 60 * 2,
    });
    const myScores = useMemo(() => myScoresQuery || [], [myScoresQuery]);

    const {
        data: coursesQuery,
        isLoading: isLoadingTotalCourses,
    } = useQuery({
        queryKey: ['allCoursesCountForStudentDashboard'],
        queryFn: () => courseService.getAllCourses(),
        select: (response) => response?.data?.length || 0,
        staleTime: 1000 * 60 * 10,
    });
    const totalCoursesCount = coursesQuery || 0;

    const recentScores = useMemo(() => {
        return [...myScores]
            .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
            .slice(0, 5);
    }, [myScores]);

    const isLoading = isLoadingProfile || isLoadingScores || isLoadingTotalCourses;

    if (isLoading && !studentProfileData && !myScores.length) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner label="Loading Your Dashboard..." size="lg" />
            </div>
        );
    }

    if (isProfileError && !isLoadingProfile) {
         return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Error Loading Profile</p>
                <p className="text-center">Could not fetch your profile data. Please try refreshing.</p>
            </div>
        );
    }

    const studentProfile = studentProfileData?.studentProfile;

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <header className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                    <LayoutDashboard className="mr-2 md:mr-3 text-blue-600 h-6 w-6 md:h-7 md:w-7" />
                    Student Dashboard
                </h1>
                <p className="text-gray-500">Welcome back, {studentProfileData?.fullName || authUser?.username || 'Student'}!</p>
            </header>

            <section>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <StatCard
                        title="My Grade Level"
                        value={studentProfile?.gradeLevel || "N/A"}
                        icon={UserCircle}
                        color="blue"
                        linkTo="/dashboard/profile"
                        isLoading={isLoadingProfile}
                        description={studentProfile?.section ? `Section: ${studentProfile.section}` : ""}
                    />
                    <StatCard
                        title="Total Courses Available"
                        value={totalCoursesCount}
                        icon={BookOpen}
                        color="purple"
                        linkTo="/dashboard/mycourses"
                        isLoading={isLoadingTotalCourses}
                        description="You are enrolled in all"
                    />
                    <StatCard
                        title="Absence Count"
                        value={studentProfile?.absentCount !== undefined ? studentProfile.absentCount : "N/A"}
                        icon={CalendarX2}
                        color={studentProfile?.absentCount > 5 ? "yellow" : "green"}
                        linkTo="#"
                        isLoading={isLoadingProfile}
                    />
                </div>
            </section>

            {studentProfile?.underProbation && (
                <section>
                    <Card className="bg-red-50 border-red-300 shadow-md">
                        <CardBody className="p-4">
                            <div className="flex items-center">
                                <ShieldAlert size={24} className="text-red-600 mr-3 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-red-700">Probation Status Alert</h3>
                                    <p className="text-sm text-red-600">
                                        You are currently under academic probation. Please see your advisor or a teacher for guidance.
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </section>
            )}

            <section>
                <Card className="shadow-md border">
                    <CardHeader>
                        <h1 className="text-xl font-semibold text-gray-700 flex items-center">
                            <ClipboardCheck className="mr-2 text-green-500" /> Recent Scores
                        </h1>
                    </CardHeader>
                    <CardBody>
                        {isLoadingScores && <div className="py-4"><Spinner label="Loading recent scores..." /></div>}
                        {!isLoadingScores && recentScores.length === 0 && (
                            <p className="text-gray-500 italic py-4 text-center">No scores recorded yet.</p>
                        )}
                        {!isLoadingScores && recentScores.length > 0 && (
                             <div className="space-y-2">
                                {recentScores.map(scoreEntry => {
                                    // scoreEntry.assessment can be null if the assessment was deleted but score record remained (depending on FK constraints)
                                    const assessmentWeight = scoreEntry.assessment?.weight;
                                    // const assessmentMaxScore = scoreEntry.assessment?.maxScore; // If you add maxScore to Assessment model

                                    // Determine chip color based on score percentage of a generic passing grade (e.g., 50%)
                                    // If maxScore is available, use it. Otherwise, assume 100 as max for percentage.
                                    // let isPassing = parseFloat(scoreEntry.score) >= (assessmentMaxScore ? assessmentMaxScore * 0.5 : 50);
                                    // For simplicity, let's just use a fixed threshold or make it less dependent on maxScore for now.
                                    let isPassing = parseFloat(scoreEntry.score) >= 50; // Default to 50 as a passing mark if no other info

                                    return (
                                        <Link
                                            to={`/dashboard/mycourses/${scoreEntry.assessment?.course?.id}/assessments`}
                                            key={scoreEntry.id}
                                            className="block p-3 bg-white hover:bg-gray-50 rounded-md border transition-all"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {scoreEntry.assessment?.name || 'Unknown Assessment'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Course: {scoreEntry.assessment?.course?.name || 'N/A'}
                                                    </p>
                                                </div>
                                                <Chip
                                                    color={isPassing ? "success" : "warning"}
                                                    variant="flat"
                                                    size="lg"
                                                >
                                                    {parseFloat(scoreEntry.score).toFixed(1)}
                                                    {assessmentWeight && <span className="text-xs opacity-70 ml-1">({assessmentWeight}%)</span>}
                                                </Chip>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Updated: {formatDate(scoreEntry.updatedAt)}
                                            </p>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        {!isLoadingScores && myScores.length > 0 && (
                            <div className="mt-4 text-center">
                                <Link to="/dashboard/mycourses">
                                    <Button variant="light" color="primary" size="sm">
                                        View All My Courses →
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </section>
        </div>
    );
};

export default StudentDashboard;