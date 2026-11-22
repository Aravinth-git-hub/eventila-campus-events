import React, { useState } from 'react';
import type { CampusEvent } from '../types';
import { CalendarIcon, LocationMarkerIcon, XIcon } from './icons/IconCollection';

interface EventCardProps {
    event: CampusEvent;
}

const getStatusClass = (status: CampusEvent['status']) => {
    switch (status) {
        case 'approved': return 'bg-teal-500/10 text-teal-500';
        case 'pending': return 'bg-yellow-500/10 text-yellow-500';
        case 'rejected': return 'bg-red-500/10 text-red-500';
        case 'completed': return 'bg-slate-500/10 text-slate-500';
        default: return 'bg-gray-500/10 text-gray-500';
    }
}

const PosterModal: React.FC<{ src: string; alt: string; onClose: () => void }> = ({ src, alt, onClose }) => (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
            <XIcon className="w-8 h-8" />
        </button>
        <img src={src} alt={alt} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
);


const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const eventDate = new Date(event.date);
    const day = eventDate.getDate();
    const month = eventDate.toLocaleString('default', { month: 'short' }).toUpperCase();
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    return (
        <>
            {isModalOpen && <PosterModal src={event.posterUrl.replace('400/200', '1200/800')} alt={event.title} onClose={() => setIsModalOpen(false)} />}
            <div className="bg-surface dark:bg-surface-dark rounded-lg overflow-hidden group transition-transform duration-300 hover:-translate-y-1 shadow-md border border-border-color dark:border-border-color-dark">
                <div className="relative cursor-pointer" onClick={() => setIsModalOpen(true)}>
                    <img src={event.posterUrl} alt={event.title} className="w-full h-40 object-cover" />
                    <div className="absolute top-3 right-3 bg-primary/80 dark:bg-primary-dark/80 backdrop-blur-sm text-center rounded-md p-2 w-14 shadow-lg">
                        <div className="font-bold font-display text-xl text-accent">{day}</div>
                        <div className="text-xs uppercase font-semibold text-text-secondary dark:text-text-secondary-dark">{month}</div>
                    </div>
                     <div className="absolute top-3 left-3">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${getStatusClass(event.status)}`}>
                            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                     </div>
                </div>
                <div className="p-4">
                    <div className="flex space-x-2 mb-2">
                        {event.category.map(cat => (
                            <span key={cat} className="text-xs font-semibold text-secondary bg-secondary/10 px-2 py-1 rounded-full">{cat}</span>
                        ))}
                    </div>
                    <h3 className="text-lg font-bold font-display text-text-primary dark:text-text-primary-dark mb-2 truncate">{event.title}</h3>
                    <div className="text-sm text-text-secondary dark:text-text-secondary-dark space-y-1.5 mb-4">
                        <div className="flex items-center">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            <span>{event.time}</span>
                        </div>
                        <div className="flex items-center">
                            <LocationMarkerIcon className="w-4 h-4 mr-2" />
                            <span className="truncate">{event.venue}</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center border-t border-border-color dark:border-border-color-dark pt-3">
                        <div className="flex items-center">
                            <img src={event.organizer.logo || `https://ui-avatars.com/api/?name=${event.organizer.name.charAt(0)}&background=random`} alt={event.organizer.name} className="w-6 h-6 rounded-full mr-2"/>
                            <span className="text-sm text-text-secondary dark:text-text-secondary-dark">{event.organizer.name}</span>
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setIsModalOpen(true);
                            }}
                            className="bg-accent/10 hover:bg-accent/20 text-accent font-semibold text-xs px-3 py-1 rounded-md transition-colors"
                        >
                            View Poster
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EventCard;