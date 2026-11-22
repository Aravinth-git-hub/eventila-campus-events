import React from 'react';
import { CheckCircleIcon, ClockIcon } from '../../../components/icons/IconCollection';
import { useAuth } from '../../../contexts/AuthContext';
import { useEvents } from '../../../contexts/EventContext';
import { Link } from 'react-router-dom';

const NotificationItem: React.FC<{ message: string; time: string; eventId: string; }> = ({ message, time, eventId }) => {
    const icon = <ClockIcon className="w-6 h-6 text-yellow-500" />;
    return (
        <div className="flex items-start space-x-4 p-4 border-b border-border-color dark:border-border-color-dark">
            <div className="flex-shrink-0 pt-1">{icon}</div>
            <div className="flex-1">
                <p className="text-sm text-text-primary dark:text-text-primary-dark">{message}</p>
                <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark">{time}</p>
                    <Link to={`/events/${eventId}`} className="text-xs font-semibold text-accent hover:underline">View Event</Link>
                </div>
            </div>
        </div>
    );
}

const NotificationsPage: React.FC = () => {
    const { user } = useAuth();
    const { notifications } = useEvents();
    const myNotifications = user ? notifications.filter(n => n.userId === user.id) : [];

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Notifications</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Updates about your events and registrations.
            </p>
            <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-sm max-w-3xl">
                {myNotifications.map((notification) => (
                    <NotificationItem key={notification.id} {...notification} />
                ))}
                {myNotifications.length === 0 && (
                    <p className="p-8 text-center text-text-secondary dark:text-text-secondary-dark">You have no new notifications.</p>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;