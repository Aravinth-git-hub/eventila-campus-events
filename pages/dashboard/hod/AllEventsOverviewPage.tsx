import React from 'react';
import { useEvents } from '../../../contexts/EventContext';
import { useAuth } from '../../../contexts/AuthContext';
import EventCard from '../../../components/EventCard';
import { Link } from 'react-router-dom';

const getStatusClass = (status: string) => {
    switch (status) {
        case 'approved': return 'border-teal-500';
        case 'pending': return 'border-yellow-500';
        case 'rejected': return 'border-red-500';
        case 'completed': return 'border-slate-500';
        default: return 'border-gray-500';
    }
}

const AllEventsOverviewPage: React.FC = () => {
    const { events } = useEvents();
    const { user } = useAuth();

    const campusEvents = events.filter(event => !user?.college || event.college === user.college);

    const groupedEvents = campusEvents.reduce((acc, event) => {
        const status = event.status;
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(event);
        return acc;
    }, {} as Record<string, typeof events>);

    const statusOrder: (keyof typeof groupedEvents)[] = ['pending', 'approved', 'rejected', 'completed'];

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">All Campus Events</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                A complete overview of all events across statuses.
            </p>

            <div className="space-y-12">
                {statusOrder.map(status => (
                    groupedEvents[status] && (
                        <div key={status}>
                            <h2 className={`text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark mb-4 capitalize border-l-4 pl-4 ${getStatusClass(status)}`}>
                                {status} Events
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {groupedEvents[status].map(event => (
                                    <Link to={`/events/${event.id}`} key={event.id}>
                                        <EventCard event={event} />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )
                ))}
            </div>
        </div>
    );
};

export default AllEventsOverviewPage;
