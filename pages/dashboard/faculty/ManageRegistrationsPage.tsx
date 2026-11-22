import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import type { Registration } from '../../../types';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const ManageRegistrationsPage: React.FC = () => {
    const { user, users } = useAuth();
    const { events, registrations, isLoading } = useEvents();
    const [selectedEventId, setSelectedEventId] = useState<string>('');

    const myEvents = events.filter(e => e.createdBy === user?.id);

    const eventRegistrations = useMemo(() => {
        if (!selectedEventId) return [];
        return registrations.filter(r => r.eventId === selectedEventId);
    }, [selectedEventId, registrations]);

    const getRegistrantInfo = (reg: Registration) => {
        if (reg.userId) {
            const student = users.find(u => u.id === reg.userId);
            return {
                name: student?.name || 'Unknown Student',
                type: 'Internal',
                details: `${student?.department || 'N/A'}, Year ${student?.year || 'N/A'}`
            };
        }
        if (reg.guestDetails) {
            return {
                name: reg.guestDetails.name,
                type: 'External',
                details: `${reg.guestDetails.college}`
            };
        }
        return { name: 'Unknown', type: 'Unknown', details: '' };
    }
    
    const renderTableBody = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-8"><LoadingSpinner message="Loading registrations..." /></td>
                </tr>
            )
        }
        if (eventRegistrations.length === 0) {
            return (
                 <tr>
                    <td colSpan={4} className="text-center py-8">No registrations for this event yet.</td>
                </tr>
            )
        }
        return eventRegistrations.map(reg => {
            const info = getRegistrantInfo(reg);
            return (
                <tr key={reg.id} className="border-b border-border-color dark:border-border-color-dark hover:bg-primary dark:hover:bg-primary-dark">
                    <th scope="row" className="px-6 py-4 font-medium text-text-primary dark:text-text-primary-dark whitespace-nowrap">{info.name}</th>
                    <td className="px-6 py-4">{info.type}</td>
                    <td className="px-6 py-4">{info.details}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${reg.ticketStatus === 'Confirmed' ? 'bg-teal-500/10 text-teal-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                            {reg.ticketStatus}
                        </span>
                    </td>
                </tr>
            );
        })
    }

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Manage Registrations</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                View participant lists for your events.
            </p>

            <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg shadow-sm">
                <label htmlFor="event-select" className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Select an Event</label>
                <select 
                    id="event-select"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full max-w-md bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                >
                    <option value="">-- Choose an event --</option>
                    {myEvents.map(event => (
                        <option key={event.id} value={event.id}>{event.title}</option>
                    ))}
                </select>
            </div>

            {selectedEventId && (
                <div className="mt-8 bg-surface dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border-color dark:border-border-color-dark">
                        <h2 className="font-semibold text-text-primary dark:text-text-primary-dark">Registrations for: {myEvents.find(e => e.id === selectedEventId)?.title} ({eventRegistrations.length})</h2>
                    </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-text-secondary dark:text-text-secondary-dark">
                            <thead className="text-xs text-text-primary dark:text-text-primary-dark uppercase bg-primary dark:bg-primary-dark border-b border-border-color dark:border-border-color-dark">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Participant Name</th>
                                    <th scope="col" className="px-6 py-3">Type</th>
                                    <th scope="col" className="px-6 py-3">Details</th>
                                    <th scope="col" className="px-6 py-3">Ticket Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableBody()}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageRegistrationsPage;
