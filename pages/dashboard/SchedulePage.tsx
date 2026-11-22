import React from 'react';

const SchedulePage: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">
                My Schedule
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2">
                View your upcoming event schedule.
            </p>
        </div>
    );
};
export default SchedulePage;
