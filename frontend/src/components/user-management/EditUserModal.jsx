import React, { useState, useEffect, useRef } from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Input,
    Checkbox,
    Select,
    SelectItem,
    DatePicker,
    useDraggable,
} from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { UserCog } from 'lucide-react';

const EditUserModal = ({ isOpen, onClose, user, onSave, isLoading }) => {
    const targetRef = useRef(null);
    const { moveProps } = useDraggable({ targetRef, canOverflow: true, isDisabled: !isOpen });
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        role: '',
        gender: '',
        isActive: true,
        dateOfBirth: null,
    });

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || '',
                gender: user.gender || '',
                isActive: user.isActive === undefined ? true : user.isActive,
                dateOfBirth: user.dateOfBirth ? parseDate(user.dateOfBirth) : null,
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleSelectChange = (name, value) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };
    const handleDateChange = (calendarDate) => {
        setFormData((prev) => ({ ...prev, dateOfBirth: calendarDate }));
    };

    const handleSave = () => {
        const dataToSubmit = {
            ...formData,
            dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toString() : null,
        };
        onSave(user.id, dataToSubmit);
    };

    if (!isOpen || !user) return null;

    return (
        <Modal
            ref={targetRef}
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            size="2xl"
            placement="top-center"
        >
            <ModalContent>
                <>
                    <ModalHeader {...moveProps} className="flex items-center gap-2 cursor-move">
                        <UserCog size={24} className="text-blue-600" /> Edit User: {user.fullName}
                    </ModalHeader>
                    <ModalBody className="max-h-[70vh] overflow-y-auto space-y-4 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Full Name
                                </label>
                                <Input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Username
                                </label>
                                <Input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Email
                                </label>
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Phone
                                </label>
                                <Input
                                    name="phone"
                                    value={formData.phone || ''}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Date of Birth
                                </label>
                                <DatePicker
                                    value={formData.dateOfBirth}
                                    onChange={handleDateChange}
                                    className="w-full"
                                    granularity="day"
                                    isDisabled={isLoading}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Gender
                                </label>
                                <Select
                                    selectedKeys={formData.gender ? [formData.gender] : []}
                                    onSelectionChange={(keys) =>
                                        handleSelectChange('gender', Array.from(keys)[0])
                                    }
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    <SelectItem key="MALE" value="MALE">
                                        Male
                                    </SelectItem>
                                    <SelectItem key="FEMALE" value="FEMALE">
                                        Female
                                    </SelectItem>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Role
                                </label>
                                <Select
                                    selectedKeys={formData.role ? [formData.role] : []}
                                    onSelectionChange={(keys) =>
                                        handleSelectChange('role', Array.from(keys)[0])
                                    }
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    <SelectItem key="ADMIN" value="ADMIN">
                                        Admin
                                    </SelectItem>
                                    <SelectItem key="TEACHER" value="TEACHER">
                                        Teacher
                                    </SelectItem>
                                    <SelectItem key="STUDENT" value="STUDENT">
                                        Student
                                    </SelectItem>
                                </Select>
                            </div>
                            <div className="flex items-center pt-7">
                                <Checkbox
                                    name="isActive"
                                    radius="sm"
                                    isSelected={formData.isActive}
                                    onValueChange={(isSelected) =>
                                        handleSelectChange('isActive', isSelected)
                                    }
                                    disabled={isLoading}
                                >
                                    Active User
                                </Checkbox>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            color="default"
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSave} isLoading={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

export default EditUserModal;
