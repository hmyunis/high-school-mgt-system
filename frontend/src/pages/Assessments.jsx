// src/pages/teacher/AssessmentsPage.jsx (Example path)
import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // For getting courseId from URL and navigation
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assessmentService } from '../api/assessment.service'; // Adjust path
import { courseService } from '../api/course.service'; // To fetch course details
import { toast } from 'sonner';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Pagination, Button, Input, // Assuming Input for form, can be HeroUI Input
    useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Spinner, Tooltip, Chip
} from '@heroui/react'; // Adjust HeroUI imports
import { ClipboardList, PlusCircle, Edit3, Trash2, ArrowLeft, Eye, ShieldAlert, Percent, AlertTriangle, Search } from 'lucide-react';
import { formatDate } from '../lib/dateUtils'; // Adjust path

// Reusable ConfirmationModal (assuming it's in shared components)
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading, confirmText = "Confirm", variant = "danger" }) => {
    if (!isOpen) return null;
    const confirmButtonColor = variant === "danger" ? "danger" : "primary";
    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={false} isKeyboardDismissDisabled={true} size="md">
            <ModalContent>
                <> <ModalHeader className="flex items-center gap-2"> <ShieldAlert className={`${variant === "danger" ? "text-red-500" : "text-blue-500"}`} size={24} /> {title} </ModalHeader> <ModalBody><p className="text-gray-600">{message}</p></ModalBody> <ModalFooter> <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button> <Button color={confirmButtonColor} onPress={onConfirm} isLoading={isLoading}> {isLoading ? "Processing..." : confirmText} </Button> </ModalFooter> </>
            </ModalContent>
        </Modal>
    );
};

// Assessment Form Modal (for Create and Edit)
const AssessmentFormModal = ({ isOpen, onClose, assessment, courseId, onSubmit, isLoading }) => {
    const isEditMode = !!assessment;
    const [formData, setFormData] = useState({ name: '', weight: '' }); // Add other fields: dueDate, maxScore

    useEffect(() => {
        if (isEditMode && assessment) {
            setFormData({
                name: assessment.name || '',
                weight: assessment.weight !== null ? assessment.weight.toString() : '', // API might send decimal as string or number
                // dueDate: assessment.dueDate || '',
                // maxScore: assessment.maxScore || '',
            });
        } else {
            setFormData({ name: '', weight: '' /*, dueDate: '', maxScore: '' */ });
        }
    }, [assessment, isEditMode, isOpen]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = () => {
        const dataToSubmit = {
            ...formData,
            weight: parseFloat(formData.weight) // Ensure weight is a number
        };
        if (isNaN(dataToSubmit.weight) || dataToSubmit.weight < 0 || dataToSubmit.weight > 100) {
            toast.error("Weight must be a number between 0 and 100.");
            return;
        }
        onSubmit(dataToSubmit);
    };

    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="lg" placement="top-center">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        {isEditMode ? <Edit3 size={24} className="text-blue-600" /> : <PlusCircle size={24} className="text-blue-600" />}
                        {isEditMode ? 'Edit Assessment' : 'Create New Assessment'}
                    </ModalHeader>
                    <ModalBody className="space-y-4 p-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Assessment Name *</label>
                            <Input name="name" placeholder="e.g., Midterm Exam, Homework 1" value={formData.name} onChange={handleChange} disabled={isLoading} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Weight (% in course grade) *</label>
                            <Input name="weight" type="number" placeholder="e.g., 20 for 20%" value={formData.weight} onChange={handleChange} disabled={isLoading} required min="0" max="100" step="0.01" />
                        </div>
                        {/* Add fields for dueDate (DatePicker), maxScore (Input type=number) if needed */}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                            {isLoading ? (isEditMode ? "Saving..." : "Creating...") : (isEditMode ? "Save Changes" : "Create Assessment")}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};


const TeacherAssessmentsPage = () => {
    const { courseId } = useParams(); // Get courseId from URL
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    // Client-side search for assessments, as list might not be excessively long for one course
    const [searchTerm, setSearchTerm] = useState('');
    const [sortDescriptor, setSortDescriptor] = useState({ column: 'name', direction: 'ascending' });

    // Modal states
    const { isOpen: isFormModalOpen, onOpen: onFormModalOpen, onClose: onFormModalClose } = useDisclosure();
    const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();

    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'deleteAssessment', data: assessmentId }

    // Fetch Course Details (to display course name, etc.)
    const { data: courseDetails, isLoading: isLoadingCourseDetails } = useQuery({
        queryKey: ['courseDetailsForAssessments', courseId],
        queryFn: () => courseService.getCourseById(courseId), // Assuming admin/teacher can get course by ID
        enabled: !!courseId,
        select: (response) => response?.data,
        onError: (error) => toast.error("Failed to load course details."),
    });

    // Fetch Assessments for the current course
    const {
        data: assessmentsQueryData,
        isLoading: isLoadingAssessments,
        isError: isAssessmentsError,
        error: assessmentsErrorData,
    } = useQuery({
        queryKey: ['assessmentsForCourse', courseId],
        queryFn: () => assessmentService.getAssessmentsForCourse(courseId),
        enabled: !!courseId,
        staleTime: 1000 * 60 * 1, // Cache for 1 minute
        select: (response) => response?.data || [],
    });
    const assessments = useMemo(() => assessmentsQueryData || [], [assessmentsQueryData]);


    // --- Mutations ---
    const commonMutationOptions = {
        onSuccess: (data) => {
            toast.success(data?.message || "Action successful!");
            queryClient.invalidateQueries({ queryKey: ['assessmentsForCourse', courseId] });
            onFormModalClose();
            onConfirmModalClose();
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Action failed.");
        },
    };

    const createAssessmentMutation = useMutation({
        mutationFn: (assessmentData) => assessmentService.createAssessment(courseId, assessmentData),
        ...commonMutationOptions
    });
    const updateAssessmentMutation = useMutation({
        mutationFn: ({ assessmentId, data }) => assessmentService.updateAssessment(assessmentId, data),
        ...commonMutationOptions
    });
    const deleteAssessmentMutation = useMutation({
        mutationFn: (assessmentId) => assessmentService.deleteAssessment(assessmentId),
        ...commonMutationOptions
    });


    // --- Data Processing for Table (Client-side for assessments of one course) ---
    const filteredAssessments = useMemo(() => {
        if (!assessments) return [];
        let localAssessments = assessments;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            localAssessments = localAssessments.filter(asm => asm.name?.toLowerCase().includes(term));
        }
        return localAssessments;
    }, [assessments, searchTerm]);

    const sortedAssessments = useMemo(() => {
        return [...filteredAssessments].sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            let cmp = (first < second) ? -1 : (first > second) ? 1 : 0;
            if (sortDescriptor.direction === "descending") cmp *= -1;
            return cmp;
        });
    }, [filteredAssessments, sortDescriptor]);

    const paginatedAssessments = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedAssessments.slice(start, end);
    }, [page, sortedAssessments, rowsPerPage]);

    const totalPages = Math.ceil(sortedAssessments.length / rowsPerPage);
    const isLoadingAnyMutation = createAssessmentMutation.isLoading || updateAssessmentMutation.isLoading || deleteAssessmentMutation.isLoading;


    // --- Event Handlers ---
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };
    const handleSortChange = (descriptor) => { setSortDescriptor(descriptor); setPage(1); };
    const handlePageChange = (newPage) => setPage(newPage);

    const openCreateModal = () => { setSelectedAssessment(null); onFormModalOpen(); };
    const openEditModal = (assessment) => { setSelectedAssessment(assessment); onFormModalOpen(); };

    const handleAssessmentSubmit = (formData) => {
        if (selectedAssessment?.id) { // Edit mode
            updateAssessmentMutation.mutate({ assessmentId: selectedAssessment.id, data: formData });
        } else { // Create mode
            createAssessmentMutation.mutate(formData);
        }
    };

    const prepareDeleteConfirm = (assessment) => {
        setSelectedAssessment(assessment);
        setConfirmAction({ type: 'deleteAssessment', data: assessment.id });
        onConfirmModalOpen();
    };

    const executeConfirmAction = () => {
        if (!confirmAction) return;
        if (confirmAction.type === 'deleteAssessment') {
            deleteAssessmentMutation.mutate(confirmAction.data); // data is assessmentId
        }
    };

    // --- Table Columns & Rendering ---
    const columns = [
        { key: "name", label: "ASSESSMENT NAME", allowsSorting: true },
        { key: "weight", label: "WEIGHT (%)", allowsSorting: true },
        { key: "author", label: "AUTHOR" },
        // { key: "dueDate", label: "DUE DATE", allowsSorting: true },
        // { key: "maxScore", label: "MAX SCORE", allowsSorting: true },
        { key: "createdAt", label: "CREATED", allowsSorting: true },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (assessment, columnKey) => {
        const cellValue = assessment[columnKey];
        switch (columnKey) {
            case "weight":
                return `${parseFloat(cellValue).toFixed(2)}%`;
            case "author":
                return assessment.author?.user?.fullName || 'N/A';
            // case "dueDate":
            //     return assessment.dueDate ? formatDate(assessment.dueDate) : 'N/A';
            case "createdAt":
                return formatDate(cellValue);
            case "actions":
                return (
                    <div className="flex items-center gap-1.5">
                        <Tooltip content="Manage Scores / View Details" showArrow color="primary">
                             {/* Teacher would navigate to a page to manage scores for this assessment */}
                            <Link to={`/dashboard/assessments/${assessment.id}/courses/${courseId}/scores`}>
                                <Button size="sm" variant="flat" color="primary" isIconOnly><Eye size={16} /></Button>
                            </Link>
                        </Tooltip>
                        <Tooltip content="Edit Assessment" showArrow color="secondary">
                            <Button size="sm" variant="flat" color="secondary" onPress={() => openEditModal(assessment)} isIconOnly><Edit3 size={16} /></Button>
                        </Tooltip>
                        <Tooltip content="Delete Assessment" showArrow color="danger">
                            <Button size="sm" variant="flat" color="danger" onPress={() => prepareDeleteConfirm(assessment)} isIconOnly><Trash2 size={16} /></Button>
                        </Tooltip>
                    </div>
                );
            default:
                return cellValue;
        }
    };

    if (isLoadingCourseDetails) {
        return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Spinner label="Loading course details..." size="lg"/></div>;
    }
    if (!courseDetails ) { // Course not found or error already shown by courseDetails query
         return (
            <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-red-600 px-4">
                <AlertTriangle size={48} className="mb-4" />
                <p className="text-xl text-center font-semibold">Course Not Found</p>
                <p className="text-center">The specified course (ID: {courseId}) could not be found.</p>
                <Button color="primary" variant="light" onPress={() => navigate('/dashboard/my-courses')} className="mt-4">
                    <ArrowLeft size={16} className="mr-2"/> Back to My Courses
                </Button>
            </div>
        );
    }


    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <Button variant="light" onPress={() => navigate('/dashboard/my-courses')} className="mb-2 text-blue-600 hover:text-blue-800">
                            <ArrowLeft size={18} className="mr-2"/> Back to My Courses
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                            <ClipboardList className="mr-3 text-blue-600" />
                            Assessments for: <span className="text-blue-700 ml-2">{courseDetails?.name}</span>
                        </h1>
                        <p className="text-gray-500">Manage quizzes, exams, and assignments for this course ({courseDetails?.code}).</p>
                    </div>
                    <Button color="primary" startContent={<PlusCircle size={18} />} onPress={openCreateModal}>
                        Add New Assessment
                    </Button>
                </div>
            </header>

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="max-w-md">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Assessments</label>
                    <Input
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        startContent={<Search size={18} className="text-gray-400" />}
                        clearable
                        onClear={() => setSearchTerm('')}
                    />
                </div>
            </div>

            {isAssessmentsError && <p className="text-red-500 text-center py-4">Error loading assessments: {assessmentsErrorData?.response?.data?.message}</p>}

            <Table
                aria-label={`Table of Assessments for ${courseDetails?.name}`}
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
                    items={paginatedAssessments}
                    isLoading={isLoadingAssessments || isLoadingAnyMutation}
                    loadingContent={<Spinner label="Loading..." />}
                    emptyContent={
                        isLoadingAssessments ? " " :
                        assessments.length === 0 ? "No assessments created for this course yet." :
                        paginatedAssessments.length === 0 ? "No assessments match your search." : "No assessments to display."
                    }
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Modals */}
            <AssessmentFormModal
                isOpen={isFormModalOpen}
                onClose={onFormModalClose}
                assessment={selectedAssessment}
                courseId={courseId} // Pass courseId for context if needed by form/submit
                onSubmit={handleAssessmentSubmit}
                isLoading={createAssessmentMutation.isLoading || updateAssessmentMutation.isLoading}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={onConfirmModalClose}
                onConfirm={executeConfirmAction}
                title="Delete Assessment?"
                message={`Are you sure you want to delete the assessment "${selectedAssessment?.name || 'this assessment'}"? This will also remove all associated student scores and cannot be undone.`}
                confirmText="Yes, Delete Assessment"
                isLoading={deleteAssessmentMutation.isLoading}
            />
        </div>
    );
};

export default TeacherAssessmentsPage;