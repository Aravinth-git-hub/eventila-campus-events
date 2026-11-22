import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicNavbar from '../components/layout/PublicNavbar';
import { CalendarIcon, ClockIcon, LocationMarkerIcon, XIcon } from '../components/icons/IconCollection';
import Footer from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useEvents } from '../contexts/EventContext';
import { isValidEmail, isValidPhone, sanitizeHtml } from '../src/utils/validation';
import type { GuestRegistrationDetails } from '../types';

const PosterModal: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <XIcon className="w-8 h-8" />
        </button>
        <img src={src} alt={alt} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
);

const GuestRegistrationModal: React.FC<{
    eventTitle: string;
    onSubmit: (details: GuestRegistrationDetails) => Promise<void>;
    onClose: () => void;
}> = ({ eventTitle, onSubmit, onClose }) => {
    const [submitting, setSubmitting] = useState(false);
    const [modalError, setModalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setModalError(null);
        const formData = new FormData(e.currentTarget);
        const details: GuestRegistrationDetails = {
            name: (formData.get('name') as string || '').trim(),
            college: (formData.get('college') as string || '').trim(),
            department: (formData.get('department') as string || '').trim(),
            email: (formData.get('email') as string || '').trim(),
            phone: (formData.get('phone') as string || '').trim(),
        };

        if (!details.name || !details.college || !details.department || !details.email || !details.phone) {
            setModalError('Please fill in all required fields.');
            return;
        }
        if (!isValidEmail(details.email)) {
            setModalError('Please enter a valid email address.');
            return;
        }
        if (!isValidPhone(details.phone)) {
            setModalError('Please enter a valid phone number.');
            return;
        }

        setSubmitting(true);
        try {
            await onSubmit(details);
        } catch (err: any) {
            setModalError(err?.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl p-6 md:p-8 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-display font-bold text-text-primary dark:text-text-primary-dark">Register for {eventTitle}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-primary dark:hover:bg-primary-dark">
                        <XIcon className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input name="name" type="text" placeholder="Full Name" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm" required />
                    <input name="college" type="text" placeholder="College Name" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm" required />
                    <input name="department" type="text" placeholder="Department" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm" required />
                    <input name="email" type="email" placeholder="Email Address" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm" required />
                    <input name="phone" type="tel" placeholder="Phone Number" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm" required />
                    {modalError && (
                        <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center">
                            {modalError}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-accent hover:bg-orange-600 text-white font-bold py-2.5 px-6 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {submitting ? 'Submitting...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
        </div>
    );
};


const EventDetailPage: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const { user, isAuthenticated } = useAuth();
    const { events, registrations, addRegistration } = useEvents();

    const event = events.find(e => e.id === eventId);

    const hasAccess = React.useMemo(() => {
        if (!event) return false;
        if (event.status === 'approved' && event.audience === 'outer') return true;
        if (isAuthenticated && user) {
            if (event.status === 'approved' && event.audience === 'inter' && user.college === event.college) {
                return true;
            }
            if (user.role === 'faculty' && event.createdBy === user.id) {
                return true;
            }
            if (user.role === 'hod' && event.college === user.college) {
                return true;
            }
        }
        return false;
    }, [event, user, isAuthenticated]);

    const [activeTab, setActiveTab] = useState('overview');
    const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
    const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const isAlreadyRegistered = user ? registrations.some(r => r.eventId === eventId && r.userId === user.id) : false;

    if (!event || !hasAccess) {
        return (
            <div className="bg-primary dark:bg-primary-dark min-h-screen">
                <PublicNavbar />
                <div className="container mx-auto px-4 py-12 text-center">
                    <h1 className="text-3xl font-bold font-display">Event Not Found</h1>
                    <p className="mt-4 text-text-secondary dark:text-text-secondary-dark">The event you are looking for does not exist or you do not have permission to view it.</p>
                    <Link to="/events" className="mt-8 inline-block bg-accent text-white font-semibold px-6 py-3 rounded-md">
                        Back to Events
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const handleRegisterClick = async () => {
        setFeedback(null);
        if (isAuthenticated && user && user.role === 'student') {
            setIsRegistering(true);
            try {
                await addRegistration({ eventId: event.id, userId: user.id, ticketStatus: 'Confirmed' });
                setFeedback({ type: 'success', message: `Successfully registered for ${event.title}!` });
            } catch (err: any) {
                setFeedback({ type: 'error', message: err?.message || 'Unable to register for this event.' });
            } finally {
                setIsRegistering(false);
            }
        } else if (!user && event.audience === 'outer' && event.status === 'approved') {
            setIsGuestModalOpen(true);
        }
    };

    const handleGuestSubmit = async (details: GuestRegistrationDetails) => {
        await addRegistration({ eventId: event.id, guestDetails: details, ticketStatus: 'Confirmed' });
        setIsGuestModalOpen(false);
        setFeedback({
            type: 'success',
            message: `Registration successful! Confirmation recorded for ${details.email}.`,
        });
    };

    const eventDate = new Date(event.date);

    const TabButton: React.FC<{ tabName: string; children: React.ReactNode }> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 font-semibold rounded-t-md transition-colors duration-200 border-b-2 ${
                activeTab === tabName
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary dark:text-text-secondary-dark hover:border-gray-300 dark:hover:border-gray-600'
            }`}
        >
            {children}
        </button>
    );

    const canRegister =
        event.status === 'approved' &&
        ((isAuthenticated && user?.role === 'student') || (!user && event.audience === 'outer'));

    const sanitizedDescription = sanitizeHtml(event.description);

    return (
        <div className="bg-primary dark:bg-primary-dark min-h-screen">
            <PublicNavbar />

            {isPosterModalOpen && <PosterModal src={event.posterUrl.replace('400/200', '1200/800')} alt={event.title} onClose={() => setIsPosterModalOpen(false)} />}
            {isGuestModalOpen && <GuestRegistrationModal eventTitle={event.title} onSubmit={handleGuestSubmit} onClose={() => setIsGuestModalOpen(false)} />}

            <div className="h-64 md:h-80 relative">
                <img
                    src={event.posterUrl.replace('400/200', '1200/400')}
                    alt={event.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setIsPosterModalOpen(true)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary dark:from-primary-dark via-primary/50 dark:via-primary-dark/50 to-transparent"></div>
            </div>

            <main className="container mx-auto px-4 pb-12 -mt-8">
                 <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl p-6 md:p-8">
                    <div>
                        <div className="flex-1 min-w-0">
                            <div className="flex space-x-2 mb-2">
                                {event.category.map(cat => (
                                    <span key={cat} className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full">{cat}</span>
                                ))}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-display font-bold text-text-primary dark:text-text-primary-dark break-words">{event.title}</h1>
                        </div>
                    </div>

                    <div className="lg:grid lg:grid-cols-3 lg:gap-12 mt-8">
                        <div className="lg:col-span-2">
                            <div className="flex space-x-1 border-b border-border-color dark:border-border-color-dark mb-6">
                                <TabButton tabName="overview">Overview</TabButton>
                                <TabButton tabName="schedule">Schedule</TabButton>
                                <TabButton tabName="venue">Venue</TabButton>
                            </div>
                            <div className="prose prose-slate dark:prose-invert max-w-none text-text-secondary dark:text-text-secondary-dark">
                                {activeTab === 'overview' && (
                                    <article dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
                                )}
                                {activeTab === 'schedule' && (
                                     <div>
                                        <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Event Schedule</h3>
                                        <p>Schedule details will be available soon.</p>
                                    </div>
                                )}
                                {activeTab === 'venue' && (
                                    <div>
                                        <h3 className="text-xl font-bold text-text-primary dark:text-text-primary-dark mb-4">Venue & Location</h3>
                                        <p className="mb-4">{event.venue}</p>
                                        {event.location && (
                                            <div className="mt-4 h-80 bg-primary dark:bg-primary-dark rounded-md overflow-hidden border border-border-color dark:border-border-color-dark">
                                                <iframe
                                                    width="100%"
                                                    height="100%"
                                                    frameBorder="0"
                                                    style={{ border: 0 }}
                                                    src={`https://maps.google.com/maps?q=${event.location.lat},${event.location.lng}&z=16&output=embed`}
                                                    allowFullScreen
                                                ></iframe>
                                            </div>
                                        )}
                                        {!event.location && (
                                            <div className="mt-4 h-64 bg-primary dark:bg-primary-dark rounded-md flex items-center justify-center border border-border-color dark:border-border-color-dark">
                                                <p className="text-text-secondary dark:text-text-secondary-dark">Map not available for this event</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Contact Details Section */}
                            {event.contactDetails && event.contactDetails.length > 0 && (
                                <div id="contact-organizers" className="mt-12 p-6 bg-surface dark:bg-surface-dark rounded-lg border border-border-color dark:border-border-color-dark">
                                    <h3 className="text-xl font-bold font-display text-text-primary dark:text-text-primary-dark mb-4">Contact Organizers</h3>
                                    <div className="space-y-6">
                                        {event.contactDetails.map((contact, index) => (
                                            <div key={index} className={`grid sm:grid-cols-3 gap-6 ${index !== 0 ? 'pt-6 border-t border-border-color dark:border-border-color-dark' : ''}`}>
                                                <div>
                                                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wider mb-1">Name</p>
                                                    <p className="font-semibold">{contact.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wider mb-1">Email</p>
                                                    <a href={`mailto:${contact.email}`} className="text-accent hover:underline font-semibold">{contact.email}</a>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark uppercase font-bold tracking-wider mb-1">Phone</p>
                                                    <p className="font-semibold">{contact.phone}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {feedback && (
                                <div className={`mt-6 p-3 rounded-md border text-sm ${
                                    feedback.type === 'success'
                                        ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-500'
                                }`}>
                                    {feedback.message}
                                </div>
                            )}

                            <div className="mt-8 pt-6 border-t border-border-color dark:border-border-color-dark flex flex-wrap items-center gap-4">
                                {canRegister && (
                                    <button
                                        className="w-full sm:w-auto bg-accent hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-md transition-transform duration-200 hover:scale-105 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                                        onClick={handleRegisterClick}
                                        disabled={isAlreadyRegistered || isRegistering}
                                    >
                                        {isAlreadyRegistered ? 'Registered' : isRegistering ? 'Registering...' : 'Register Now'}
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsPosterModalOpen(true)}
                                    className="w-full sm:w-auto bg-surface dark:bg-surface-dark hover:bg-slate-200 dark:hover:bg-slate-700/60 text-text-primary dark:text-text-primary-dark font-semibold py-3 px-8 rounded-md transition-colors duration-200 border border-border-color dark:border-border-color-dark"
                                >
                                    View Poster
                                </button>
                            </div>
                        </div>

                        <div className="mt-10 lg:mt-0 space-y-6">
                             <div className="bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark p-4 rounded-lg">
                                <h4 className="font-bold font-display text-text-primary dark:text-text-primary-dark mb-3">Date & Time</h4>
                                <div className="flex items-center text-text-secondary dark:text-text-secondary-dark space-x-3">
                                    <CalendarIcon className="w-5 h-5 flex-shrink-0 text-accent" />
                                    <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                 <div className="flex items-center text-text-secondary dark:text-text-secondary-dark space-x-3 mt-2">
                                    <ClockIcon className="w-5 h-5 flex-shrink-0 text-accent" />
                                    <span>Starts at {event.time}</span>
                                </div>
                            </div>
                             <div className="bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark p-4 rounded-lg">
                                <h4 className="font-bold font-display text-text-primary dark:text-text-primary-dark mb-3">Location</h4>
                                <div className="flex items-center text-text-secondary dark:text-text-secondary-dark space-x-3">
                                    <LocationMarkerIcon className="w-5 h-5 flex-shrink-0 text-accent" />
                                    <span>{event.venue}</span>
                                </div>
                            </div>
                             <div className="bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark p-4 rounded-lg">
                                <h4 className="font-bold font-display text-text-primary dark:text-text-primary-dark mb-3">Organizer</h4>
                                <div className="flex items-center space-x-3">
                                    <img src={event.organizer.logo || `https://ui-avatars.com/api/?name=${event.organizer.name.charAt(0)}&background=random`} alt={event.organizer.name} className="w-10 h-10 rounded-full"/>
                                    <div>
                                        <p className="font-semibold text-text-primary dark:text-text-primary-dark">{event.organizer.name}</p>
                                        <a href="#contact-organizers" className="text-sm text-accent hover:underline">Contact</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
            </main>
            <Footer />
        </div>
    );
};

export default EventDetailPage;