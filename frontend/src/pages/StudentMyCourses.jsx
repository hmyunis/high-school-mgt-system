import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { courseService } from '../api/course.service'; // Assuming this fetches all courses with teachers
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Pagination, Button, Input, Spinner, Tooltip, Chip
} from '@heroui/react'; // Adjust HeroUI imports as necessary
import { BookOpen, Search, AlertTriangle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom'; // For navigation

const StudentMyCoursesPage = () => {
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10); // Or make this configurable
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' });

    const {
        data: coursesQueryData,
        isLoading: isLoadingCourses,
        isError: isCoursesError,
        error: coursesErrorData,
    } = useQuery({
        queryKey: ['allCoursesForStudentView'],
        queryFn: () => courseService.getAllCourses(), // Fetches all courses with teacher details
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        select: (response) => response?.data || [], // Ensure we always work with an array
        onError: (error) => {
            // Error handled by isError and coursesErrorData
        }
    });

    const courses = useMemo(() => coursesQueryData || [], [coursesQueryData]);

    // --- Client-Side Filtering and Sorting ---
    const filteredCourses = useMemo(() => {
        if (!courses) return [];
        let localCourses = courses;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            localCourses = localCourses.filter(course =>
                course.name?.toLowerCase().includes(term) ||
                course.code?.toLowerCase().includes(term) ||
                (course.teachers && course.teachers.some(teacher => teacher.user?.fullName?.toLowerCase().includes(term)))
            );
        }
        return localCourses;
    }, [courses, searchTerm]);

    const sortedCourses = useMemo(() => {
        return [...filteredCourses].sort((a, b) => {
            let first = a[sortDescriptor.column];
            let second = b[sortDescriptor.column];

            // Handle sorting for 'teachers' array - e.g., by the first teacher's name or count
            if (sortDescriptor.column === 'teachers') {
                const firstTeacherName = a.teachers?.[0]?.user?.fullName?.toLowerCase() || '';
                const secondTeacherName = b.teachers?.[0]?.user?.fullName?.toLowerCase() || '';
                first = firstTeacherName;
                second = secondTeacherName;
            } else if (typeof first === 'string') {
                first = first.toLowerCase();
                second = second.toLowerCase();
            }

            let cmp = (first < second) ? -1 : (first > second) ? 1 : 0;
            if (sortDescriptor.direction === "descending") {
                cmp *= -1;
            }
            return cmp;
        });
    }, [filteredCourses, sortDescriptor]);

    const paginatedCourses = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedCourses.slice(start, end);
    }, [page, sortedCourses, rowsPerPage]);

    const totalPages = Math.ceil(sortedCourses.length / rowsPerPage);

    // --- Event Handlers ---
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
    const handleSortChange = (descriptor) => { setSortDescriptor(descriptor); setPage(1); };
    const handlePageChange = (newPage) => setPage(newPage);

    // --- Table Columns & Rendering ---
    const columns = [
        { key: "name", label: "COURSE NAME", allowsSorting: true },
        { key: "code", label: "CODE", allowsSorting: true },
        { key: "teachers", label: "TEACHER(S)", allowsSorting: true }, // Sorting by first teacher's name
        { key: "actions", label: "VIEW ASSESSMENTS" },
    ];

    const renderCell = (course, columnKey) => {
        const cellValue = course[columnKey];
        switch (columnKey) {
            case "teachers":
                return (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                        {course.teachers && course.teachers.length > 0 ? (
                            course.teachers.map(teacher => (
                                <Chip key={teacher.id} size="sm" variant="flat" color="default">
                                    {teacher.user?.fullName || `Teacher ID: ${teacher.id}`}
                                </Chip>
                            ))
                        ) : (
                            <span className="text-xs text-gray-500 italic">Not Assigned</span>
                        )}
                    </div>
                );
            case "actions":
                return (
                    <Tooltip content="View all assessments for this course" showArrow color="primary">
                        <Link to={`/dashboard/mycourses/${course.id}/assessments`}>
                            <Button size="sm" variant="flat" color="primary" isIconOnly>
                                <Eye size={16} />
                            </Button>
                        </Link>
                    </Tooltip>
                );
            default:
                return cellValue || 'N/A';
        }
    };

    if (isLoadingCourses && !courses.length) { // Show full page spinner only on initial load
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner label="Loading courses..." size="lg" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <BookOpen className="mr-3 text-blue-600" /> My Courses
                </h1>
                <p className="text-gray-500">Browse available courses and view their assessments.</p>
            </header>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
                    <Input
                        placeholder="Search by name, code, or teacher..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        startContent={<Search size={16} className="text-gray-400" />}
                        clearable
                        onClear={() => setSearchTerm('')}
                    />
                </div>
            </div>

            {isCoursesError &&
                <div className="my-4 p-4 bg-red-50 border border-red-300 rounded-md text-red-700">
                    <AlertTriangle className="inline h-5 w-5 mr-2" />
                    Error loading courses: {coursesErrorData?.response?.data?.message || "An unexpected error occurred."}
                </div>
            }

            <Table
                aria-label="Table of My Courses"
                sortDescriptor={sortDescriptor}
                onSortChange={handleSortChange}
                bottomContent={
                    totalPages > 0 ? (
                        <div className="flex w-full justify-center py-4">
                            <Pagination
                                isCompact
                                showControls
                                showShadow
                                color="primary"
                                page={page}
                                total={totalPages}
                                onChange={handlePageChange}
                            />
                        </div>
                    ) : null
                }
                classNames={{
                    wrapper: "min-h-[300px] border border-gray-200 rounded-lg shadow-sm",
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
                    items={paginatedCourses}
                    isLoading={isLoadingCourses}
                    loadingContent={<Spinner label="Loading courses..." />}
                    emptyContent={
                        !isLoadingCourses && courses.length === 0 ? "No courses found in the system." :
                        !isLoadingCourses && paginatedCourses.length === 0 ? "No courses match your search." :
                        " "
                    }
                >
                    {(item) => (
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

export default StudentMyCoursesPage;