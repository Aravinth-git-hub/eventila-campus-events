import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useEvents } from '../../contexts/EventContext';
import EventCard from '../../components/EventCard';
import { Link } from 'react-router-dom';
import { supabase } from '../../src/lib/supabase';

const DatabaseStatus: React.FC = () => {
    const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const { error } = await supabase.from('events').select('id', { count: 'exact', head: true });
                if (error) throw error;
                setStatus('connected');
            } catch {
                setStatus('error');
            }
        };
        checkConnection();
    }, []);

    if (status === 'connected') return null;

    return (
        <div className={`mb-6 p-4 rounded-lg border flex items-center justify-between ${
            status === 'checking' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
            'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
            <div className="flex items-center space-x-2">
                <div className={`w-2.5 h-2.5 rounded-full ${status === 'checking' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                    {status === 'checking' ? 'Verifying Database Connection...' : 'Unable to reach Supabase database'}
                </span>
            </div>
            {status === 'error' && (
                <p className="text-xs opacity-80 hidden sm:block">Please verify your Supabase schema and network connection.</p>
            )}
        </div>
    );
};

const StatCard: React.FC<{ title: string; value: number | string; link?: string; }> = ({ title, value, link }) => (
    <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg shadow-sm">
        <p className="text-sm text-text-secondary dark:text-text-secondary-dark">{title}</p>
        <p className="text-3xl font-bold font-display mt-2">{value}</p>
        {link && <Link to={link} className="text-sm text-accent font-semibold mt-4 block">View details &rarr;</Link>}
    </div>
);

const StudentOverview: React.FC = () => {
    const { user } = useAuth();
    const { registrations, events } = useEvents();
    const myUpcomingRegistrations = registrations.filter(r => r.userId === user?.id)
        .map(r => events.find(e => e.id === r.eventId))
        .filter(e => e && new Date(e.date) >= new Date());

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">
                Welcome, {user?.name}!
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Here's a summary of your upcoming events. Let's make them count!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <StatCard title="Upcoming Registrations" value={myUpcomingRegistrations.length} link="/dashboard/my-registrations" />
            </div>
             <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark mt-12 mb-6">Your Next Events</h2>
            {myUpcomingRegistrations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myUpcomingRegistrations.slice(0, 3).map(event => event && (
                       <Link to={`/events/${event.id}`} key={event.id}><EventCard event={event} /></Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-surface dark:bg-surface-dark rounded-lg">
                    <p className="text-text-secondary dark:text-text-secondary-dark">You haven't registered for any upcoming events yet.</p>
                    <Link to="/dashboard/available-events" className="mt-4 inline-block bg-accent text-white font-semibold px-6 py-2 rounded-md">
                        Browse Events
                    </Link>
                </div>
            )}
        </div>
    );
};

const FacultyOverview: React.FC = () => {
    const { user } = useAuth();
    const { events } = useEvents();
    const myEvents = events.filter(e => e.createdBy === user?.id);

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">
                Faculty Dashboard
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Here's a quick overview of your events.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Events Created" value={myEvents.length} link="/dashboard/manage-events" />
                <StatCard title="Pending Approval" value={myEvents.filter(e => e.status === 'pending').length} link="/dashboard/manage-events" />
                <StatCard title="Approved Events" value={myEvents.filter(e => e.status === 'approved').length} link="/dashboard/manage-events" />
                <StatCard title="Completed Events" value={myEvents.filter(e => e.status === 'completed').length} link="/dashboard/manage-events" />
            </div>
        </div>
    );
};

const HODOverview: React.FC = () => {
    const { user } = useAuth();
    const { events } = useEvents();
    const collegeEvents = events.filter(e => !user?.college || e.college === user.college);
    const pendingCount = collegeEvents.filter(e => e.status === 'pending').length;
    
    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">
                Management Dashboard
            </h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                High-level overview of all campus event activities.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Pending Approvals" value={pendingCount} link="/dashboard/approvals" />
                <StatCard title="Total Approved Events" value={collegeEvents.filter(e => e.status === 'approved').length} link="/dashboard/all-events" />
                <StatCard title="Total Campus Events" value={collegeEvents.length} link="/dashboard/all-events" />
            </div>
        </div>
    );
};

const OverviewPage: React.FC = () => {
    const { user } = useAuth();

    const renderContent = () => {
        switch (user?.role) {
            case 'student': return <StudentOverview />;
            case 'faculty': return <FacultyOverview />;
            case 'hod': return <HODOverview />;
            default:
                return <div>Loading...</div>;
        }
    };

    return (
        <div className="animate-fadeIn">
            <DatabaseStatus />
            {renderContent()}
        </div>
    );
};

export default OverviewPage;