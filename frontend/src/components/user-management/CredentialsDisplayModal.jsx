import React from 'react';
import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Snippet,
} from '@heroui/react';
import { toast } from 'sonner';
import { User, Key, Copy, CheckCircle, ShieldAlert } from 'lucide-react';

const CredentialsDisplayModal = ({ isOpen, onClose, username, password }) => {
    if (!isOpen) return null;
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
                        <CheckCircle size={24} className="text-green-500" /> User Created
                        Successfully!
                    </ModalHeader>
                    <ModalBody className="space-y-4">
                        <p className="text-gray-600">
                            The user account has been created. Please share the following
                            credentials with the user.
                        </p>
                        <p className="text-sm font-semibold text-red-600">
                            <ShieldAlert size={16} className="inline mr-1" /> Important: The
                            password shown below will not be accessible again after closing this
                            window.
                        </p>
                        <div className="space-y-2">
                            <Snippet
                                symbol={<User size={16} className="mr-1 text-gray-500" />}
                                classNames={{ base: 'w-full', pre: 'whitespace-pre-wrap' }}
                                onCopy={() => toast.success('Username copied!')}
                            >
                                {username}
                            </Snippet>
                            <Snippet
                                symbol={<Key size={16} className="mr-1 text-gray-500" />}
                                classNames={{ base: 'w-full', pre: 'whitespace-pre-wrap' }}
                                onCopy={() => toast.success('Password copied!')}
                            >
                                {password}
                            </Snippet>
                        </div>
                        <Snippet
                            symbol={<Copy size={16} className="mr-1 text-gray-500" />}
                            classNames={{ base: 'w-full', pre: 'whitespace-pre-wrap text-sm' }}
                            codeString={`Username: ${username}\nPassword: ${password}`}
                            onCopy={() => toast.success('Username and Password copied!')}
                        >
                            <span>Username: {username}</span>
                            <span>Password: {password}</span>
                        </Snippet>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onPress={onClose}>
                            Acknowledge & Close
                        </Button>
                    </ModalFooter>
                </>
            </ModalContent>
        </Modal>
    );
};

export default CredentialsDisplayModal;
