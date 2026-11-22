import React from 'react';

const ParticipantsPage: React.FC = () => {
    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">
                Event Participants
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2">
                View and manage participants for your events.
            </p>
        </div>
    );
};
export default ParticipantsPage;
