// src/pages/teacher/AssessmentScoresPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAssessmentService } from '../api/student.assessment.service'; // Ensure correct path
import { assessmentService } from '../api/assessment.service'; // Ensure correct path
import { courseService } from '../api/course.service'; // Ensure correct path
import { toast } from 'sonner';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Button, Input, Spinner, Tooltip, Select, SelectItem, // Added Select for filters
    NumberInput
} from '@heroui/react';
import { ListChecks, Save, ArrowLeft, AlertTriangle, Search, Filter as FilterIcon } from 'lucide-react'; // Added FilterIcon

const AssessmentScoresPage = () => {
    const { courseId, assessmentId } = useParams();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [scores, setScores] = useState({}); // { [studentId]: "scoreString" }
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        gradeLevel: 'all', // 'all' or specific grade number
        section: 'all',    // 'all' or specific section string
    });
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'fullName', direction: 'ascending' });


    // Fetch Course Details
    const { data: courseDetails, isLoading: isLoadingCourse } = useQuery({
        queryKey: ['courseDetailsForScores', courseId],
        queryFn: () => courseService.getCourseById(courseId),
        enabled: !!courseId,
        select: (response) => response?.data,
    });

    // Fetch Assessment Details
    const { data: assessmentDetails, isLoading: isLoadingAssessmentDetails } = useQuery({
        queryKey: ['assessmentDetailsForScores', assessmentId],
        queryFn: () => assessmentService.getAssessmentById(assessmentId),
        enabled: !!assessmentId,
        select: (response) => response?.data,
    });

    // Fetch Students for the Course
    const { data: studentsQueryData, isLoading: isLoadingStudents } = useQuery({
        queryKey: ['studentsForCourseGrading', courseId], // More specific key
        queryFn: () => studentAssessmentService.getStudentsForCourse(courseId),
        enabled: !!courseId,
        select: (response) => response?.data || [],
        onError: (err) => toast.error(err?.response?.data?.message || "Failed to load students for this course."),
    });
    const courseStudents = useMemo(() => studentsQueryData || [], [studentsQueryData]);

    // Fetch Existing Scores for this Assessment
    const { data: existingScoresQueryData, isLoading: isLoadingExistingScores } = useQuery({
        queryKey: ['scoresForAssessment', assessmentId],
        queryFn: () => studentAssessmentService.getScoresForAssessment(assessmentId),
        enabled: !!assessmentId,
        select: (response) => response?.data || [],
        onSuccess: (data) => {
            const initialScores = {};
            data.forEach(scoreEntry => {
                // student_id here refers to Student.id (PK of Student table)
                initialScores[scoreEntry.student_id] = scoreEntry.score !== null && scoreEntry.score !== undefined ? scoreEntry.score : 0;
            });
            setScores(initialScores);
        },
        onError: (err) => toast.error(err?.response?.data?.message || "Failed to load existing scores."),
    });

    // Mutation for Submitting Scores
    const submitScoresMutation = useMutation({
        mutationFn: (scoresToSubmit) => studentAssessmentService.submitScoresForAssessment(assessmentId, scoresToSubmit),
        onSuccess: (data) => {
            toast.success(data?.message || "Scores submitted successfully!");
            queryClient.invalidateQueries({ queryKey: ['scoresForAssessment', assessmentId] });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Failed to submit scores.");
        },
    });

    const handleScoreChange = (studentId, value) => {
        // Allow empty string, or numbers (including decimals)
        if (value === '' || /^-?\d*\.?\d*$/.test(value)) {
            setScores(prev => ({
                ...prev,
                [studentId]: value,
            }));
        }
    };
    
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
    };


    const handleSubmitScores = () => {
        const scoresToSubmit = Object.entries(scores)
            .map(([student_id_str, scoreStr]) => {
                const student_id = parseInt(student_id_str);
                if (scoreStr === '' || scoreStr === null || scoreStr === undefined) return null;

                const score = parseFloat(scoreStr);
                if (isNaN(score)) {
                    const student = courseStudents.find(s => s.id === student_id);
                    toast.error(`Invalid score for ${student?.fullName || `Student ID ${student_id}`}: '${scoreStr}'. Please enter a number.`);
                    return 'INVALID_ENTRY';
                }
                if (assessmentDetails?.weight !== null && assessmentDetails?.weight !== undefined && (score < 0 || score > assessmentDetails.weight)) {
                    const student = courseStudents.find(s => s.id === student_id);
                    toast.error(`Score for ${student?.fullName || `Student ID ${student_id}`} (${score}) is out of range (0-${assessmentDetails.weight}).`);
                    return 'INVALID_ENTRY';
                } else if (score < 0) { // General check if weight isn't defined
                    const student = courseStudents.find(s => s.id === student_id);
                    toast.error(`Score for ${student?.fullName || `Student ID ${student_id}`} (${score}) cannot be negative.`);
                    return 'INVALID_ENTRY';
                }
                return { student_id: student_id, score };
            })
            .filter(entry => entry !== null);

        if (scoresToSubmit.some(entry => entry === 'INVALID_ENTRY')) {
            return;
        }
        if (scoresToSubmit.length === 0) {
            toast.info("No new or changed scores to submit.");
            return;
        }
        submitScoresMutation.mutate(scoresToSubmit);
    };

    // Client-side filtering and sorting
    const processedStudents = useMemo(() => {
        if (!courseStudents) return [];
        return courseStudents
            .filter(student => {
                const term = searchTerm.toLowerCase();
                const gradeMatch = filters.gradeLevel === 'all' || String(student.gradeLevel) === String(filters.gradeLevel);
                const sectionMatch = filters.section === 'all' || (student.section || '').toLowerCase() === filters.section.toLowerCase(); // Handle null/undefined sections
                const searchMatch = !searchTerm ||
                    student.fullName?.toLowerCase().includes(term) ||
                    student.username?.toLowerCase().includes(term) ||
                    student.email?.toLowerCase().includes(term);
                return gradeMatch && sectionMatch && searchMatch;
            })
            .sort((a, b) => {
                // Ensure values exist for sorting, provide fallbacks
                let first = a[sortDescriptor.column] === null || a[sortDescriptor.column] === undefined ? '' : a[sortDescriptor.column];
                let second = b[sortDescriptor.column] === null || b[sortDescriptor.column] === undefined ? '' : b[sortDescriptor.column];

                // Handle numeric sorting for gradeLevel
                if (sortDescriptor.column === 'gradeLevel') {
                    first = Number(first);
                    second = Number(second);
                } else if (typeof first === 'string') { // Case-insensitive string sort for others
                    first = first.toLowerCase();
                    second = second.toLowerCase();
                }

                let cmp = (first < second) ? -1 : (first > second) ? 1 : 0;
                if (sortDescriptor.direction === "descending") {
                    cmp *= -1;
                }
                return cmp;
            });
    }, [courseStudents, searchTerm, filters, sortDescriptor]);

    const uniqueGradeLevels = useMemo(() => {
        if (!courseStudents) return [];
        return [...new Set(courseStudents.map(s => s.gradeLevel).filter(g => g !== null && g !== undefined))].sort((a, b) => a - b);
    }, [courseStudents]);

    const uniqueSections = useMemo(() => {
        if (!courseStudents) return [];
        return [...new Set(courseStudents.map(s => s.section).filter(Boolean))].sort();
    }, [courseStudents]);


    // Columns for the table
    const columns = [
        { key: "fullName", label: "STUDENT NAME", allowsSorting: true },
        { key: "username", label: "USERNAME", allowsSorting: true },
        { key: "gradeLevel", label: "GRADE", allowsSorting: true },
        { key: "section", label: "SECTION", allowsSorting: true },
        { key: "score", label: `SCORE ${assessmentDetails?.weight ? `(/ ${assessmentDetails.weight})` : ''}` },
    ];

    const renderCell = (student, columnKey) => {
        // student object from API: { id (Student PK), user_id, fullName, username, email, gradeLevel, section }
        switch (columnKey) {
            case "fullName": return student?.fullName || 'N/A';
            case "username": return student?.username || 'N/A';
            case "gradeLevel": return student?.gradeLevel || 'N/A';
            case "section": return student?.section || 'N/A';
            case "score":
                const initialScores = {};
                existingScoresQueryData.forEach(scoreEntry => {
                    // student_id here refers to Student.id (PK of Student table)
                    initialScores[scoreEntry.student_id] = scoreEntry.score !== null && scoreEntry.score !== undefined ? scoreEntry.score : 0;
                });
                return (
                    <NumberInput
                        aria-label={`Score for ${student?.fullName}`}
                        value={scores[student?.id]?.toString()} // student.id is Student PK
                        onValueChange={(value) => handleScoreChange(student.id, value)}
                        placeholder={initialScores[student.id] !== undefined ? initialScores[student.id].toString() : '0'}
                        minValue={0}
                        step={0.5}
                        maxValue={assessmentDetails?.weight}
                        className="max-w-[100px] text-sm p-1"
                        isDisabled={submitScoresMutation.isLoading}
                    />
                );
            default:
                return 'N/A';
        }
    };

    const isLoading = isLoadingCourse || isLoadingAssessmentDetails || isLoadingStudents || isLoadingExistingScores;

    if (isLoading && !courseDetails && !assessmentDetails) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Spinner label="Loading assessment scores..." size="lg" /></div>;
    }

    if ((!courseDetails && !isLoadingCourse) || (!assessmentDetails && !isLoadingAssessmentDetails)) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Required Information Missing</p>
                <p className="text-center">Could not load course or assessment details (ID: C{courseId}/A{assessmentId}).</p>
                <Button color="primary" variant="light" onPress={() => navigate(`/dashboard/assessments/courses/${courseId}`)} className="mt-4">
                    <ArrowLeft size={16} className="mr-2"/> Back to Assessments
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="light" onPress={() => navigate(`/dashboard/assessments/courses/${courseId}`)} className="mb-2 text-blue-600 hover:text-blue-800 text-sm">
                            <ArrowLeft size={16} className="mr-1"/> Back to Assessments for {courseDetails?.name}
                        </Button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
                            <ListChecks className="mr-2 md:mr-3 text-blue-600 h-6 w-6 md:h-7 md:w-7" />
                            Manage Scores: <span className="text-blue-700 ml-1.5 md:ml-2">{assessmentDetails?.name}</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Course: {courseDetails?.name} ({courseDetails?.code})
                            {assessmentDetails?.weight !== null && assessmentDetails?.weight !== undefined && <span className="ml-2 text-xs">(Max Score: {assessmentDetails.weight})</span>}
                        </p>
                    </div>
                </div>
            </header>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
                        <Input
                            placeholder="Name, username, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            startContent={<Search size={16} className="text-gray-400" />}
                            clearable
                            onClear={() => setSearchTerm('')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Grade</label>
                        <Select
                            aria-label='Filter by Grade Level'
                            placeholder="All Grades"
                            selectedKeys={filters.gradeLevel !== 'all' ? [filters.gradeLevel] : []}
                            onSelectionChange={(keys) => handleFilterChange('gradeLevel', Array.from(keys)[0] || 'all')}
                            className="w-full"
                        >
                            <SelectItem key="all" value="all">All Grades</SelectItem>
                            {uniqueGradeLevels.map(grade => <SelectItem key={grade} value={String(grade)}>{grade}</SelectItem>)}
                        </Select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Section</label>
                        <Select
                            aria-label='Filter by Section'
                            placeholder="All Sections"
                            selectedKeys={filters.section !== 'all' ? [filters.section] : []}
                            onSelectionChange={(keys) => handleFilterChange('section', Array.from(keys)[0] || 'all')}
                            className="w-full"
                        >
                            <SelectItem key="all" value="all">All Sections</SelectItem>
                            {uniqueSections.map(section => <SelectItem key={section} value={section}>{section}</SelectItem>)}
                        </Select>
                    </div>
                </div>
            </div>

            {isLoadingStudents && !courseStudents.length && <div className="text-center py-4"><Spinner label="Loading students..." /></div>}

            <Table
                aria-label={`Table of student scores for assessment ${assessmentDetails?.name}`}
                sortDescriptor={sortDescriptor}
                onSortChange={setSortDescriptor} // Directly pass setSortDescriptor
                classNames={{ wrapper: "min-h-[300px] border border-gray-200 rounded-lg shadow-sm", th: "bg-gray-100 text-gray-600 uppercase text-xs" }}
            >
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn key={column.key} allowsSorting={column.allowsSorting}>
                            {column.label}
                        </TableColumn>
                    )}
                </TableHeader>
                <TableBody
                    items={processedStudents}
                    isLoading={isLoadingStudents || isLoadingExistingScores || submitScoresMutation.isLoading}
                    loadingContent={<Spinner label="Processing..." />}
                    emptyContent={
                        isLoadingStudents || isLoadingExistingScores ? " " :
                        courseStudents.length === 0 ? "No students enrolled in this course." :
                        processedStudents.length === 0 ? "No students match your filters." : "No students."
                    }
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="mt-6 flex justify-end">
                <Button
                    color="primary"
                    size="lg" // Larger button for primary action
                    startContent={<Save size={20} />} // Slightly larger icon
                    onPress={handleSubmitScores}
                    isLoading={submitScoresMutation.isLoading}
                    // Disable if no scores have been touched or if loading/mutating
                    disabled={!Object.keys(scores).length && !submitScoresMutation.isLoading}
                >
                    Submit All Scores
                </Button>
            </div>
        </div>
    );
};

export default AssessmentScoresPage;