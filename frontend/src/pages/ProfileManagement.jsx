import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { profileService } from '../api/profile.service';
import { toast } from 'sonner';
import {
    Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
    Pagination, Button, Input, Checkbox, 
    useDisclosure, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter,
    Spinner, Tooltip
} from '@heroui/react';
import {
    UserPlus, Edit, ShieldAlert, Search, UserCheck, Link2, Unlink2
} from 'lucide-react';

const CustomTabs = ({ tabs, activeTab, onTabChange }) => (
    <div className="mb-6 border-b border-gray-300">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => onTabChange(tab.key)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                        ${activeTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    {tab.label}
                </button>
            ))}
        </nav>
    </div>
);

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, isLoading, confirmText="Confirm", variant="danger" }) => {
    if (!isOpen) return null;
    const confirmButtonColor = variant === "danger" ? "danger" : "primary";
    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable={false} isKeyboardDismissDisabled={true} size="md">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <ShieldAlert className={`${variant === "danger" ? "text-red-500" : "text-blue-500"}`} size={24} />
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


// --- Profile Creation/Edit Modals ---

const StudentProfileModal = ({ isOpen, onClose, user, existingProfile, onSubmit, isLoading }) => {
    const initialStudentData = { gradeLevel: '', section: '', absentCount: 0, underProbation: false };
    const [profileData, setProfileData] = useState(initialStudentData);

    useEffect(() => {
        if (existingProfile) {
            setProfileData({
                gradeLevel: existingProfile.gradeLevel || '',
                section: existingProfile.section || '',
                absentCount: existingProfile.absentCount !== undefined ? existingProfile.absentCount : 0,
                underProbation: existingProfile.underProbation || false,
            });
        } else {
            setProfileData(initialStudentData);
        }
    }, [existingProfile, isOpen]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProfileData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = () => {
        onSubmit(user.id, profileData);
    };

    if (!isOpen || !user) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="lg" placement="top-center">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <UserPlus size={24} className="text-blue-600" />
                        {existingProfile ? 'Edit Student Profile' : 'Create Student Profile'} for {user.fullName}
                    </ModalHeader>
                    <ModalBody className="space-y-4 p-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Grade Level *</label>
                            <Input name="gradeLevel" type="number" value={profileData.gradeLevel} onChange={handleChange} disabled={isLoading} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Section</label>
                            <Input name="section" value={profileData.section} onChange={handleChange} disabled={isLoading} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Absent Count</label>
                            <Input name="absentCount" type="number" value={profileData.absentCount} onChange={handleChange} disabled={isLoading} />
                        </div>
                        <div className="flex items-center pt-2">
                            <Checkbox name="underProbation" isSelected={profileData.underProbation} onValueChange={(val) => setProfileData(p => ({...p, underProbation: val}))} disabled={isLoading}>
                                Under Probation
                            </Checkbox>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                            {isLoading ? (existingProfile ? "Saving..." : "Creating...") : (existingProfile ? "Save Changes" : "Create Profile")}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

const TeacherProfileModal = ({ isOpen, onClose, user, existingProfile, onSubmit, isLoading }) => {
    const initialTeacherData = { salary: '' };
    const [profileData, setProfileData] = useState(initialTeacherData);

    useEffect(() => {
        if (existingProfile) {
            setProfileData({ salary: existingProfile.salary !== null && existingProfile.salary !== undefined ? existingProfile.salary : '' });
        } else {
            setProfileData(initialTeacherData);
        }
    }, [existingProfile, isOpen]);

    const handleChange = (e) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = () => {
        const dataToSubmit = {
            salary: profileData.salary === '' ? null : Number(profileData.salary) // API expects number or null
        };
        onSubmit(user.id, dataToSubmit);
    };

    if (!isOpen || !user) return null;

    return (
        <Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} size="lg" placement="top-center">
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <UserPlus size={24} className="text-blue-600" />
                        {existingProfile ? 'Edit Teacher Profile' : 'Create Teacher Profile'} for {user.fullName}
                    </ModalHeader>
                    <ModalBody className="space-y-4 p-6">
                        <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">Salary</label>
                            <Input name="salary" type="number" placeholder="Enter salary (optional)" value={profileData.salary} onChange={handleChange} disabled={isLoading} />
                        </div>
                        {/* Add other teacher-specific fields here */}
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="flat" color="default" onPress={onClose} disabled={isLoading}>Cancel</Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                             {isLoading ? (existingProfile ? "Saving..." : "Creating...") : (existingProfile ? "Save Changes" : "Create Profile")}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};


// --- Main Profile Management Page ---
const ProfileManagementPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('STUDENT'); // 'STUDENT' or 'TEACHER'
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [showOnlyUsersWithoutProfile, setShowOnlyUsersWithoutProfile] = useState(false);

    // Modal states
    const { isOpen: isStudentModalOpen, onOpen: onStudentModalOpen, onClose: onStudentModalClose } = useDisclosure();
    const { isOpen: isTeacherModalOpen, onOpen: onTeacherModalOpen, onClose: onTeacherModalClose } = useDisclosure();
    const { isOpen: isConfirmModalOpen, onOpen: onConfirmModalOpen, onClose: onConfirmModalClose } = useDisclosure();

    const [selectedUser, setSelectedUser] = useState(null); // User for whom profile is being managed
    const [confirmAction, setConfirmAction] = useState(null); // { type: 'deleteStudent' | 'deleteTeacher', user }

    const tabs = [
        { key: 'STUDENT', label: 'Student Profiles' },
        { key: 'TEACHER', label: 'Teacher Profiles' },
    ];

    // Fetch ALL users. We will filter them on the client side.
    // Pass `true` to includeArchived because an admin might want to manage profiles for archived users.
    const { data: usersQuery, isLoading: isLoadingUsers, isError: isUsersError } = useQuery({
        queryKey: ['allUsersWithProfiles'], // Unique key
        queryFn: () => userService.getAllUsers(true), // Fetch all, including archived users
        staleTime: 1000 * 60 * 2, // Cache for 2 minutes
        onError: (error) => toast.error(error?.response?.data?.message || "Failed to load users."),
    });

    // --- Mutations for Profile Actions ---
    const profileMutationOptions = {
        onSuccess: (data) => {
            toast.success(data?.message || "Profile action successful!");
            queryClient.invalidateQueries(['allUsersWithProfiles']); // Refetch all users to update profile status
            onStudentModalClose();
            onTeacherModalClose();
            onConfirmModalClose();
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || "Profile action failed.");
        },
    };

    const createStudentProfileMutation = useMutation({ mutationFn: ({ userId, data }) => profileService.createStudentProfile(userId, data), ...profileMutationOptions });
    const updateStudentProfileMutation = useMutation({ mutationFn: ({ userId, data }) => profileService.updateStudentProfile(userId, data), ...profileMutationOptions });
    const deleteStudentProfileMutation = useMutation({ mutationFn: (userId) => profileService.deleteStudentProfile(userId), ...profileMutationOptions });

    const createTeacherProfileMutation = useMutation({ mutationFn: ({ userId, data }) => profileService.createTeacherProfile(userId, data), ...profileMutationOptions });
    const updateTeacherProfileMutation = useMutation({ mutationFn: ({ userId, data }) => profileService.updateTeacherProfile(userId, data), ...profileMutationOptions });
    const deleteTeacherProfileMutation = useMutation({ mutationFn: (userId) => profileService.deleteTeacherProfile(userId), ...profileMutationOptions });


    // --- Derived Data for Table ---
    const eligibleUsers = useMemo(() => {
        if (!usersQuery?.data) return [];
        return usersQuery.data.filter(user => {
            const roleMatch = user.role === activeTab;
            if (!roleMatch) return false;

            const hasProfile = activeTab === 'STUDENT' ? !!user.studentProfile : !!user.teacherProfile;
            if (showOnlyUsersWithoutProfile) {
                return !hasProfile;
            }
            // Further filter by searchTerm if needed (name, username, email)
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    user.fullName?.toLowerCase().includes(term) ||
                    user.username?.toLowerCase().includes(term) ||
                    user.email?.toLowerCase().includes(term)
                );
            }
            return true;
        });
    }, [usersQuery, activeTab, showOnlyUsersWithoutProfile, searchTerm]);

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return eligibleUsers.slice(start, end);
    }, [page, eligibleUsers, rowsPerPage]);

    const totalPages = Math.ceil(eligibleUsers.length / rowsPerPage);


    // --- Event Handlers ---
    const handleTabChange = (tabKey) => { setActiveTab(tabKey); setPage(1); setSearchTerm(''); setShowOnlyUsersWithoutProfile(false); };
    const handleSearchChange = (e) => { setSearchTerm(e.target.value); setPage(1); };

    const openProfileModal = (user) => {
        setSelectedUser(user);
        if (activeTab === 'STUDENT') {
            onStudentModalOpen();
        } else {
            onTeacherModalOpen();
        }
    };

    const handleProfileSubmit = (userId, data) => {
        const existingProfile = activeTab === 'STUDENT' ? selectedUser?.studentProfile : selectedUser?.teacherProfile;
        if (activeTab === 'STUDENT') {
            if (existingProfile) updateStudentProfileMutation.mutate({ userId, data });
            else createStudentProfileMutation.mutate({ userId, data });
        } else {
            if (existingProfile) updateTeacherProfileMutation.mutate({ userId, data });
            else createTeacherProfileMutation.mutate({ userId, data });
        }
    };

    const handleDeleteProfileConfirm = (user) => {
        setSelectedUser(user);
        setConfirmAction({ type: activeTab === 'STUDENT' ? 'deleteStudent' : 'deleteTeacher', user });
        onConfirmModalOpen();
    };

    const executeConfirmAction = () => {
        if (!confirmAction || !selectedUser) return;
        const { type, user } = confirmAction;
        if (type === 'deleteStudent') deleteStudentProfileMutation.mutate(user.id);
        else if (type === 'deleteTeacher') deleteTeacherProfileMutation.mutate(user.id);
    };

    // --- Table Columns & Rendering ---
    const columns = [
        { key: "fullName", label: "USER FULL NAME" },
        { key: "username", label: "USERNAME" },
        { key: "email", label: "EMAIL" },
        { key: "profileStatus", label: "PROFILE STATUS" },
        { key: "actions", label: "ACTIONS" },
    ];

    const renderCell = (user, columnKey) => {
        const cellValue = user[columnKey];
        const hasProfile = activeTab === 'STUDENT' ? !!user.studentProfile : !!user.teacherProfile;

        switch (columnKey) {
            case "profileStatus":
                return (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${hasProfile ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {hasProfile ? "Profiled" : "No Profile"}
                    </span>
                );
            case "actions":
                return (
                    <div className="flex items-center gap-2">
                        {hasProfile ? (
                            <>
                                <Tooltip content={`Edit ${activeTab.toLowerCase()} profile`} showArrow color="primary">
                                    <Button size="sm" variant="flat" color="primary" onPress={() => openProfileModal(user)} isIconOnly>
                                        <Edit size={16} />
                                    </Button>
                                </Tooltip>
                                <Tooltip content={`Delete ${activeTab.toLowerCase()} profile`} showArrow color="danger">
                                    <Button size="sm" variant="flat" color="danger" onPress={() => handleDeleteProfileConfirm(user)} isIconOnly>
                                        <Unlink2 size={16} /> {/* Icon for unlinking/deleting profile */}
                                    </Button>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip content={`Create ${activeTab.toLowerCase()} profile`} showArrow color="success">
                                <Button size="sm" variant="solid" color="success" onPress={() => openProfileModal(user)} startContent={<Link2 size={16}/>}>
                                    Create Profile
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                );
            default:
                return user[columnKey] || 'N/A';
        }
    };

    const isLoadingAnyMutation = createStudentProfileMutation.isLoading || updateStudentProfileMutation.isLoading || deleteStudentProfileMutation.isLoading ||
                                createTeacherProfileMutation.isLoading || updateTeacherProfileMutation.isLoading || deleteTeacherProfileMutation.isLoading;

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <UserCheck className="mr-3 text-blue-600" /> Profile Management
                </h1>
                <p className="text-gray-500">Associate users with their student or teacher profiles.</p>
            </header>

            <CustomTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-grow">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
                        <Input
                            placeholder="Search by name, username, email..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            startContent={<Search size={18} className="text-gray-400" />}
                            clearable
                            onClear={() => setSearchTerm('')}
                        />
                    </div>
                    <div className="pt-7"> {/* Aligns checkbox with inputs */}
                        <Checkbox
                            isSelected={showOnlyUsersWithoutProfile}
                            onValueChange={setShowOnlyUsersWithoutProfile}
                        >
                            Show only users needing a profile
                        </Checkbox>
                    </div>
                </div>
            </div>

            {isUsersError && <p className="text-red-500 text-center py-4">Error loading user data. Please try again.</p>}

            <Table
                aria-label={`Table of users for ${activeTab.toLowerCase()} profiles`}
                bottomContent={
                    totalPages > 0 ? (
                        <div className="flex w-full justify-center py-4">
                            <Pagination isCompact showControls showShadow color="primary" page={page} total={totalPages} onChange={setPage} />
                        </div>
                    ) : null
                }
                classNames={{ wrapper: "min-h-[300px] border border-gray-200 rounded-lg shadow-sm", th: "bg-gray-100 text-gray-600 uppercase text-xs" }}
            >
                <TableHeader columns={columns}>
                    {(column) => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody
                    items={paginatedUsers}
                    isLoading={isLoadingUsers || isLoadingAnyMutation}
                    loadingContent={<Spinner label="Loading..." />}
                    emptyContent={!isLoadingUsers && eligibleUsers.length === 0 ? "No users to display for this category." : " "}
                >
                    {(item) => (
                        <TableRow key={item.id}>
                            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Modals */}
            <StudentProfileModal
                isOpen={isStudentModalOpen}
                onClose={onStudentModalClose}
                user={selectedUser}
                existingProfile={selectedUser?.studentProfile}
                onSubmit={handleProfileSubmit}
                isLoading={createStudentProfileMutation.isLoading || updateStudentProfileMutation.isLoading}
            />
            <TeacherProfileModal
                isOpen={isTeacherModalOpen}
                onClose={onTeacherModalClose}
                user={selectedUser}
                existingProfile={selectedUser?.teacherProfile}
                onSubmit={handleProfileSubmit}
                isLoading={createTeacherProfileMutation.isLoading || updateTeacherProfileMutation.isLoading}
            />
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={onConfirmModalClose}
                onConfirm={executeConfirmAction}
                title={`Delete ${activeTab} Profile?`}
                message={`Are you sure you want to delete the ${activeTab.toLowerCase()} profile for ${selectedUser?.fullName}? This will remove their role-specific data.`}
                isLoading={deleteStudentProfileMutation.isLoading || deleteTeacherProfileMutation.isLoading}
            />
        </div>
    );
};

export default ProfileManagementPage;