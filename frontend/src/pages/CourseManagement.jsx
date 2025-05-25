// src/pages/CourseManagement.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseService } from '../api/course.service';
import { userService } from '../api/user.service'; // Assuming this can fetch teachers
import { toast } from 'sonner';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Pagination, Button, Input, Select, SelectItem, // Assuming Select structure
    useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Spinner, Tooltip, Chip
} from '@heroui/react'; // Adjust imports
import { BookOpen, PlusCircle, Edit3, Trash2, UserPlus, Search, ShieldAlert, Link2 } from 'lucide-react';
import { formatDate } from '../lib/dateUtils'; // Adjust path

// Reusable ConfirmationModal (assuming it's in shared components or defined in a utils file)
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading, confirmText = "Confirm", variant = "danger" }) => {
    if (!isOpen) return null;
    const confirmButtonColor = variant === "danger" ? "danger" : variant === "warning" ? "warning" : "primary";
    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={false} isKeyboardDismissDisabled={true} size="md">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <ShieldAlert className={`${variant === "danger" ? "text-red-500" : variant === "warning" ? "text-yellow-500" : "text-blue-500"}`} size={24} />
                        {title}
                    </ModalHeader>
                    <ModalBody><p className="text-gray-600">{message}</p></ModalBody>
                    <ModalFooter>
                        <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button>
                        <Button color={confirmButtonColor} onPress={onConfirm} isLoading={isLoading}>
                            {isLoading ? "Processing..." : confirmText}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};


// Course Form Modal (for Create and Edit)
const CourseFormModal = ({ isOpen, onClose, course, onSubmit, isLoading }) => {
    const isEditMode = !!course;
    const [formData, setFormData] = useState({ name: '', code: '' });

    useEffect(() => {
        if (isEditMode && course) {
            setFormData({ name: course.name || '', code: course.code || '' });
        } else {
            setFormData({ name: '', code: '' });
        }
    }, [course, isEditMode, isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = () => {
        onSubmit(formData);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="lg" placement="top-center">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        {isEditMode ? <Edit3 size={24} className="text-blue-600" /> : <PlusCircle size={24} className="text-blue-600" />}
                        {isEditMode ? 'Edit Course' : 'Create New Course'}
                    </ModalHeader>
                    <ModalBody className="space-y-4 p-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Course Name *</label>
                            <Input name="name" placeholder="e.g., Mathematics 101" value={formData.name} onChange={handleChange} disabled={isLoading} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Course Code *</label>
                            <Input name="code" placeholder="e.g., MATH101" value={formData.code} onChange={handleChange} disabled={isLoading} required />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                            {isLoading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Course")}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

// Assign Teacher Modal
const AssignTeacherModal = ({ isOpen, onClose, course, allTeachers, onAssign, isLoading, assignedTeacherIds }) => {
    const [selectedTeacherProfileId, setSelectedTeacherProfileId] = useState(''); // Stores Teacher.id

    useEffect(() => {
        setSelectedTeacherProfileId('');
    }, [isOpen]);

    const availableTeachers = useMemo(() => {
        return allTeachers.filter(user => // allTeachers is an array of User objects
            user.teacherProfile && user.teacherProfile.id && !assignedTeacherIds.includes(user.teacherProfile.id)
        );
    }, [allTeachers, assignedTeacherIds]);

    const handleSubmit = () => {
        if (!selectedTeacherProfileId) {
            toast.error("Please select a teacher to assign.");
            return;
        }
        onAssign(course.id, selectedTeacherProfileId); // Pass Teacher.id
    };

    if (!isOpen || !course) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="lg" placement="top-center">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <UserPlus size={24} className="text-blue-600" />
                        Assign Teacher to: {course.name}
                    </ModalHeader>
                    <ModalBody className="space-y-4 p-6">
                        {availableTeachers.length > 0 ? (
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">Select Teacher *</label>
                                <Select
                                    placeholder="Choose a teacher"
                                    selectedKeys={selectedTeacherProfileId ? [selectedTeacherProfileId] : []}
                                    onSelectionChange={(keys) => setSelectedTeacherProfileId(Array.from(keys)[0])}
                                    className="w-full" // Ensure Select component takes full width or apply Tailwind w-full
                                    disabled={isLoading}
                                >
                                    {availableTeachers.map(user => ( // user is a User object with a teacherProfile
                                        <SelectItem key={user.teacherProfile.id} value={user.teacherProfile.id.toString()}>
                                            {user.fullName || `Teacher (User ID: ${user.id})`} (Profile ID: {user.teacherProfile.id})
                                        </SelectItem>
                                    ))}
                                </Select>
                            </div>
                        ) : (
                            <p className="text-gray-600 text-center py-4">
                                No available teachers to assign to this course.
                            </p>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button>
                        <Button
                            color="primary"
                            onPress={handleSubmit}
                            isLoading={isLoading || availableTeachers.length === 0}
                            disabled={availableTeachers.length === 0}
                        >
                            {isLoading ? "Assigning..." : "Assign Teacher"}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};


// --- Main Course Management Page ---
const CourseManagementPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' });

    // Modal states
    const { isOpen: isFormModalOpen, onOpen: onFormModalOpen, onClose: onFormModalClose } = useDisclosure();
    const { isOpen: isAssignModalOpen, onOpen: onAssignModalOpen, onClose: onAssignModalClose } = useDisclosure();
    const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();

    const [selectedCourse, setSelectedCourse] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null);

    // Fetch Courses
    const { data: coursesQuery, isLoading: isLoadingCourses, isError: isCoursesError } = useQuery({
        queryKey: ['courses'],
        queryFn: courseService.getAllCourses,
        staleTime: 1000 * 60 * 2,
        select: (response) => response?.data || [], // Ensure we always work with an array
        onError: (error) => toast.error(error?.response?.data?.message || "Failed to load courses."),
    });
    const courses = useMemo(() => coursesQuery || [], [coursesQuery]);


    // Fetch All Teachers (Users with Teacher role and their Teacher profile)
    const { data: teachersUsersQuery, isLoading: isLoadingTeachers } = useQuery({
        queryKey: ['allUsersWithTeacherRoleForCourseAssignment'],
        queryFn: () => userService.getAllUsers(false, 'TEACHER'), // includeArchived = false, role = 'TEACHER'
        staleTime: 1000 * 60 * 5,
        select: (response) => {
            const usersWithTeacherRole = response?.data || [];
            return usersWithTeacherRole.filter(user => user.teacherProfile && user.teacherProfile.id);
        },
        onError: (error) => toast.error(error?.response?.data?.message || "Failed to load teachers for assignment."),
    });
    const allTeachersForAssignment = useMemo(() => teachersUsersQuery || [], [teachersUsersQuery]);


    // --- Mutations ---
    const commonMutationOptions = {
        onSuccess: (data) => {
            toast.success(data?.message || "Action successful!");
            queryClient.invalidateQueries({ queryKey: ['courses'] }); // Invalidate by queryKey object
            onFormModalClose();
            onAssignModalClose();
            onConfirmModalClose();
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Action failed.");
        },
    };

    const createCourseMutation = useMutation({ mutationFn: courseService.createCourse, ...commonMutationOptions });
    const updateCourseMutation = useMutation({ mutationFn: ({ courseId, data }) => courseService.updateCourse(courseId, data), ...commonMutationOptions });
    const deleteCourseMutation = useMutation({ mutationFn: courseService.deleteCourse, ...commonMutationOptions });
    const assignTeacherMutation = useMutation({ mutationFn: ({ courseId, teacherId }) => courseService.assignTeacherToCourse(courseId, teacherId), ...commonMutationOptions });
    const removeTeacherMutation = useMutation({ mutationFn: ({ courseId, teacherId }) => courseService.removeTeacherFromCourse(courseId, teacherId), ...commonMutationOptions });

    // --- Data Processing for Table ---
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
            let cmp = (first < second) ? -1 : (first > second) ? 1 : 0;
            if (sortDescriptor.direction === "descending") cmp *= -1;
            return cmp;
        });
    }, [filteredCourses, sortDescriptor]);

    const paginatedCourses = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedCourses.slice(start, end);
    }, [page, sortedCourses, rowsPerPage]);

    const totalPages = Math.ceil(sortedCourses.length / rowsPerPage);
    const isLoadingAnyMutation = createCourseMutation.isLoading || updateCourseMutation.isLoading || deleteCourseMutation.isLoading || assignTeacherMutation.isLoading || removeTeacherMutation.isLoading;

    // --- Event Handlers ---
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
    const handleSortChange = (descriptor) => { setSortDescriptor(descriptor); setPage(1); };
    const handlePageChange = (newPage) => setPage(newPage);


    const openCreateModal = () => { setSelectedCourse(null); onFormModalOpen(); };
    const openEditModal = (course) => { setSelectedCourse(course); onFormModalOpen(); };
    const openAssignTeacherModal = (course) => { setSelectedCourse(course); onAssignModalOpen(); };

    const handleCourseSubmit = (formData) => {
        if (selectedCourse?.id) {
            updateCourseMutation.mutate({ courseId: selectedCourse.id, data: formData });
        } else {
            createCourseMutation.mutate(formData);
        }
    };
    const handleAssignTeacherSubmit = (courseId, teacherProfileId) => { // teacherProfileId is Teacher.id
        assignTeacherMutation.mutate({ courseId, teacherId: teacherProfileId });
    };

    const prepareConfirmAction = (type, data) => {
        setSelectedCourse(type === 'deleteCourse' ? courses.find(c=>c.id === data) : courses.find(c=>c.id === data.courseId)); // ensure selectedCourse is set for message
        setConfirmAction({ type, data });
        onConfirmModalOpen();
    };

    const executeConfirmAction = () => {
        if (!confirmAction) return;
        const { type, data } = confirmAction;
        if (type === 'deleteCourse') deleteCourseMutation.mutate(data); // data is courseId
        else if (type === 'removeTeacher') removeTeacherMutation.mutate(data); // data is { courseId, teacherId (Teacher.id) }
    };

    // --- Table Columns & Rendering ---
    const columns = [
        { key: "name", label: "COURSE NAME", allowsSorting: true },
        { key: "code", label: "CODE", allowsSorting: true },
        { key: "teachers", label: "ASSIGNED TEACHERS" },
        { key: "createdAt", label: "CREATED", allowsSorting: true },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (course, columnKey) => {
        const cellValue = course[columnKey];
        switch (columnKey) {
            case "teachers":
                return (
                    <div className="flex flex-wrap gap-1 max-w-xs"> {/* Added max-w-xs for better control */}
                        {course.teachers && course.teachers.length > 0 ? (
                            course.teachers.map(teacher => ( // teacher is the Teacher model instance from backend include
                                <Tooltip key={teacher.id} content={`Teacher: ${teacher.user?.fullName || 'N/A'} (Profile ID: ${teacher.id})`} showArrow color="secondary">
                                    <Chip
                                        size="sm"
                                        variant="flat"
                                        color="secondary"
                                        onClose={() => prepareConfirmAction('removeTeacher', { courseId: course.id, teacherId: teacher.id })}
                                        className="cursor-default"
                                    >
                                        {teacher.user?.fullName || `Teacher (ID: ${teacher.id})`}
                                    </Chip>
                                </Tooltip>
                            ))
                        ) : (
                            <span className="text-xs text-gray-500 italic">None assigned</span>
                        )}
                    </div>
                );
            case "createdAt":
                return formatDate(cellValue);
            case "actions":
                return (
                    <div className="flex items-center gap-1.5">
                        <Tooltip content="Edit Course Details" showArrow color="primary">
                            <Button size="sm" variant="flat" color="primary" onPress={() => openEditModal(course)} isIconOnly><Edit3 size={16} /></Button>
                        </Tooltip>
                        <Tooltip content="Assign/Manage Teachers" showArrow color="secondary">
                            <Button size="sm" variant="flat" color="secondary" onPress={() => openAssignTeacherModal(course)} isIconOnly><Link2 size={16} /></Button>
                        </Tooltip>
                        <Tooltip content="Delete Course" showArrow color="danger">
                            <Button size="sm" variant="flat" color="danger" onPress={() => prepareConfirmAction('deleteCourse', course.id)} isIconOnly><Trash2 size={16} /></Button>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <BookOpen className="mr-3 text-blue-600" /> Course Management
                    </h1>
                    <p className="text-gray-500">Manage academic courses and teacher assignments.</p>
                </div>
                <Button color="primary" startContent={<PlusCircle size={18} />} onPress={openCreateModal}>
                    Add New Course
                </Button>
            </header>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Courses</label>
                    <Input
                        placeholder="Search by name or code..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        startContent={<Search size={18} className="text-gray-400" />}
                        clearable // Assuming HeroUI Input supports this
                        onClear={() => setSearchTerm('')} // Or handle clear appropriately
                    />
                </div>
            </div>

            {isCoursesError && <p className="text-red-500 text-center py-4">Error loading courses. Please try again.</p>}

            <Table
                aria-label="Table of Courses"
                sortDescriptor={sortDescriptor}
                onSortChange={handleSortChange}
                bottomContent={
                    totalPages > 0 ? (
                        <div className="flex w-full justify-center py-4">
                            <Pagination isCompact showControls showShadow color="primary" page={page} total={totalPages} onChange={handlePageChange} />
                        </div>
                    ) : null
                }
                classNames={{ wrapper: "min-h-[300px] border border-gray-200 rounded-lg shadow-sm", th: "bg-gray-100 text-gray-600 uppercase text-xs" }}
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key} allowsSorting={column.allowsSorting}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                    items={paginatedCourses}
                    isLoading={isLoadingCourses || isLoadingAnyMutation}
                    loadingContent={<Spinner label="Loading..." />}
                    emptyContent={!isLoadingCourses && sortedCourses.length === 0 ? "No courses found." : " "}
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Modals */}
            <CourseFormModal
                isOpen={isFormModalOpen}
                onClose={onFormModalClose}
                course={selectedCourse}
                onSubmit={handleCourseSubmit}
                isLoading={createCourseMutation.isLoading || updateCourseMutation.isLoading}
            />
            <AssignTeacherModal
                isOpen={isAssignModalOpen}
                onClose={onAssignModalClose}
                course={selectedCourse}
                allTeachers={allTeachersForAssignment}
                assignedTeacherIds={selectedCourse?.teachers?.map(t => t.id) || []}
                onAssign={handleAssignTeacherSubmit}
                isLoading={assignTeacherMutation.isLoading || isLoadingTeachers}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={onConfirmModalClose}
                onConfirm={executeConfirmAction}
                title={
                    confirmAction?.type === 'deleteCourse' ? "Delete Course?" :
                    confirmAction?.type === 'removeTeacher' ? "Remove Teacher from Course?" : "Confirm Action"
                }
                message={
                    confirmAction?.type === 'deleteCourse' ? `Are you sure you want to delete the course "${selectedCourse?.name || 'this course'}"? This action cannot be undone.` :
                    confirmAction?.type === 'removeTeacher' ? `Are you sure you want to remove teacher ${allTeachersForAssignment.find(t => t.teacherProfile.id === confirmAction?.data?.teacherId)?.fullName || ''} from ${selectedCourse?.name}?` :
                    "Please confirm this action."
                }
                confirmText={confirmAction?.type === 'deleteCourse' ? "Yes, Delete" : "Yes, Remove"}
                isLoading={isLoadingAnyMutation}
            />
        </div>
    );
};

export default CourseManagementPage;