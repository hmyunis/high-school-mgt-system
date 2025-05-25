import React, { useState } from 'react';
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
} from '@heroui/react';
import { PlusCircle } from 'lucide-react';

const AddUserModal = ({ isOpen, onClose, onUserAdded, isLoading }) => {
    const initialFormState = {
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'STUDENT',
        phone: '',
        gender: '',
        dateOfBirth: null,
        isActive: true,
    };
    const [formData, setFormData] = useState(initialFormState);

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

    const handleSubmit = () => {
        const dataToSubmit = {
            ...formData,
            dateOfBirth: formData.dateOfBirth ? formData.dateOfBirth.toString() : null,
        };
        onUserAdded(dataToSubmit, formData.password);
    };

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            size="2xl"
            placement="top-center"
        >
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        <PlusCircle size={24} className="text-blue-600" /> Add New User
                    </ModalHeader>
                    <ModalBody className="max-h-[70vh] overflow-y-auto space-y-4 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Full Name *
                                </label>
                                <Input
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Username *
                                </label>
                                <Input
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Email *
                                </label>
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Password *
                                </label>
                                <Input
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isLoading}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1">
                                    Phone
                                </label>
                                <Input
                                    name="phone"
                                    value={formData.phone}
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
                                    disabled={isLoading}
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
                                    Role *
                                </label>
                                <Select
                                    selectedKeys={formData.role ? [formData.role] : []}
                                    onSelectionChange={(keys) =>
                                        handleSelectChange('role', Array.from(keys)[0])
                                    }
                                    className="w-full"
                                    disabled={isLoading}
                                    required
                                >
                                    <SelectItem key="STUDENT" value="STUDENT">
                                        Student
                                    </SelectItem>
                                    <SelectItem key="TEACHER" value="TEACHER">
                                        Teacher
                                    </SelectItem>
                                    <SelectItem key="ADMIN" value="ADMIN">
                                        Admin
                                    </SelectItem>
                                </Select>
                            </div>
                            <div className="flex items-center pt-7 md:col-span-2">
                                <Checkbox
                                    name="isActive"
                                    radius="sm"
                                    isSelected={formData.isActive}
                                    onValueChange={(isSelected) =>
                                        handleSelectChange('isActive', isSelected)
                                    }
                                    disabled={isLoading}
                                >
                                    Set user as active
                                </Checkbox>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            color="default"
                            onPress={() => {
                                setFormData(initialFormState);
                                onClose();
                            }}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button color="primary" onPress={handleSubmit} isLoading={isLoading}>
                            {isLoading ? 'Creating...' : 'Create User'}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

export default AddUserModal;
