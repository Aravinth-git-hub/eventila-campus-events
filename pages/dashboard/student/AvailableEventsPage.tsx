import React, { useState } from 'react';
import EventCard from '../../../components/EventCard';
import { useEvents } from '../../../contexts/EventContext';
import { useAuth } from '../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { SearchIcon } from '../../../components/icons/IconCollection';

const AvailableEventsPage: React.FC = () => {
    const { events, addRegistration, registrations } = useEvents();
    const { user } = useAuth();
    
    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [regFeedback, setRegFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [registeringId, setRegisteringId] = useState<string | null>(null);

    const baseAvailableEvents = events.filter(event => {
        if (event.status !== 'approved') return false;
        if (event.audience === 'outer') return true;
        if (event.audience === 'inter' && event.college === user?.college) return true;
        return false;
    });

    // Get dynamic categories and departments for filters
    const categories = ['All', ...Array.from(new Set(baseAvailableEvents.flatMap(e => e.category)))];
    const departments = ['All', ...Array.from(new Set(baseAvailableEvents.map(e => e.organizer.name)))];

    const filteredEvents = baseAvailableEvents.filter(event => {
        const searchMatch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const categoryMatch = selectedCategory === 'All' || event.category.includes(selectedCategory);

        const dateMatch = !selectedDate || new Date(event.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString();

        const departmentMatch = selectedDepartment === 'All' || event.organizer.name === selectedDepartment;

        return searchMatch && categoryMatch && dateMatch && departmentMatch;
    });

    const handleRegister = async (eventId: string) => {
        if (!user) return;
        setRegFeedback(null);
        setRegisteringId(eventId);
        try {
            await addRegistration({
                eventId,
                userId: user.id,
                ticketStatus: 'Confirmed'
            });
            setRegFeedback({ type: 'success', message: 'Successfully registered for the event!' });
        } catch (err: any) {
            setRegFeedback({ type: 'error', message: err?.message || 'Registration failed. Please try again.' });
        } finally {
            setRegisteringId(null);
        }
    };

    const isRegistered = (eventId: string) => {
        return registrations.some(r => r.eventId === eventId && r.userId === user?.id);
    };

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Available Events</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2">
                Browse and register for upcoming campus events.
            </p>
            {regFeedback && (
                <div className={`mt-4 p-3 rounded-md border text-sm ${
                    regFeedback.type === 'success'
                        ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                    {regFeedback.message}
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8 mt-8">
                {/* Filters Sidebar */}
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0">
                    <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg shadow-sm">
                        <h2 className="text-lg font-semibold font-display mb-4">Filters</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Search by name</label>
                                <div className="relative mt-2">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                                    <input
                                        type="text"
                                        placeholder="Event name..."
                                        className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="date-filter-dash" className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Date</label>
                                <input
                                    type="date"
                                    id="date-filter-dash"
                                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent text-sm mt-2"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Department</label>
                                <select
                                    value={selectedDepartment}
                                    onChange={(e) => setSelectedDepartment(e.target.value)}
                                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-accent text-sm mt-2"
                                >
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Category</label>
                                <div className="mt-2 space-y-2">
                                    {categories.map(cat => (
                                      <div key={cat} className="flex items-center">
                                        <input 
                                            type="radio" 
                                            name="category-dash" 
                                            id={`cat-dash-${cat}`} 
                                            className="h-4 w-4 text-accent focus:ring-accent border-gray-300" 
                                            value={cat}
                                            checked={selectedCategory === cat}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                        />
                                        <label htmlFor={`cat-dash-${cat}`} className="ml-3 text-sm text-text-primary dark:text-text-primary-dark">{cat}</label>
                                      </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>

                 {/* Events Grid */}
                <div className="flex-1">
                    {filteredEvents.length > 0 ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredEvents.map(event => (
                                <div key={event.id} className="flex flex-col">
                                    <Link to={`/events/${event.id}`} className="flex-grow">
                                        <EventCard event={event} />
                                    </Link>
                                     <div className="p-4 bg-surface dark:bg-surface-dark rounded-b-lg -mt-1 border-x border-b border-border-color dark:border-border-color-dark">
                                        <button
                                            onClick={() => handleRegister(event.id)}
                                            disabled={isRegistered(event.id) || registeringId === event.id}
                                            className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                        >
                                            {isRegistered(event.id) ? 'Registered' : registeringId === event.id ? 'Registering...' : 'Register Now'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-surface dark:bg-surface-dark rounded-lg p-12 text-center text-text-secondary dark:text-text-secondary-dark">
                            <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">No Available Events</h3>
                            <p className="mt-2 text-sm">No events match your current filter criteria. Try adjusting your search.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AvailableEventsPage;