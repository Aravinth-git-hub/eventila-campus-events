import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const MyRegistrationsPage: React.FC = () => {
    const { user } = useAuth();
    const { registrations, events, removeRegistration, isLoading, error } = useEvents();

    const myRegistrations = registrations
        .filter(r => r.userId === user?.id)
        .map(r => {
            const event = events.find(e => e.id === r.eventId);
            if (!event) return null;

            const eventDate = new Date(event.date);
            const now = new Date();
            let status: 'Upcoming' | 'Ongoing' | 'Completed' = 'Upcoming';
            if (eventDate < now) {
                status = 'Completed';
            } // Simplified logic: 'Ongoing' would need start/end times.
            
            return {
                ...r,
                event,
                computedStatus: status,
            };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);
        
    const renderContent = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={5} className="text-center py-8">
                        <LoadingSpinner message="Loading your registrations..." />
                    </td>
                </tr>
            );
        }

        if (error) {
            return (
                <tr>
                    <td colSpan={5} className="text-center py-8 text-red-500">
                        {error}
                    </td>
                </tr>
            );
        }
        
        if (myRegistrations.length === 0) {
            return (
                 <tr>
                    <td colSpan={5} className="text-center py-8">
                        You have no registered events.
                        <Link to="/dashboard/available-events" className="text-accent font-semibold ml-2">Browse now!</Link>
                    </td>
                </tr>
            )
        }

        return myRegistrations.map(reg => (
            <tr key={reg.id} className="border-b border-border-color dark:border-border-color-dark hover:bg-primary dark:hover:bg-primary-dark">
                <th scope="row" className="px-6 py-4 font-medium text-text-primary dark:text-text-primary-dark whitespace-nowrap">
                    <Link to={`/events/${reg.event.id}`} className="hover:underline">{reg.event.title}</Link>
                </th>
                <td className="px-6 py-4">{new Date(reg.event.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{reg.event.venue}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        reg.computedStatus === 'Completed' ? 'bg-slate-500/10 text-slate-500' :
                        reg.computedStatus === 'Upcoming' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-green-500/10 text-green-500'
                    }`}>
                        {reg.computedStatus}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">
                    {reg.computedStatus === 'Upcoming' && (
                        <button onClick={() => removeRegistration(reg.id)} className="text-red-500 hover:underline font-semibold text-xs">
                            Cancel
                        </button>
                    )}
                </td>
            </tr>
        ));
    };


    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">My Registrations</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Here are all the events you've registered for.
            </p>

            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary dark:text-text-secondary-dark">
                        <thead className="text-xs text-text-primary dark:text-text-primary-dark uppercase bg-primary dark:bg-primary-dark border-b border-border-color dark:border-border-color-dark">
                            <tr>
                                <th scope="col" className="px-6 py-3">Event Title</th>
                                <th scope="col" className="px-6 py-3">Date</th>
                                <th scope="col" className="px-6 py-3">Venue</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                                <th scope="col" className="px-6 py-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                           {renderContent()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MyRegistrationsPage;
