import React, { useState } from 'react';
import PublicNavbar from '../components/layout/PublicNavbar';
import { SearchIcon } from '../components/icons/IconCollection';
import EventCard from '../components/EventCard';
import { Link } from 'react-router-dom';
import { useEvents } from '../contexts/EventContext';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';

const categories = ['All', 'Tech', 'Arts', 'Academics', 'Music', 'Business', 'Social'];
const audiences = ['All', 'Inter-College', 'Outer-College'];

const EventsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [selectedAudience, setSelectedAudience] = useState('All');
    const { events } = useEvents();
    const { user } = useAuth();

    const approvedEvents = events.filter(event => event.status === 'approved');

    // Dynamically get departments from organizers
    const departments = ['All', ...Array.from(new Set(approvedEvents.map(e => e.organizer.name)))];

    const filteredEvents = approvedEvents.filter(event => {
        // Audience Filter
        const audienceMatch = () => {
            switch (selectedAudience) {
                case 'Outer-College':
                    return event.audience === 'outer';
                case 'Inter-College':
                    // Only show if user is logged in and from the same college
                    return user ? event.audience === 'inter' && event.college === user.college : false;
                case 'All':
                default:
                    // Show all public events, plus internal events if user is eligible
                    if (event.audience === 'outer') return true;
                    if (user && event.audience === 'inter' && event.college === user.college) return true;
                    return false;
            }
        };

        if (!audienceMatch()) return false;

        const searchMatch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.category.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const categoryMatch = selectedCategory === 'All' || event.category.includes(selectedCategory);

        // Date match logic: Ignore timezones for simple date comparison
        const dateMatch = !selectedDate || new Date(event.date).toLocaleDateString() === new Date(selectedDate).toLocaleDateString();

        const departmentMatch = selectedDepartment === 'All' || event.organizer.name === selectedDepartment;

        return searchMatch && categoryMatch && dateMatch && departmentMatch;
    });

    return (
        <div className="bg-primary dark:bg-primary-dark min-h-screen flex flex-col">
            <PublicNavbar />
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary dark:text-text-primary-dark">Find Your Next Experience</h1>
                <p className="text-text-secondary dark:text-text-secondary-dark mt-2">Discover approved events happening across the campus.</p>
            </div>
            <main className="container mx-auto px-4 py-8 flex-grow">
                <div className="flex flex-col md:flex-row gap-8">
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
                                    <label htmlFor="date-filter" className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Date</label>
                                    <input
                                        type="date"
                                        id="date-filter"
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
                                                name="category" 
                                                id={`cat-${cat}`} 
                                                className="h-4 w-4 text-accent focus:ring-accent border-gray-300" 
                                                value={cat}
                                                checked={selectedCategory === cat}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                            />
                                            <label htmlFor={`cat-${cat}`} className="ml-3 text-sm text-text-primary dark:text-text-primary-dark">{cat}</label>
                                          </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-text-secondary dark:text-text-secondary-dark">Audience</label>
                                     <div className="mt-2 space-y-2">
                                        {audiences.map(aud => (
                                          <div key={aud} className="flex items-center">
                                            <input 
                                                type="radio" 
                                                name="audience" 
                                                id={`aud-${aud}`} 
                                                className="h-4 w-4 text-accent focus:ring-accent border-gray-300" 
                                                value={aud}
                                                checked={selectedAudience === aud}
                                                onChange={(e) => setSelectedAudience(e.target.value)}
                                            />
                                            <label htmlFor={`aud-${aud}`} className="ml-3 text-sm text-text-primary dark:text-text-primary-dark">{aud}</label>
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredEvents.map(event => (
                                    <Link to={`/events/${event.id}`} key={event.id}>
                                        <EventCard event={event} />
                                    </Link>
                                ))}
                            </div>
                         ) : (
                            <div className="bg-surface dark:bg-surface-dark rounded-lg p-12 text-center text-text-secondary dark:text-text-secondary-dark">
                                <h3 className="text-lg font-semibold text-text-primary dark:text-text-primary-dark">No Events Found</h3>
                                <p className="mt-2 text-sm">Try adjusting your search or filter criteria.</p>
                            </div>
                         )}
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default EventsPage;