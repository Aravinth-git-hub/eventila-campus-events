import React, { useState } from 'react';
import { useEvents } from '../../../contexts/EventContext';
import { useAuth } from '../../../contexts/AuthContext';
import { ChartBarIcon, ClipboardListIcon, UsersIcon } from '../../../components/icons/IconCollection';

const FacultyReportsPage: React.FC = () => {
    const { events, registrations } = useEvents();
    const { user } = useAuth();
    const [selectedEventId, setSelectedEventId] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Only show events created by this faculty
    const myEvents = events.filter(e => e.createdBy === user?.id);

    const handleExportRegistrations = () => {
        let filteredEvents = myEvents;
        if (selectedEventId !== 'All') {
            filteredEvents = filteredEvents.filter(e => e.id === selectedEventId);
        }

        if (startDate) {
            filteredEvents = filteredEvents.filter(e => new Date(e.date) >= new Date(startDate));
        }

        if (endDate) {
            filteredEvents = filteredEvents.filter(e => new Date(e.date) <= new Date(endDate));
        }

        const eventIds = filteredEvents.map(e => e.id);
        const filteredRegistrations = registrations.filter(r => eventIds.includes(r.eventId));

        if (filteredRegistrations.length === 0) {
            alert('No registrations found for the selected criteria.');
            return;
        }

        // Mock CSV Export
        const csvContent = "data:text/csv;charset=utf-8," 
            + "Event ID,Student ID,Status\n"
            + filteredRegistrations.map(r => `${r.eventId},${r.userId || r.guestDetails?.email},${r.ticketStatus}`).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `registrations_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert(`Exporting ${filteredRegistrations.length} registrations to CSV...`);
    };

    const handleExportEventSummary = () => {
        let filteredEvents = myEvents;
        if (selectedEventId !== 'All') {
            filteredEvents = filteredEvents.filter(e => e.id === selectedEventId);
        }

        if (startDate) {
            filteredEvents = filteredEvents.filter(e => new Date(e.date) >= new Date(startDate));
        }

        if (endDate) {
            filteredEvents = filteredEvents.filter(e => new Date(e.date) <= new Date(endDate));
        }

        if (filteredEvents.length === 0) {
            alert('No events found for the selected criteria.');
            return;
        }

        const csvContent = "data:text/csv;charset=utf-8," 
            + "Event Title,Date,Venue,Status,Registrations\n"
            + filteredEvents.map(e => {
                const regCount = registrations.filter(r => r.eventId === e.id).length;
                return `"${e.title}",${new Date(e.date).toLocaleDateString()},"${e.venue}",${e.status},${regCount}`;
            }).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `events_summary_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        alert(`Exporting summary for ${filteredEvents.length} events to CSV...`);
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex items-center space-x-3 mb-2">
                <ChartBarIcon className="w-8 h-8 text-accent" />
                <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Faculty Reports</h1>
            </div>
            <p className="text-text-secondary dark:text-text-secondary-dark mb-8">
                Analyze engagement and export participant data for your events.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Filters Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-surface dark:bg-surface-dark p-6 rounded-xl shadow-sm border border-border-color dark:border-border-color-dark">
                        <h2 className="text-lg font-bold font-display mb-4 flex items-center">
                            <ClipboardListIcon className="w-5 h-5 mr-2 text-accent" />
                            Report Filters
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1.5">Select Event</label>
                                <select 
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                >
                                    <option value="All">All My Events</option>
                                    {myEvents.map(event => (
                                        <option key={event.id} value={event.id}>{event.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1.5">Start Date</label>
                                <input 
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)} 
                                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-sm" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1.5">End Date</label>
                                <input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-sm" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-accent/5 border border-accent/10 p-6 rounded-xl">
                        <h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-2">Quick Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">{myEvents.length}</p>
                                <p className="text-xs text-text-secondary dark:text-text-secondary-dark">Total Events</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-text-primary dark:text-text-primary-dark">
                                    {registrations.filter(r => myEvents.map(e => e.id).includes(r.eventId)).length}
                                </p>
                                <p className="text-xs text-text-secondary dark:text-text-secondary-dark">Total Registrations</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface dark:bg-surface-dark p-8 rounded-xl shadow-sm border border-border-color dark:border-border-color-dark">
                        <h2 className="text-xl font-bold font-display text-text-primary dark:text-text-primary-dark mb-6 flex items-center">
                            <UsersIcon className="w-6 h-6 mr-2 text-accent" />
                            Data Export Options
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 bg-primary dark:bg-primary-dark rounded-xl border border-border-color dark:border-border-color-dark hover:border-accent/50 transition-colors group">
                                <h3 className="font-bold text-lg mb-2 group-hover:text-accent transition-colors">Participant List</h3>
                                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
                                    Download a detailed CSV of all students registered for your selected events, including their status and contact info.
                                </p>
                                <button 
                                    onClick={handleExportRegistrations}
                                    className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-accent/20 flex items-center justify-center space-x-2"
                                >
                                    <span>Export Registrations (.csv)</span>
                                </button>
                            </div>

                            <div className="p-6 bg-primary dark:bg-primary-dark rounded-xl border border-border-color dark:border-border-color-dark hover:border-secondary/50 transition-colors group">
                                <h3 className="font-bold text-lg mb-2 group-hover:text-secondary transition-colors">Event Performance</h3>
                                <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
                                    Get a summary report of your events, showing dates, venues, approval status, and total registration counts.
                                </p>
                                <button 
                                    onClick={handleExportEventSummary}
                                    className="w-full bg-secondary hover:bg-teal-700 text-white font-bold py-3 rounded-lg transition-all shadow-lg shadow-secondary/20 flex items-center justify-center space-x-2"
                                >
                                    <span>Export Event Summary (.csv)</span>
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start">
                                <span className="mr-2">💡</span>
                                <span>Note: Exported data is based on the filters applied on the left. Ensure you've selected the correct event or date range before exporting.</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyReportsPage;
