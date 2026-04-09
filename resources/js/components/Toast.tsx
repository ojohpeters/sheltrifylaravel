import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from './icons';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastProps {
  toast: Toast;
  onClose: () => void;
}

export const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const getIcon = () => {
    const iconClass = "w-5 h-5 flex-shrink-0";
    switch (toast.type) {
      case 'success':
        return <CheckCircleIcon className={iconClass} />;
      case 'error':
        return <XCircleIcon className={iconClass} />;
      case 'warning':
        return <ExclamationTriangleIcon className={iconClass} />;
      case 'info':
        return <InformationCircleIcon className={iconClass} />;
      default:
        return <InformationCircleIcon className={iconClass} />;
    }
  };

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200';
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-[9999] 
        flex items-start gap-3 
        px-4 py-3 
        rounded-lg 
        border 
        shadow-lg 
        backdrop-blur-sm
        min-w-[320px] 
        max-w-[420px]
        animate-slide-in-right
        ${getStyles()}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5 break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Close notification"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ToastComponent;

