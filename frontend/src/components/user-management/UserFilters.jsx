import React from 'react';
import { Input, Select, SelectItem, Checkbox } from '@heroui/react';
import { Search } from 'lucide-react';

const UserFilters = ({ filters, onFilterChange, searchTerm, onSearchChange }) => {
    return (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                    <Input
                        placeholder="Search by name, username, email..."
                        value={searchTerm}
                        onChange={onSearchChange}
                        startContent={<Search size={18} className="text-gray-400" />}
                        isClearable
                        onClear={() => onSearchChange({ target: { value: '' } })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <Select
                        selectedKeys={filters.isActive !== 'all' ? [filters.isActive] : []}
                        onSelectionChange={(keys) =>
                            onFilterChange('isActive', Array.from(keys)[0] || 'all')
                        }
                        placeholder="All Statuses"
                        className="w-full"
                    >
                        <SelectItem key="all" value="all">
                            All Statuses
                        </SelectItem>
                        <SelectItem key="true" value="true">
                            Active
                        </SelectItem>
                        <SelectItem key="false" value="false">
                            Inactive
                        </SelectItem>
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <Select
                        selectedKeys={filters.gender !== 'all' ? [filters.gender] : []}
                        onSelectionChange={(keys) =>
                            onFilterChange('gender', Array.from(keys)[0] || 'all')
                        }
                        placeholder="All Genders"
                        className="w-full"
                    >
                        <SelectItem key="all" value="all">
                            All Genders
                        </SelectItem>
                        <SelectItem key="MALE" value="MALE">
                            Male
                        </SelectItem>
                        <SelectItem key="FEMALE" value="FEMALE">
                            Female
                        </SelectItem>
                    </Select>
                </div>
                <div className="flex items-center pt-7">
                    <Checkbox
                        radius="sm"
                        isSelected={filters.includeArchived}
                        onValueChange={(isSelected) =>
                            onFilterChange('includeArchived', isSelected)
                        }
                    >
                        Include Archived
                    </Checkbox>
                </div>
            </div>
        </div>
    );
};

export default UserFilters;
