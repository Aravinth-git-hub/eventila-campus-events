import React from 'react';

const LoadingSpinner: React.FC<{ message?: string; size?: 'sm' | 'md' | 'lg' }> = ({ message = 'Loading...', size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-2 text-text-secondary dark:text-text-secondary-dark">
            <div className={`animate-spin rounded-full border-4 border-border-color dark:border-border-color-dark border-t-accent ${sizeClasses[size]}`}></div>
            {message && <p className="text-sm font-medium">{message}</p>}
        </div>
    );
};

export const FullPageLoader: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-primary dark:bg-primary-dark flex items-center justify-center z-[999]">
            <LoadingSpinner message="Initializing Eventila..." size="lg" />
        </div>
    );
};

export default LoadingSpinner;
