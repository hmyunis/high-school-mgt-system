import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../api/user.service';
import { toast } from 'sonner';
import { Button, useDisclosure } from '@heroui/react';
import { Users, PlusCircle } from 'lucide-react';

import CustomTabs from '../components/user-management/CustomTabs';
import UserFilters from '../components/user-management/UserFilters';
import UserTable from '../components/user-management/UserTable';
import EditUserModal from '../components/user-management/EditUserModal';
import AddUserModal from '../components/user-management/AddUserModal';
import CredentialsDisplayModal from '../components/user-management/CredentialsDisplayModal';
import ConfirmationModal from '../components/user-management/ConfirmationModal';

const UserManagementPage = () => {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('ADMIN');
    const [page, setPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        includeArchived: false,
        isActive: 'all',
        gender: 'all',
    });
    const [sortDescriptor, setSortDescriptor] = useState({
        column: 'fullName',
        direction: 'ascending',
    });

    // Modal states and handlers
    const {
        isOpen: isEditModalOpen,
        onOpen: onEditModalOpen,
        onClose: onEditModalClose,
    } = useDisclosure();
    const {
        isOpen: isConfirmModalOpen,
        onOpen: onConfirmModalOpen,
        onClose: onConfirmModalClose,
    } = useDisclosure();
    const {
        isOpen: isAddUserModalOpen,
        onOpen: onAddUserModalOpen,
        onClose: onAddUserModalClose,
    } = useDisclosure();
    const {
        isOpen: isCredentialsModalOpen,
        onOpen: onCredentialsModalOpen,
        onClose: onCredentialsModalClose,
    } = useDisclosure();

    const [selectedUser, setSelectedUser] = useState(null); // For edit/confirm
    const [confirmAction, setConfirmAction] = useState(null); // { type, user } for confirmation
    const [newUserCredentials, setNewUserCredentials] = useState(null); // { username, password }

    const tabs = [
        { key: 'ADMIN', label: 'Admins' },
        { key: 'TEACHER', label: 'Teachers' },
        { key: 'STUDENT', label: 'Students' },
    ];

    // --- Data Fetching ---
    const {
        data: usersData,
        isLoading: isLoadingUsersInitial,
        isError: isUsersError,
    } = useQuery({
        queryKey: ['users', filters.includeArchived],
        queryFn: () => userService.getAllUsers(filters.includeArchived),
        staleTime: 1000 * 60 * 1, // 1 minute
        onError: (error) => toast.error(error?.response?.data?.message || 'Failed to load users.'),
    });

    // --- Mutations ---
    const commonMutationOptions = (closeModalsOnSuccess = true) => ({
        onSuccess: (data) => {
            toast.success(data?.message || 'Action successful!');
            queryClient.invalidateQueries({ queryKey: ['users', filters.includeArchived] });
            if (closeModalsOnSuccess) {
                onConfirmModalClose();
                onEditModalClose(); // Also close edit modal if action originated there
            }
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Action failed.');
            if (closeModalsOnSuccess) {
                onConfirmModalClose();
            }
        },
    });

    const createUserMutation = useMutation({
        mutationFn: (userData) => userService.createUser(userData),
        onSuccess: (data, variables) => {
            toast.success(data?.message || 'User created successfully!');
            queryClient.invalidateQueries({ queryKey: ['users', filters.includeArchived] });
            onAddUserModalClose();
            setNewUserCredentials({
                username: data.data.username,
                password: variables.originalPassword,
            });
            onCredentialsModalOpen();
        },
        onError: (error) => toast.error(error?.response?.data?.message || 'Failed to create user.'),
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ userId, data }) => userService.updateUser(userId, data),
        ...commonMutationOptions(),
    });
    const archiveUserMutation = useMutation({
        mutationFn: (userId) => userService.archiveUser(userId),
        ...commonMutationOptions(),
    });
    const restoreUserMutation = useMutation({
        mutationFn: (userId) => userService.restoreUser(userId),
        ...commonMutationOptions(),
    });
    const permanentDeleteUserMutation = useMutation({
        mutationFn: (userId) => userService.permanentDeleteUser(userId),
        ...commonMutationOptions(),
    });
    const toggleUserActiveMutation = useMutation({
        mutationFn: ({ userId, isActive }) => userService.updateUser(userId, { isActive }), // Uses updateUser
        ...commonMutationOptions(),
    });

    // --- Data Processing for Table ---
    const filteredUsersByRole = useMemo(() => {
        if (!usersData?.data) return [];
        return usersData.data.filter((user) => user.role === activeTab);
    }, [usersData, activeTab]);

    const furtherFilteredUsers = useMemo(() => {
        return filteredUsersByRole
            .filter((user) => {
                if (filters.isActive === 'all') return true;
                return user.isActive === (filters.isActive === 'true');
            })
            .filter((user) => {
                if (filters.gender === 'all') return true;
                return user.gender === filters.gender;
            })
            .filter((user) => {
                const term = searchTerm.toLowerCase();
                return (
                    user.fullName?.toLowerCase().includes(term) ||
                    user.username?.toLowerCase().includes(term) ||
                    user.email?.toLowerCase().includes(term)
                );
            });
    }, [filteredUsersByRole, filters, searchTerm]);

    const sortedUsers = useMemo(() => {
        return [...furtherFilteredUsers].sort((a, b) => {
            const first = a[sortDescriptor.column];
            const second = b[sortDescriptor.column];
            let cmp = first < second ? -1 : first > second ? 1 : 0;
            if (sortDescriptor.direction === 'descending') cmp *= -1;
            return cmp;
        });
    }, [furtherFilteredUsers, sortDescriptor]);

    const paginatedUsers = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return sortedUsers.slice(start, end);
    }, [page, sortedUsers, rowsPerPage]);

    const totalPages = Math.ceil(sortedUsers.length / rowsPerPage);
    const isLoadingMutations =
        createUserMutation.isLoading ||
        updateUserMutation.isLoading ||
        archiveUserMutation.isLoading ||
        restoreUserMutation.isLoading ||
        permanentDeleteUserMutation.isLoading ||
        toggleUserActiveMutation.isLoading;

    // --- Event Handlers ---
    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setPage(1); // Reset page when tab changes
    };
    const handleFilterChange = (filterName, value) => {
        setFilters((prev) => ({ ...prev, [filterName]: value }));
        setPage(1);
    };
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };
    const handleSortChange = (descriptor) => {
        setSortDescriptor(descriptor);
        setPage(1);
    };
    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        onEditModalOpen();
    };
    const handleSaveUserUpdate = (userId, data) => {
        updateUserMutation.mutate({ userId, data });
    };
    const handleUserAdded = (userData, plainPassword) => {
        createUserMutation.mutate({ ...userData, originalPassword: plainPassword });
    };

    const handleConfirmAction = (type, user) => {
        setSelectedUser(user);
        setConfirmAction({ type, user });
        onConfirmModalOpen();
    };
    const executeConfirmAction = () => {
        if (!confirmAction || !selectedUser) return;
        const { type, user } = confirmAction;
        const actions = {
            archive: () => archiveUserMutation.mutate(user.id),
            restore: () => restoreUserMutation.mutate(user.id),
            deactivate: () => toggleUserActiveMutation.mutate({ userId: user.id, isActive: false }),
            activate: () => toggleUserActiveMutation.mutate({ userId: user.id, isActive: true }),
            permanentDelete: () => permanentDeleteUserMutation.mutate(user.id),
        };
        actions[type]?.();
    };

    const tableColumns = [
        { key: 'fullName', label: 'FULL NAME', allowsSorting: true },
        { key: 'username', label: 'USERNAME', allowsSorting: true },
        { key: 'email', label: 'EMAIL', allowsSorting: true },
        { key: 'isActive', label: 'STATUS', allowsSorting: true },
        { key: 'gender', label: 'GENDER', allowsSorting: true },
        { key: 'createdAt', label: 'JOINED', allowsSorting: true },
        { key: 'actions', label: 'ACTIONS' },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                    <Users className="mr-3 text-blue-600" /> User Management
                </h1>
                <p className="text-gray-500">Manage administrators, teachers, and students.</p>
            </header>

            <CustomTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

            <UserFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                searchTerm={searchTerm}
                onSearchChange={handleSearchChange}
            />

            <div className="mb-4 flex justify-end">
                <Button
                    color="primary"
                    startContent={<PlusCircle size={18} />}
                    onPress={onAddUserModalOpen}
                >
                    Add New User
                </Button>
            </div>

            {isUsersError && (
                <p className="text-red-500 text-center py-4">
                    Error loading users. Please try again.
                </p>
            )}

            <UserTable
                users={paginatedUsers}
                columns={tableColumns}
                isLoading={isLoadingUsersInitial || isLoadingMutations} // Show loading for initial fetch or during mutations
                sortDescriptor={sortDescriptor}
                onSortChange={handleSortChange}
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                onEditUser={handleEditUser}
                onConfirmAction={handleConfirmAction}
                activeTab={activeTab}
            />

            {/* Modals */}
            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={onEditModalClose}
                user={selectedUser}
                onSave={handleSaveUserUpdate}
                isLoading={updateUserMutation.isLoading}
            />
            <AddUserModal
                isOpen={isAddUserModalOpen}
                onClose={onAddUserModalClose}
                onUserAdded={handleUserAdded}
                isLoading={createUserMutation.isLoading}
            />
            {newUserCredentials && (
                <CredentialsDisplayModal
                    isOpen={isCredentialsModalOpen}
                    onClose={() => {
                        setNewUserCredentials(null);
                        onCredentialsModalClose();
                    }}
                    username={newUserCredentials.username}
                    password={newUserCredentials.password}
                />
            )}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={onConfirmModalClose}
                onConfirm={executeConfirmAction}
                title={
                    confirmAction?.type === 'permanentDelete'
                        ? 'Permanently Delete User?'
                        : confirmAction?.type === 'archive'
                        ? 'Archive User?'
                        : confirmAction?.type === 'restore'
                        ? 'Restore User?'
                        : confirmAction?.type === 'deactivate'
                        ? 'Deactivate User?'
                        : confirmAction?.type === 'activate'
                        ? 'Activate User?'
                        : 'Confirm Action'
                }
                message={
                    `Are you sure you want to ${confirmAction?.type
                        .replace(/([A-Z])/g, ' $1')
                        .toLowerCase()} ${selectedUser?.fullName || 'this user'}? ` +
                    (confirmAction?.type === 'permanentDelete'
                        ? 'This action cannot be undone.'
                        : confirmAction?.type === 'archive'
                        ? 'This user will be moved to the trash bin.'
                        : '')
                }
                confirmText={
                    confirmAction?.type === 'permanentDelete'
                        ? 'Yes, Delete Permanently'
                        : confirmAction?.type === 'archive'
                        ? 'Yes, Archive'
                        : confirmAction?.type === 'restore'
                        ? 'Yes, Restore'
                        : confirmAction?.type === 'deactivate'
                        ? 'Yes, Deactivate'
                        : confirmAction?.type === 'activate'
                        ? 'Yes, Activate'
                        : 'Confirm'
                }
                isLoading={isLoadingMutations}
                variant={
                    confirmAction?.type === 'permanentDelete' ||
                    confirmAction?.type === 'archive' ||
                    confirmAction?.type === 'deactivate'
                        ? 'danger'
                        : 'primary'
                }
            />
        </div>
    );
};

export default UserManagementPage;
