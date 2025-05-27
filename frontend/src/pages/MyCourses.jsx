import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teacherCoursesService } from '../api/teacherCourses.service';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Pagination, Button, Input, Spinner, Tooltip} from '@heroui/react'; // Adjust HeroUI imports as necessary
import { BookOpen, Search, AlertTriangle, Eye } from 'lucide-react';
import { formatDate } from '../lib/dateUtils'; // Adjust path
import { Link } from 'react-router-dom'; // For navigation

const MyCoursesPage = () => {
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' });

    const {
        data: coursesQueryData, // Raw response from query
        isLoading: isLoadingCourses,
        isError: isCoursesError,
        error: coursesErrorData,
    } = useQuery({
        queryKey: ['myAssignedCourses'],
        queryFn: () => teacherCoursesService.getMyAssignedCourses(),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        select: (response) => response?.data || [], // Directly extract the data array
        onError: (error) => {
            // Error is already handled by the isError and errorData variables
            // toast.error(error?.response?.data?.message || "Failed to load your courses.");
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
                course.code?.toLowerCase().includes(term)
            );
        }
        return localCourses;
    }, [courses, searchTerm]);

    const sortedCourses = useMemo(() => {
        return [...filteredCourses].sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            // Basic string/number comparison
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
        // Add more columns if your API returns more data, e.g., number of students, related assessments
        // { key: "studentCount", label: "ENROLLED STUDENTS", allowsSorting: true },
        { key: "createdAt", label: "ASSIGNED ON / CREATED", allowsSorting: true }, // Assuming createdAt of course for now
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (course, columnKey) => {
        const cellValue = course[columnKey];
        switch (columnKey) {
            case "createdAt":
                return formatDate(cellValue); // Or date of assignment if available
            case "actions":
                return (
                    <div className="flex items-center gap-1.5">
                        <Tooltip content="View Course Details & Manage Assessments" showArrow color="primary">
                            {/* Link to a detailed course page for the teacher */}
                            <Link to={`/dashboard/assessments/courses/${course.id}`}>
                                <Button size="sm" variant="flat" color="primary" isIconOnly>
                                    <Eye size={16} />
                                </Button>
                            </Link>
                        </Tooltip>
                        {/* Add other actions like "View Enrolled Students" if applicable */}
                    </div>
                );
            default:
                return cellValue;
        }
    };

    if (isLoadingCourses) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner label="Loading your courses..." size="lg" />
            </div>
        );
    }

    if (isCoursesError) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Error Loading Your Courses</p>
                <p className="text-center">
                    {coursesErrorData?.response?.data?.message || "Could not fetch your assigned courses. Please try again later."}
                </p>
            </div>
        );
    }


    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <BookOpen className="mr-3 text-blue-600" /> My Assigned Courses
                    </h1>
                    <p className="text-gray-500">View and manage the courses you are teaching.</p>
                </div>
                {/* Optionally, a button if teachers can initiate something course-related here */}
            </header>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search My Courses</label>
                    <Input
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        startContent={<Search size={18} className="text-gray-400" />}
                        clearable
                        onClear={() => setSearchTerm('')}
                    />
                </div>
            </div>

            <Table
                aria-label="Table of My Assigned Courses"
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
                    th: "bg-gray-100 text-gray-600 uppercase text-xs",
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
                    // isLoading={isLoadingCourses} // isLoading on TableBody can be used
                    loadingContent={<Spinner label="Loading..." />} // Shown when items is empty and isLoading is true
                    emptyContent={
                        isLoadingCourses ? " " : // Prevent "No content" flicker during load
                        courses.length === 0 ? "You are not currently assigned to any courses." :
                        paginatedCourses.length === 0 ? "No courses match your search." : "No courses to display."
                    }
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default MyCoursesPage;