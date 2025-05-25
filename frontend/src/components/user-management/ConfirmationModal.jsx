import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { ShieldAlert } from 'lucide-react';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading,
    variant = 'danger',
}) => {
    if (!isOpen) return null;
    const confirmButtonColor =
        variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary';
    return (
        <Modal
            isOpen={isOpen}
            onOpenChange={(open) => !open && onClose()}
            isDismissable={false}
            isKeyboardDismissDisabled={true}
            size="md"
        >
            <ModalContent>
                <>
                    <ModalHeader className="flex items-center gap-2">
                        {variant === 'danger' && <ShieldAlert className="text-red-500" size={24} />}
                        {variant === 'warning' && (
                            <ShieldAlert className="text-yellow-500" size={24} />
                        )}
                        {title}
                    </ModalHeader>
                    <ModalBody>
                        <p className="text-gray-600">{message}</p>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="flat"
                            color="default"
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            {cancelText}
                        </Button>
                        <Button
                            color={confirmButtonColor}
                            onPress={onConfirm}
                            isLoading={isLoading}
                        >
                            {isLoading ? 'Processing...' : confirmText}
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

export default ConfirmationModal;
