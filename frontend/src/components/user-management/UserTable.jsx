import React from 'react';
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Pagination,
    Button,
    Spinner,
    Tooltip,
} from '@heroui/react';
import { Edit3, Trash2, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatDate } from '../../lib/dateUtils';

const UserTable = ({
    users,
    columns,
    isLoading,
    sortDescriptor,
    onSortChange,
    page,
    totalPages,
    onPageChange,
    onEditUser,
    onConfirmAction,
    activeTab,
}) => {
    const renderCellContent = (user, columnKey) => {
        const cellValue = user[columnKey];
        switch (columnKey) {
            case 'isActive':
                return (
                    <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                );
            case 'createdAt':
                return formatDate(cellValue);
            case 'actions':
                return (
                    <div className="flex items-center gap-1.5">
                        <Tooltip content="Edit User Details" showArrow color="primary">
                            <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                onPress={() => onEditUser(user)}
                                isIconOnly
                            >
                                <Edit3 size={16} />
                            </Button>
                        </Tooltip>
                        {user.isArchived ? (
                            <Tooltip content="Restore User" showArrow color="success">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="success"
                                    onPress={() => onConfirmAction('restore', user)}
                                    isIconOnly
                                >
                                    <RotateCcw size={16} />
                                </Button>
                            </Tooltip>
                        ) : (
                            <Tooltip content="Archive User (Soft Delete)" showArrow color="warning">
                                <Button
                                    size="sm"
                                    variant="flat"
                                    color="warning"
                                    onPress={() => onConfirmAction('archive', user)}
                                    isIconOnly
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </Tooltip>
                        )}
                        {!user.isArchived &&
                            (user.isActive ? (
                                <Tooltip content="Deactivate User" showArrow color="danger">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="danger"
                                        onPress={() => onConfirmAction('deactivate', user)}
                                        isIconOnly
                                    >
                                        <ShieldAlert size={16} />
                                    </Button>
                                </Tooltip>
                            ) : (
                                <Tooltip content="Activate User" showArrow color="success">
                                    <Button
                                        size="sm"
                                        variant="flat"
                                        color="success"
                                        onPress={() => onConfirmAction('activate', user)}
                                        isIconOnly
                                    >
                                        <ShieldCheck size={16} />
                                    </Button>
                                </Tooltip>
                            ))}
                        {user.isArchived && (
                            <Tooltip content="Delete Permanently" showArrow color="danger">
                                <Button
                                    size="sm"
                                    variant="solid"
                                    color="danger"
                                    onPress={() => onConfirmAction('permanentDelete', user)}
                                    isIconOnly
                                >
                                    <Trash2 className="text-white" size={16} />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                );
            default:
                return cellValue;
        }
    };

    return (
        <Table
            aria-label={`Table of ${activeTab.toLowerCase()}s`}
            sortDescriptor={sortDescriptor}
            onSortChange={onSortChange}
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
                            onChange={(p) => onPageChange(p)}
                        />
                    </div>
                ) : null
            }
            classNames={{
                wrapper: 'min-h-[300px] border border-gray-200 rounded-lg shadow-sm',
                th: 'bg-gray-100 text-gray-600 uppercase text-xs',
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
                items={users}
                isLoading={isLoading}
                loadingContent={<Spinner label="Loading data..." />}
                emptyContent={
                    !isLoading && users.length === 0
                        ? 'No users found matching your criteria.'
                        : ' '
                }
            >
                {(item) => (
                    <TableRow key={item.id}>
                        {(columnKey) => <TableCell>{renderCellContent(item, columnKey)}</TableCell>}
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
};

export default UserTable;
