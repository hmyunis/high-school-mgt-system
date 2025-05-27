// src/pages/teacher/StudentsPage.jsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../api/user.service'; // Adjust path
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Pagination, Button, Input, Spinner, Tooltip, Select, SelectItem, useDisclosure // Added useDisclosure
} from '@heroui/react';
import { GraduationCap, Search, AlertTriangle, Eye } from 'lucide-react';
// Removed Link from react-router-dom as we'll use a modal
import StudentPerformanceModal from '../components/teacher/StudentPerformanceModal'; // Import the new modal

const TeacherStudentsPage = () => {
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        gradeLevel: 'all',
        section: 'all',
        underProbation: 'all',
    });
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'fullName', direction: 'ascending' });

    // Modal state for student performance
    const { isOpen: isPerformanceModalOpen, onOpen: onPerformanceModalOpen, onClose: onPerformanceModalClose } = useDisclosure();
    const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);

    const {
        data: usersQueryData,
        isLoading: isLoadingStudents,
        isError: isStudentsError,
        error: studentsErrorData,
    } = useQuery({
        queryKey: ['allStudentsForTeacherView'],
        queryFn: () => userService.getAllUsers(false, 'STUDENT'),
        staleTime: 1000 * 60 * 5,
        select: (response) => {
            return response?.data?.filter(user => user.studentProfile && user.studentProfile.id) || [];
        },
        onError: (error) => {
            console.error("Error fetching students:", error);
        }
    });

    const students = useMemo(() => usersQueryData || [], [usersQueryData]);

    const processedStudents = useMemo(() => {
        if (!students.length) return [];
        return students
            .filter(user => {
                const studentProfile = user.studentProfile;
                const term = searchTerm.toLowerCase();
                const gradeMatch = filters.gradeLevel === 'all' || String(studentProfile.gradeLevel) === String(filters.gradeLevel);
                const sectionMatch = filters.section === 'all' || (studentProfile.section || '').toLowerCase() === filters.section.toLowerCase();
                const probationMatch = filters.underProbation === 'all' || String(studentProfile.underProbation) === filters.underProbation;
                const searchMatch = !searchTerm ||
                    user.fullName?.toLowerCase().includes(term) ||
                    user.username?.toLowerCase().includes(term) ||
                    user.email?.toLowerCase().includes(term);
                return gradeMatch && sectionMatch && probationMatch && searchMatch;
            })
            .sort((a, b) => {
                let firstValue, secondValue;
                if (['fullName', 'username', 'email'].includes(sortDescriptor.column)) {
                    firstValue = a[sortDescriptor.column];
                    secondValue = b[sortDescriptor.column];
                } else if (a.studentProfile && b.studentProfile &&
                           (sortDescriptor.column === 'gradeLevel' || sortDescriptor.column === 'section' ||
                            sortDescriptor.column === 'absentCount' || sortDescriptor.column === 'underProbation')) {
                    firstValue = a.studentProfile[sortDescriptor.column];
                    secondValue = b.studentProfile[sortDescriptor.column];
                } else { return 0; }
                
                firstValue = firstValue === null || firstValue === undefined ? '' : firstValue;
                secondValue = secondValue === null || secondValue === undefined ? '' : secondValue;

                if (sortDescriptor.column === 'gradeLevel' || sortDescriptor.column === 'absentCount') {
                    firstValue = Number(firstValue);
                    secondValue = Number(secondValue);
                } else if (sortDescriptor.column === 'underProbation') {
                    firstValue = firstValue === true ? 1 : 0;
                    secondValue = secondValue === true ? 1 : 0;
                } else if (typeof firstValue === 'string' && typeof secondValue === 'string') {
                    firstValue = firstValue.toLowerCase();
                    secondValue = secondValue.toLowerCase();
                }
                let cmp = (firstValue < secondValue) ? -1 : (firstValue > secondValue) ? 1 : 0;
                if (sortDescriptor.direction === "descending") cmp *= -1;
                return cmp;
            });
    }, [students, searchTerm, filters, sortDescriptor]);

    const paginatedStudents = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return processedStudents.slice(start, end);
    }, [page, processedStudents, rowsPerPage]);

    const totalPages = Math.ceil(processedStudents.length / rowsPerPage);

    const uniqueGradeLevels = useMemo(() => {
        if (!students.length) return [];
        return [...new Set(students.map(s => s.studentProfile.gradeLevel).filter(g => g !== null && g !== undefined))].sort((a, b) => a - b);
    }, [students]);

    const uniqueSections = useMemo(() => {
        if (!students.length) return [];
        return [...new Set(students.map(s => s.studentProfile.section).filter(Boolean))].sort();
    }, [students]);

    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
    const handleSortChange = (descriptor) => { setSortDescriptor(descriptor); setPage(1); };
    const handlePageChange = (newPage) => setPage(newPage);
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
        setPage(1);
    };

    const handleOpenPerformanceModal = (studentUser) => {
        setSelectedStudentForModal(studentUser);
        onPerformanceModalOpen();
    };

    const columns = [
        { key: "fullName", label: "STUDENT NAME", allowsSorting: true },
        { key: "username", label: "USERNAME", allowsSorting: true },
        { key: "email", label: "EMAIL", allowsSorting: true },
        { key: "gradeLevel", label: "GRADE", allowsSorting: true },
        { key: "section", label: "SECTION", allowsSorting: true },
        { key: "absentCount", label: "ABSENCES", allowsSorting: true },
        { key: "underProbation", label: "PROBATION", allowsSorting: true },
        { key: "actions", label: "ACTIONS", allowsSorting: false },
    ];

    const renderCell = (user, columnKey) => {
        const studentProfile = user.studentProfile;
        switch (columnKey) {
            case "fullName": return user.fullName || 'N/A';
            case "username": return user.username || 'N/A';
            case "email": return user.email || 'N/A';
            case "gradeLevel": return studentProfile.gradeLevel ?? 'N/A';
            case "section": return studentProfile.section || 'N/A';
            case "absentCount": return studentProfile.absentCount !== undefined ? studentProfile.absentCount : 'N/A';
            case "underProbation":
                return (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${studentProfile.underProbation ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {studentProfile.underProbation ? "Yes" : "No"}
                    </span>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-1.5">
                        <Tooltip content="View Student Details & Performance" showArrow color="primary">
                            <Button 
                                size="sm" 
                                variant="flat" 
                                color="primary" 
                                onPress={() => handleOpenPerformanceModal(user)} // Pass the full user object
                                isIconOnly
                            >
                                <Eye size={16} />
                            </Button>
                        </Tooltip>
                    </div>
                );
            default:
                return 'N/A';
        }
    };

    if (isLoadingStudents && !usersQueryData) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
                <Spinner label="Loading students..." size="lg" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <GraduationCap className="mr-3 text-blue-600" /> Student Directory
                </h1>
                <p className="text-gray-500">View student information.</p>
            </header>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Students</label>
                        <Input
                            placeholder="Name, username, email..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            startContent={<Search size={16} className="text-gray-400" />}
                            clearable
                            onClear={() => setSearchTerm('')}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                        <Select
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                        <Select
                            placeholder="All Sections"
                            selectedKeys={filters.section !== 'all' ? [filters.section] : []}
                            onSelectionChange={(keys) => handleFilterChange('section', Array.from(keys)[0] || 'all')}
                            className="w-full"
                        >
                            <SelectItem key="all" value="all">All Sections</SelectItem>
                            {uniqueSections.map(section => <SelectItem key={section} value={section}>{section}</SelectItem>)}
                        </Select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Probation Status</label>
                        <Select
                            placeholder="All Statuses"
                            selectedKeys={filters.underProbation !== 'all' ? [filters.underProbation] : []}
                            onSelectionChange={(keys) => handleFilterChange('underProbation', Array.from(keys)[0] || 'all')}
                            className="w-full"
                        >
                            <SelectItem key="all" value="all">All</SelectItem>
                            <SelectItem key="true" value="true">Yes (On Probation)</SelectItem>
                            <SelectItem key="false" value="false">No (Not on Probation)</SelectItem>
                        </Select>
                    </div>
                </div>
            </div>

            {isStudentsError &&
                <div className="my-4 p-4 bg-red-50 border border-red-300 rounded-md text-red-700">
                    <AlertTriangle className="inline h-5 w-5 mr-2" />
                    Error loading students: {studentsErrorData?.response?.data?.message || "An unexpected error occurred."}
                </div>
            }

            <Table
                aria-label="Table of Students"
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
                    items={paginatedStudents}
                    isLoading={isLoadingStudents}
                    loadingContent={<Spinner label="Loading students..." />}
                    emptyContent={
                        !isLoadingStudents && students.length === 0 ? "No students found in the system." :
                        !isLoadingStudents && paginatedStudents.length === 0 ? "No students match your search or filter criteria." :
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

            {/* Performance Modal */}
            {selectedStudentForModal && (
                <StudentPerformanceModal
                    isOpen={isPerformanceModalOpen}
                    onClose={() => {
                        onPerformanceModalClose();
                        setSelectedStudentForModal(null); // Clear selected student when closing
                    }}
                    studentUser={selectedStudentForModal}
                />
            )}
        </div>
    );
};

export default TeacherStudentsPage;