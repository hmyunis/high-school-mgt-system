// src/components/teacher/StudentPerformanceModal.jsx
import React, {  } from 'react';
import {
    Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button,
    Chip // Assuming Chip is available
} from '@heroui/react';
import { UserCircle, BarChart2, Info, Edit3 } from 'lucide-react';
// Assume a service to fetch detailed student performance data if needed
// import { studentPerformanceService } from '../../api/studentPerformanceService';

const StudentPerformanceModal = ({ isOpen, onClose, studentUser }) => {
    // In a real scenario, you might fetch more detailed performance data here
    // For now, we'll display info available from the studentUser object
    // const { data: performanceData, isLoading: isLoadingPerformance } = useQuery({
    //     queryKey: ['studentPerformance', studentUser?.studentProfile?.id],
    //     queryFn: () => studentPerformanceService.getPerformanceForStudent(studentUser.studentProfile.id),
    //     enabled: !!isOpen && !!studentUser?.studentProfile?.id,
    //     onError: () => toast.error("Could not load detailed performance data.")
    // });

    if (!isOpen || !studentUser || !studentUser.studentProfile) {
        return null;
    }

    const { fullName, username, email } = studentUser;
    const { gradeLevel, section, absentCount, underProbation } = studentUser.studentProfile;

    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            size="2xl" // Or "xl", "lg"
            placement="top-center"
            scrollBehavior="inside" // Good for potentially long content
        >
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-3 border-b pb-4">
                        <UserCircle size={28} className="text-blue-600" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-800">{fullName}</h2>
                            <p className="text-sm text-gray-500">@{username} - Student Performance</p>
                        </div>
                    </ModalHeader>
                    <ModalBody className="py-6 px-6 space-y-6">
                        {/* Basic Information Section */}
                        <section>
                            <h3 className="text-lg font-medium text-gray-700 mb-3">Basic Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div className="flex"><strong className="w-28 text-gray-600">Email:</strong> <span className="text-gray-800">{email || 'N/A'}</span></div>
                                <div className="flex"><strong className="w-28 text-gray-600">Grade:</strong> <span className="text-gray-800">{gradeLevel || 'N/A'}</span></div>
                                <div className="flex"><strong className="w-28 text-gray-600">Section:</strong> <span className="text-gray-800">{section || 'N/A'}</span></div>
                                <div className="flex"><strong className="w-28 text-gray-600">Absences:</strong> <span className="text-gray-800">{absentCount !== undefined ? absentCount : 'N/A'}</span></div>
                                <div className="flex items-center">
                                    <strong className="w-28 text-gray-600">Probation:</strong>
                                    <Chip
                                        size="sm"
                                        color={underProbation ? "danger" : "success"}
                                        variant="flat"
                                    >
                                        {underProbation ? "Yes" : "No"}
                                    </Chip>
                                </div>
                            </div>
                        </section>

                        {/* Placeholder for Performance Data */}
                        <section className="mt-6 pt-6 border-t">
                            <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                                <BarChart2 size={20} className="mr-2 text-blue-500" />
                                Performance Overview
                            </h3>
                            {/* {isLoadingPerformance && <div className="flex justify-center py-4"><Spinner label="Loading performance data..." /></div>}
                            {performanceData && (
                                // Render performance data here (e.g., list of courses, grades, assessment scores)
                                <p>Detailed performance data would be shown here.</p>
                            )}
                            {!isLoadingPerformance && !performanceData && (
                                <p className="text-gray-500 italic">No detailed performance data available at the moment.</p>
                            )} */}
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <p className="text-sm text-blue-700 flex items-center">
                                    <Info size={16} className="mr-2 flex-shrink-0" />
                                    Detailed performance metrics, such as scores per assessment and course grades, would be displayed here. This requires additional data fetching for this specific student.
                                </p>
                            </div>
                        </section>

                        {/* Placeholder for Teacher's Notes/Actions */}
                        <section className="mt-6 pt-6 border-t">
                             <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                                <Edit3 size={20} className="mr-2 text-blue-500" />
                                Teacher Actions
                            </h3>
                             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-700 flex items-center">
                                    <Info size={16} className="mr-2 flex-shrink-0" />
                                    Actions like "Log a Concern," "Send Commendation," or "View Attendance Details" could be initiated from here.
                                </p>
                            </div>
                        </section>


                    </ModalBody>
                    <ModalFooter className="border-t pt-4">
                        <Button variant="flat" color="default" onPress={onClose}>
                            Close
                        </Button>
                        {/* <Button color="primary" onPress={() => { /* e.g., navigate to full student page * / }}>
                            View Full Profile
                        </Button> */}
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

export default StudentPerformanceModal;