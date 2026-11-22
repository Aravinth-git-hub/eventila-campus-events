import React, { useState } from 'react';
import { useEvents } from '../../../contexts/EventContext';
import { useAuth } from '../../../contexts/AuthContext';

const ReportsPage: React.FC = () => {
    const { events, registrations } = useEvents();
    const { user } = useAuth();
    const [department, setDepartment] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reportNotice, setReportNotice] = useState<string | null>(null);

    const getFilteredEvents = () => {
        let filteredEvents = events.filter(e => !user?.college || e.college === user.college);

        if (department !== 'All') {
            filteredEvents = filteredEvents.filter(e =>
                e.organizer.name.toLowerCase().includes(department.toLowerCase())
            );
        }

        if (startDate) {
            filteredEvents = filteredEvents.filter(e => new Date(e.date) >= new Date(startDate));
        }

        if (endDate) {
            filteredEvents = filteredEvents.filter(e => new Date(e.date) <= new Date(endDate));
        }

        return filteredEvents;
    };

    const handleGenerateReport = () => {
        const filteredEvents = getFilteredEvents();
        setReportNotice(`Report generated: found ${filteredEvents.length} campus events matching your criteria.`);
    };

    const handleExportRegistrations = () => {
        const filteredEvents = getFilteredEvents();
        const eventIds = new Set(filteredEvents.map(e => e.id));
        const filteredRegs = registrations.filter(r => eventIds.has(r.eventId));

        if (filteredRegs.length === 0) {
            setReportNotice('No registrations found for the selected criteria.');
            return;
        }

        const csvContent = 'data:text/csv;charset=utf-8,'
            + 'Event ID,Registrant,Status\n'
            + filteredRegs.map(r => `${r.eventId},${r.userId || r.guestDetails?.email || 'Unknown'},${r.ticketStatus}`).join('\n');

        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `campus_registrations_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setReportNotice(`Exported ${filteredRegs.length} registrations to CSV.`);
    };

    const handleExportEvents = () => {
        const filteredEvents = getFilteredEvents();
        if (filteredEvents.length === 0) {
            setReportNotice('No events found for the selected criteria.');
            return;
        }

        const csvContent = 'data:text/csv;charset=utf-8,'
            + 'Event Title,Date,Venue,Status,Registrations\n'
            + filteredEvents.map(e => {
                const regCount = registrations.filter(r => r.eventId === e.id).length;
                return `"${e.title}",${new Date(e.date).toLocaleDateString()},"${e.venue}",${e.status},${regCount}`;
            }).join('\n');

        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `campus_events_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setReportNotice(`Exported ${filteredEvents.length} events to CSV.`);
    };

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Reports & Data Export</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Generate reports on event engagement and trends.
            </p>

            <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-bold font-display text-text-primary dark:text-text-primary-dark mb-4">Generate Report</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Department</label>
                        <select
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                        >
                            <option value="All">All Departments</option>
                            <option value="CSE">CSE</option>
                            <option value="ECE">ECE</option>
                            <option value="IT">IT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                        />
                    </div>
                </div>
                {reportNotice && (
                    <div className="mb-4 p-3 rounded-md bg-teal-500/10 border border-teal-500/20 text-sm text-teal-600 dark:text-teal-400">
                        {reportNotice}
                    </div>
                )}
                <div className="flex flex-col sm:flex-row flex-wrap gap-4">
                     <button onClick={handleGenerateReport} className="bg-accent hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-md">Generate Report</button>
                     <button onClick={handleExportRegistrations} className="bg-secondary hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-md">Export Registrations</button>
                     <button onClick={handleExportEvents} className="bg-secondary hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-md">Export Event List</button>
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;