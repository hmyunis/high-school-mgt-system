import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueries } from '@tanstack/react-query'; // useQueries for fetching individual scores
import { courseService } from '../api/course.service';
import { assessmentService } from '../api/assessment.service';
import { studentAssessmentService } from '../api/student.assessment.service'; // For fetching own scores
import { toast } from 'sonner';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Spinner, Chip} from '@heroui/react'; // Adjust HeroUI imports
import { ClipboardList, ArrowLeft, AlertTriangle, UserCircle, HelpCircle } from 'lucide-react';
import { formatDate } from '../lib/dateUtils'; // Adjust path

// Helper to display score or status
const DisplayScore = ({ scoreData, isLoadingScore }) => {
    if (isLoadingScore) {
        return <Spinner size="sm" color="current" />;
    }
    if (scoreData && scoreData.score !== null && scoreData.score !== undefined) {
        return (
            <Chip color="success" variant="flat" size="sm">
                {parseFloat(scoreData.score).toFixed(2)}
            </Chip>
        );
    }
    return <Chip color="default" variant="bordered" size="sm">Not Graded</Chip>;
};

const CourseAssessmentsListPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' });

    // 1. Fetch Course Details
    const {
        data: courseDetails,
        isLoading: isLoadingCourseDetails,
        isError: isCourseError,
    } = useQuery({
        queryKey: ['courseDetailsForStudentAssessments', courseId],
        queryFn: () => courseService.getCourseById(courseId),
        enabled: !!courseId,
        select: (response) => response?.data,
        onError: () => toast.error("Failed to load course details."),
    });

    // 2. Fetch All Assessments for this Course
    const {
        data: courseAssessmentsQuery,
        isLoading: isLoadingAssessments,
        isError: isAssessmentsError,
    } = useQuery({
        queryKey: ['assessmentsForCourseStudentView', courseId],
        queryFn: () => assessmentService.getAssessmentsForCourse(courseId),
        enabled: !!courseId,
        select: (response) => response?.data || [],
        onError: () => toast.error("Failed to load assessments for this course."),
    });
    const assessments = useMemo(() => courseAssessmentsQuery || [], [courseAssessmentsQuery]);

    // 3. For each assessment, fetch the student's own score
    // This uses `useQueries` for parallel fetching of individual scores.
    const studentScoreQueries = useQueries({
        queries: assessments.map(assessment => ({
            queryKey: ['myScoreForAssessment', assessment.id],
            queryFn: () => studentAssessmentService.getMyScoreForAssessment(assessment.id),
            enabled: !!assessment.id, // Only run if assessment.id is available
            staleTime: 1000 * 60, // Cache score for 1 minute
            select: (response) => response?.data, // Assuming response is { score: XX } or null
        })),
    });

    const isLoadingAnyScore = studentScoreQueries.some(q => q.isLoading);
    const assessmentsWithScores = useMemo(() => {
        return assessments.map((assessment, index) => {
            const scoreQuery = studentScoreQueries[index];
            return {
                ...assessment,
                myScoreData: scoreQuery?.data, // This will be { score: XX } or null/undefined
                isLoadingMyScore: scoreQuery?.isLoading,
            };
        });
    }, [assessments, studentScoreQueries]);


    // --- Client-Side Sorting ---
    const sortedAssessments = useMemo(() => {
        return [...assessmentsWithScores].sort((a, b) => {
            let first = a[sortDescriptor.column];
            let second = b[sortDescriptor.column];

            if (sortDescriptor.column === 'myScoreData') { // Sort by score value
                first = a.myScoreData?.score ?? -1; // Treat no score as lowest
                second = b.myScoreData?.score ?? -1;
            } else if (sortDescriptor.column === 'weight') {
                first = parseFloat(a.weight);
                second = parseFloat(b.weight);
            } else if (typeof first === 'string') {
                first = first.toLowerCase();
                second = (typeof second === 'string') ? second.toLowerCase() : '';
            }

            let cmp = (first < second) ? -1 : (first > second) ? 1 : 0;
            if (sortDescriptor.direction === "descending") {
                cmp *= -1;
            }
            return cmp;
        });
    }, [assessmentsWithScores, sortDescriptor]);


    // --- Table Columns & Rendering ---
    const columns = [
        { key: "name", label: "ASSESSMENT NAME", allowsSorting: true },
        { key: "weight", label: "WEIGHT", allowsSorting: true },
        { key: "author", label: "CREATED BY", allowsSorting: true },
        // { key: "dueDate", label: "DUE DATE", allowsSorting: true }, // If you add due dates
        { key: "myScoreData", label: "MY SCORE", allowsSorting: true },
        { key: "createdAt", label: "ANNOUNCED ON", allowsSorting: true },
    ];

    const renderCell = (assessment, columnKey) => {
        const cellValue = assessment[columnKey];
        switch (columnKey) {
            case "weight":
                return <Chip variant="bordered" size="sm">{parseFloat(assessment.weight).toFixed(1)}%</Chip>;
            case "author":
                return (
                    <div className="flex items-center gap-2">
                        <UserCircle size={18} className="text-gray-500" />
                        <span>{assessment.author?.user?.fullName || 'N/A'}</span>
                    </div>
                );
            // case "dueDate":
            //     return assessment.dueDate ? formatDate(assessment.dueDate) : <Chip size="sm" variant="flat" color="warning">Not Set</Chip>;
            case "myScoreData": // This is now the object { score: XX } or null
                return <DisplayScore scoreData={assessment.myScoreData} isLoadingScore={assessment.isLoadingMyScore} />;
            case "createdAt":
                return formatDate(cellValue);
            default:
                return cellValue || 'N/A';
        }
    };

    const isLoadingPage = isLoadingCourseDetails || (isLoadingAssessments && !assessments.length);

    if (isLoadingPage) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Spinner label="Loading course assessments..." size="lg"/></div>;
    }

    if ((isCourseError || !courseDetails) && !isLoadingCourseDetails) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Course Not Found</p>
                <p className="text-center">The course (ID: {courseId}) you are looking for could not be found.</p>
                <Button color="primary" variant="light" onPress={() => navigate('/dashboard/mycourses')} className="mt-4">
                    <ArrowLeft size={16} className="mr-2"/> Back to My Courses
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                 <Button variant="light" onPress={() => navigate('/dashboard/mycourses')} className="mb-2 text-blue-600 hover:text-blue-800 text-sm">
                    <ArrowLeft size={16} className="mr-1"/> Back to My Courses
                </Button>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                    <ClipboardList className="mr-2 md:mr-3 text-blue-600 h-6 w-6 md:h-7 md:w-7" />
                    Assessments for: <span className="text-blue-700 ml-1.5 md:ml-2">{courseDetails?.name}</span>
                </h1>
                <p className="text-sm text-gray-500 mt-1">Course Code: {courseDetails?.code}</p>
            </header>

            {isAssessmentsError &&
                <div className="my-4 p-4 bg-red-50 border border-red-300 rounded-md text-red-700">
                    <AlertTriangle className="inline h-5 w-5 mr-2" />
                    Error loading assessments for this course. Please try again.
                </div>
            }

            <Table
                aria-label={`Table of assessments for ${courseDetails?.name}`}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor}
                classNames={{
                    wrapper: "min-h-[250px] border border-gray-200 rounded-lg shadow-sm",
                    th: "bg-gray-100 text-gray-600 uppercase text-xs font-semibold",
                }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.key} allowsSorting={column.allowsSorting}>
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={sortedAssessments}
                    isLoading={isLoadingAssessments || isLoadingAnyScore}
                    loadingContent={<Spinner label="Loading assessments..." />}
                    emptyContent={
                        !isLoadingAssessments && assessments.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <HelpCircle size={32} className="mx-auto mb-2" />
                                No assessments have been posted for this course yet.
                            </div>
                        ) : " "
                    }
                >
                    {(item) => ( // item is an assessment object with myScoreData
                        <TableRow key={item.id}>
                            {(columnKey) => (
                                <TableCell key={`${item.id}-${columnKey}`}>
                                    {renderCell(item, columnKey)}
                                </TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default CourseAssessmentsListPage;