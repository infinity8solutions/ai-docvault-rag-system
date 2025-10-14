'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'md',
}: ModalProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content
          className={`fixed left-[50%] top-[50%] z-50 w-full ${maxWidthClasses[maxWidth]} translate-x-[-50%] translate-y-[-50%] gap-4 bg-white dark:bg-gray-800 p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-lg`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </Dialog.Title>
              {description && (
                <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {description}
                </Dialog.Description>
              )}
            </div>
            <Dialog.Close className="rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100 dark:ring-offset-gray-950 dark:focus:ring-gray-800 dark:data-[state=open]:bg-gray-800">
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
