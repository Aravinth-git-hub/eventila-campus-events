import React, { useState } from 'react';
import { useEvents } from '../../../contexts/EventContext';
import { CheckCircleIcon, XIcon, CalendarIcon, ClockIcon, LocationMarkerIcon, UsersIcon } from '../../../components/icons/IconCollection';
import { Link } from 'react-router-dom';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import { sanitizeHtml } from '../../../src/utils/validation';
import type { CampusEvent } from '../../../types';

const ReviewModal: React.FC<{ event: CampusEvent; onClose: () => void; onApprove: () => void; onReject: () => void }> = ({ event, onClose, onApprove, onReject }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 bg-surface dark:bg-surface-dark border-b border-border-color dark:border-border-color-dark p-4 flex justify-between items-center z-10">
                    <h2 className="text-xl font-display font-bold text-text-primary dark:text-text-primary-dark">Review Event Submission</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-primary dark:hover:bg-primary-dark">
                        <XIcon className="w-6 h-6 text-text-secondary dark:text-text-secondary-dark" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="aspect-video w-full rounded-lg overflow-hidden mb-6 border border-border-color dark:border-border-color-dark">
                        <img src={event.posterUrl} alt={event.title} className="w-full h-full object-cover" />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-6">
                            <div>
                                <h3 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark mb-2">{event.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {event.category.map(cat => (
                                        <span key={cat} className="text-xs font-semibold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">{cat}</span>
                                    ))}
                                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${event.audience === 'inter' ? 'text-blue-500 bg-blue-500/10' : 'text-purple-500 bg-purple-500/10'}`}>
                                        {event.audience === 'inter' ? 'Internal' : 'Public'}
                                    </span>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-text-secondary dark:text-text-secondary-dark" dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }} />
                            </div>
                            
                            {event.contactDetails && event.contactDetails.length > 0 && (
                                <div className="p-4 bg-primary dark:bg-primary-dark rounded-lg border border-border-color dark:border-border-color-dark">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-text-primary dark:text-text-primary-dark mb-3">Contact Persons</h4>
                                    <div className="space-y-4">
                                        {event.contactDetails.map((contact, index) => (
                                            <div key={index} className={`grid grid-cols-2 gap-4 text-sm ${index !== 0 ? 'pt-4 border-t border-border-color dark:border-border-color-dark' : ''}`}>
                                                <div>
                                                    <p className="text-text-secondary">Name</p>
                                                    <p className="font-medium">{contact.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-text-secondary">Phone</p>
                                                    <p className="font-medium">{contact.phone}</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-text-secondary">Email</p>
                                                    <p className="font-medium">{contact.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <div className="p-4 bg-primary dark:bg-primary-dark rounded-lg border border-border-color dark:border-border-color-dark">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-3">Schedule</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-start space-x-3">
                                        <CalendarIcon className="w-4 h-4 text-accent mt-0.5" />
                                        <span>{new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <ClockIcon className="w-4 h-4 text-accent mt-0.5" />
                                        <span>{event.time}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-primary dark:bg-primary-dark rounded-lg border border-border-color dark:border-border-color-dark">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-3">Venue</h4>
                                <div className="flex items-start space-x-3 text-sm">
                                    <LocationMarkerIcon className="w-4 h-4 text-accent mt-0.5" />
                                    <span>{event.venue}</span>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-primary dark:bg-primary-dark rounded-lg border border-border-color dark:border-border-color-dark">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-text-secondary mb-3">Organizer</h4>
                                <div className="flex items-center space-x-3 text-sm">
                                    <UsersIcon className="w-4 h-4 text-accent" />
                                    <span>{event.organizer.name}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="sticky bottom-0 bg-surface dark:bg-surface-dark border-t border-border-color dark:border-border-color-dark p-6 flex flex-col sm:flex-row gap-3 z-10">
                    <button 
                        onClick={onApprove}
                        className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center space-x-2"
                    >
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Approve Event</span>
                    </button>
                    <button 
                        onClick={onReject}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-md transition-colors flex items-center justify-center space-x-2"
                    >
                        <XIcon className="w-5 h-5" />
                        <span>Reject Event</span>
                    </button>
                    <button 
                        onClick={onClose}
                        className="sm:w-auto bg-primary dark:bg-primary-dark hover:bg-slate-200 dark:hover:bg-slate-700/60 text-text-primary dark:text-text-primary-dark font-semibold py-3 px-6 rounded-md transition-colors border border-border-color dark:border-border-color-dark"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const ApprovalPage: React.FC = () => {
    const { events, updateEventStatus, isLoading, error } = useEvents();
    const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const pendingEvents = events.filter(event => event.status === 'pending');

    const handleApprove = async (id: string) => {
        setActionError(null);
        try {
            await updateEventStatus(id, 'approved');
            setSelectedEvent(null);
        } catch (err: any) {
            setActionError(err?.message || 'Unauthorized or failed to approve event.');
        }
    };

    const handleReject = async (id: string) => {
        setActionError(null);
        try {
            await updateEventStatus(id, 'rejected');
            setSelectedEvent(null);
        } catch (err: any) {
            setActionError(err?.message || 'Unauthorized or failed to reject event.');
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-8">
                        <LoadingSpinner message="Loading approvals..." />
                    </td>
                </tr>
            );
        }

        if (error) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-8 text-red-500">
                        {error}
                    </td>
                </tr>
            );
        }

        if (pendingEvents.length === 0) {
            return (
                <tr>
                    <td colSpan={4} className="text-center py-8">
                        No events pending approval.
                    </td>
                </tr>
            );
        }

        return pendingEvents.map(event => (
            <tr 
                key={event.id} 
                className="border-b border-border-color dark:border-border-color-dark hover:bg-primary dark:hover:bg-primary-dark cursor-pointer transition-colors"
                onClick={() => setSelectedEvent(event)}
            >
                <th scope="row" className="px-6 py-4 font-medium text-text-primary dark:text-text-primary-dark whitespace-nowrap">
                    <span className="hover:text-accent transition-colors">{event.title}</span>
                </th>
                <td className="px-6 py-4">{event.organizer.name}</td>
                <td className="px-6 py-4">{new Date(event.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center space-x-2">
                        <button 
                            onClick={() => handleApprove(event.id)} 
                            className="p-2 rounded-full bg-teal-500/10 text-teal-500 hover:bg-teal-500/20"
                            title="Quick Approve"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => handleReject(event.id)} 
                            className="p-2 rounded-full bg-red-500/10 text-red-500 hover:bg-red-500/20"
                            title="Quick Reject"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>
                </td>
            </tr>
        ));
    };

    return (
        <div>
            {selectedEvent && (
                <ReviewModal 
                    event={selectedEvent} 
                    onClose={() => setSelectedEvent(null)} 
                    onApprove={() => handleApprove(selectedEvent.id)}
                    onReject={() => handleReject(selectedEvent.id)}
                />
            )}
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Event Approvals</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Review and approve or reject event submissions from faculty.
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
                                <th scope="col" className="px-6 py-3">Organizer</th>
                                <th scope="col" className="px-6 py-3">Date</th>
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

export default ApprovalPage;
