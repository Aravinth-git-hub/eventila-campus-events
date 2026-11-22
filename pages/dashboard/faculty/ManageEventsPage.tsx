import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import { Link } from 'react-router-dom';
import { PencilAltIcon } from '../../../components/icons/IconCollection';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const getStatusClass = (status: string) => {
    switch (status) {
        case 'approved': return 'bg-teal-500/10 text-teal-500';
        case 'pending': return 'bg-yellow-500/10 text-yellow-500';
        case 'rejected': return 'bg-red-500/10 text-red-500';
        case 'completed': return 'bg-slate-500/10 text-slate-500';
        default: return 'bg-gray-500/10 text-gray-500';
    }
}

const ManageEventsPage: React.FC = () => {
    const { user } = useAuth();
    const { events, removeEvent, isLoading, error } = useEvents();
    const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
    const [actionError, setActionError] = React.useState<string | null>(null);

    const myEvents = events.filter(e => e.createdBy === user?.id);

    const handleRemove = async (eventId: string) => {
        setActionError(null);
        try {
            await removeEvent(eventId);
            setConfirmDeleteId(null);
        } catch (err: any) {
            setActionError(err?.message || 'Unauthorized or failed to delete event.');
            setConfirmDeleteId(null);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-8"><LoadingSpinner message="Loading your events..." /></td>
                </tr>
            )
        }
        if (error) {
             return (
                <tr>
                    <td colSpan={4} className="text-center py-8 text-red-500">{error}</td>
                </tr>
            )
        }
        if (myEvents.length === 0) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-8">
                        You have not created any events yet.
                        <Link to="/dashboard/publish-event" className="text-accent font-semibold ml-2">Create one now!</Link>
                    </td>
                </tr>
            )
        }
        return myEvents.map(event => (
            <tr key={event.id} className="border-b border-border-color dark:border-border-color-dark hover:bg-primary dark:hover:bg-primary-dark">
                <th scope="row" className="px-6 py-4 font-medium text-text-primary dark:text-text-primary-dark whitespace-nowrap">
                    <Link to={`/events/${event.id}`} className="hover:underline">{event.title}</Link>
                </th>
                <td className="px-6 py-4">{new Date(event.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </span>
                </td>
                <td className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center space-x-2">
                        <button className="p-2 rounded-full text-secondary hover:bg-secondary/10" title="Edit">
                            <PencilAltIcon className="w-5 h-5" />
                        </button>
                        {confirmDeleteId === event.id ? (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleRemove(event.id)}
                                    className="text-red-500 hover:underline font-semibold text-xs px-2"
                                >
                                    Confirm
                                </button>
                                <button
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="text-text-secondary hover:underline text-xs px-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setConfirmDeleteId(event.id)}
                                className="text-red-500 hover:underline font-semibold text-xs px-2"
                            >
                                Delete
                            </button>
                        )}
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Manage Your Events</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                View, edit, and track the status of events you have created.
            </p>
            {actionError && (
                <div className="mb-6 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                    {actionError}
                </div>
            )}

            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-text-secondary dark:text-text-secondary-dark">
                        <thead className="text-xs text-text-primary dark:text-text-primary-dark uppercase bg-primary dark:bg-primary-dark border-b border-border-color dark:border-border-color-dark">
                            <tr>
                                <th scope="col" className="px-6 py-3">Event Title</th>
                                <th scope="col" className="px-6 py-3">Date</th>
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

export default ManageEventsPage;
