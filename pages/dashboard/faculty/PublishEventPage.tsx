import React, { useState } from 'react';
import { ArrowRightIcon } from '../../../components/icons/IconCollection';
import { useEvents } from '../../../contexts/EventContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiUploadPoster } from '../../../api';

const StepIndicator: React.FC<{ step: number; title: string; isCurrent: boolean; isCompleted: boolean }> = ({ step, title, isCurrent, isCompleted }) => {
    return (
        <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold border-2 transition-all duration-300 ${
                isCurrent ? 'bg-accent border-accent text-white' : 
                isCompleted ? 'bg-teal-500 border-teal-500 text-white' : 
                'bg-surface dark:bg-surface-dark border-border-color dark:border-border-color-dark text-text-secondary dark:text-text-secondary-dark'
            }`}>
                {isCompleted ? '✓' : step}
            </div>
            <span className={`ml-3 text-sm font-medium hidden sm:block ${isCurrent || isCompleted ? 'text-text-primary dark:text-text-primary-dark' : 'text-text-secondary dark:text-text-secondary-dark'}`}>{title}</span>
        </div>
    );
};

const PublishEventPage: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const { addEvent } = useEvents();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [posterFile, setPosterFile] = useState<File | null>(null);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        venue: '',
        audience: 'inter' as 'inter' | 'outer',
        location: { lat: 11.6643, lng: 78.1460, address: '' }, // Default to Salem coords
        contactDetails: [{ name: '', email: '', phone: '' }]
    });

    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [addressSearch, setAddressSearch] = useState('');
    const [currentMapQuery, setCurrentMapQuery] = useState('Salem, Tamil Nadu');
    const [isSearching, setIsSearching] = useState(false);
    const [mapVersion, setMapVersion] = useState(0);

    const handleAddressSearch = async () => {
        const query = addressSearch.trim();
        if (!query) return;
        
        setIsSearching(true);
        // Update map query immediately for visual feedback
        setCurrentMapQuery(query);
        setMapVersion(v => v + 1);

        try {
            // Geocode in background to get coordinates for the database
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
                headers: {
                    'Accept-Language': 'en'
                }
            });
            
            if (!response.ok) throw new Error('Network response was not ok');
            
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setFormData(prev => ({
                    ...prev,
                    location: {
                        ...prev.location,
                        lat: parseFloat(lat),
                        lng: parseFloat(lon),
                        address: display_name
                    }
                }));
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setIsSearching(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const coordsQuery = `${latitude},${longitude}`;
                setCurrentMapQuery(coordsQuery);
                setMapVersion(v => v + 1);

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    setFormData(prev => ({
                        ...prev,
                        location: {
                            ...prev.location,
                            lat: latitude,
                            lng: longitude,
                            address: data.display_name || 'Current Location'
                        }
                    }));
                } catch (error) {
                    setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, lat: latitude, lng: longitude, address: 'Current Location' }
                    }));
                } finally {
                    setIsSearching(false);
                }
            },
            (error) => {
                setIsSearching(false);
                alert('Unable to retrieve your location. Please check your permissions.');
            }
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: {
                    ...(prev[parent as keyof typeof prev] as any),
                    [child]: value
                }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleContactChange = (index: number, field: string, value: string) => {
        const updatedContacts = [...formData.contactDetails];
        updatedContacts[index] = { ...updatedContacts[index], [field]: value };
        setFormData(prev => ({ ...prev, contactDetails: updatedContacts }));
    };

    const addContact = () => {
        setFormData(prev => ({
            ...prev,
            contactDetails: [...prev.contactDetails, { name: '', email: '', phone: '' }]
        }));
    };

    const removeContact = (index: number) => {
        if (formData.contactDetails.length > 1) {
            const updatedContacts = formData.contactDetails.filter((_, i) => i !== index);
            setFormData(prev => ({ ...prev, contactDetails: updatedContacts }));
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    
    const handleSubmit = async () => {
        if (!user || !user.college) return;
        setSubmitError(null);
        if (!formData.title.trim() || !formData.description.trim() || !formData.date || !formData.time || !formData.venue.trim()) {
            setSubmitError('Please fill in title, description, date, time, and venue before submitting.');
            return;
        }
        setIsLoading(true);
        try {
            let posterUrl = `https://picsum.photos/seed/${Date.now()}/400/200`;
            
            if (posterFile) {
                posterUrl = await apiUploadPoster(posterFile, formData.audience);
            }

            await addEvent({
                ...formData,
                posterUrl,
                createdBy: user.id,
                college: user.college,
                status: 'pending',
                category: ['New'],
                organizer: { name: user.department ? `${user.department} Department` : user.name }
            });
            navigate('/dashboard/manage-events');
        } catch (error: any) {
            setSubmitError(error?.message || 'Failed to submit event. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const steps = ["Details", "Schedule", "Audience", "Publish"];

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Publish New Event</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-1 mb-8">Follow the steps to submit your event for approval.</p>

            <div className="bg-surface dark:bg-surface-dark p-6 md:p-8 rounded-lg">
                {isMapModalOpen && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
                        <div className="bg-surface dark:bg-surface-dark rounded-lg shadow-xl p-6 w-full max-w-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold font-display">Pin Location</h3>
                                <button onClick={() => setIsMapModalOpen(false)} className="text-text-secondary hover:text-text-primary">✕</button>
                            </div>
                            
                            <div className="mb-4">
                                <div className="flex space-x-2">
                                    <div className="relative flex-1">
                                        <input 
                                            type="text" 
                                            placeholder="Search for an address (e.g. Salem, Tamil Nadu)" 
                                            value={addressSearch}
                                            onChange={(e) => setAddressSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                            className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                        {addressSearch && (
                                            <button 
                                                onClick={() => setAddressSearch('')}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                    <button 
                                        onClick={handleAddressSearch}
                                        disabled={isSearching}
                                        className="bg-accent text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
                                    >
                                        {isSearching ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Searching...</span>
                                            </>
                                        ) : (
                                            <span>Search</span>
                                        )}
                                    </button>
                                    <button 
                                        onClick={handleLocateMe}
                                        disabled={isSearching}
                                        className="bg-secondary/10 text-secondary border border-secondary/20 px-3 py-2 rounded-md text-sm font-semibold hover:bg-secondary/20 transition-colors"
                                        title="Use my current location"
                                    >
                                        📍
                                    </button>
                                </div>
                                {formData.location.address && (
                                    <p className="mt-2 text-[10px] text-text-secondary dark:text-text-secondary-dark truncate">
                                        Found: <span className="font-medium text-accent">{formData.location.address}</span>
                                    </p>
                                )}
                            </div>

                            <div className="aspect-video bg-primary dark:bg-primary-dark rounded-md relative overflow-hidden border border-border-color dark:border-border-color-dark">
                                <iframe 
                                    key={mapVersion}
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    style={{ border: 0 }} 
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(currentMapQuery)}&z=17&output=embed`} 
                                    allowFullScreen
                                ></iframe>
                                {isSearching && (
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                                        <div className="bg-surface dark:bg-surface-dark px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-xs font-semibold">Updating Map...</span>
                                        </div>
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-8 h-8 text-accent">📍</div>
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 bg-surface/90 dark:bg-surface-dark/90 p-3 rounded-md shadow-md text-xs">
                                    <p className="font-semibold mb-1">Simulated Map Picker</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="number" 
                                            step="0.0001" 
                                            value={formData.location.lat} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, lat: parseFloat(e.target.value) } }))}
                                            className="bg-primary dark:bg-primary-dark border border-border-color p-1 rounded"
                                            placeholder="Latitude"
                                        />
                                        <input 
                                            type="number" 
                                            step="0.0001" 
                                            value={formData.location.lng} 
                                            onChange={(e) => setFormData(prev => ({ ...prev, location: { ...prev.location, lng: parseFloat(e.target.value) } }))}
                                            className="bg-primary dark:bg-primary-dark border border-border-color p-1 rounded"
                                            placeholder="Longitude"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button 
                                    onClick={() => setIsMapModalOpen(false)}
                                    className="bg-accent text-white px-6 py-2 rounded-md font-semibold"
                                >
                                    Confirm Location
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                <div className="flex items-center justify-between mb-12">
                    {steps.map((title, index) => (
                        <React.Fragment key={index}>
                            <StepIndicator 
                                step={index + 1} 
                                title={title}
                                isCurrent={currentStep === index + 1}
                                isCompleted={currentStep > index + 1}
                            />
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 transition-colors duration-300 ${currentStep > index + 1 ? 'bg-teal-500' : 'bg-border-color dark:bg-border-color-dark'}`}></div>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                <div className="animate-fadeIn">
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold font-display mb-4 text-text-primary dark:text-text-primary-dark">Event Details</h2>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Event Title</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g. Annual Hackathon 2024" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Event Description & Rules</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Tell attendees about your event..." rows={4} className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"></textarea>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-md font-bold text-text-primary dark:text-text-primary-dark">Organizers / Contacts</h3>
                                    <button 
                                        type="button" 
                                        onClick={addContact}
                                        className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-md hover:bg-accent/20 transition-colors font-semibold"
                                    >
                                        + Add Organizer
                                    </button>
                                </div>
                                {formData.contactDetails.map((contact, index) => (
                                    <div key={index} className="p-4 bg-primary dark:bg-primary-dark rounded-md border border-border-color dark:border-border-color-dark relative group">
                                        {formData.contactDetails.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeContact(index)}
                                                className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Name</label>
                                                <input type="text" value={contact.name} onChange={(e) => handleContactChange(index, 'name', e.target.value)} placeholder="Organizer Name" className="w-full bg-surface dark:bg-surface-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Email</label>
                                                <input type="email" value={contact.email} onChange={(e) => handleContactChange(index, 'email', e.target.value)} placeholder="organizer@college.edu" className="w-full bg-surface dark:bg-surface-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Phone</label>
                                                <input type="tel" value={contact.phone} onChange={(e) => handleContactChange(index, 'phone', e.target.value)} placeholder="+91 98765 43210" className="w-full bg-surface dark:bg-surface-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Upload Poster (Image)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
                                    className="w-full text-sm text-text-secondary dark:text-text-secondary-dark file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20"
                                />
                                {posterFile && <p className="mt-1 text-xs text-teal-500">Selected: {posterFile.name}</p>}
                            </div>
                        </div>
                    )}
                    {currentStep === 2 && (
                         <div className="space-y-4 animate-fadeIn">
                            <h2 className="text-xl font-bold font-display mb-4 text-text-primary dark:text-text-primary-dark">Schedule & Venue</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Date</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Time</label>
                                    <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Venue Name</label>
                                <input type="text" name="venue" value={formData.venue} onChange={handleChange} placeholder="e.g. APJ Abdul Kalam Auditorium" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Map Location</label>
                                <div className="flex items-center space-x-4">
                                    <button 
                                        onClick={() => setIsMapModalOpen(true)}
                                        className="bg-accent/10 text-accent border border-accent/20 px-4 py-2 rounded-md text-sm font-semibold hover:bg-accent/20 transition-colors"
                                    >
                                        Pin Location on Google Map
                                    </button>
                                    <span className="text-xs text-text-secondary dark:text-text-secondary-dark italic">
                                        {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {currentStep === 3 && (
                        <div className="space-y-4 animate-fadeIn">
                           <h2 className="text-xl font-bold font-display mb-4 text-text-primary dark:text-text-primary-dark">Audience</h2>
                           <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Who can register for this event?</label>
                                <select name="audience" value={formData.audience} onChange={handleChange} className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm">
                                    <option value="inter">Same-College Students</option>
                                    <option value="outer">Inter-College Students (Public)</option>
                                </select>
                           </div>
                        </div>
                    )}
                     {currentStep === 4 && (
                        <div className="text-center animate-fadeIn">
                           <h2 className="text-xl font-bold font-display mb-4 text-text-primary dark:text-text-primary-dark">Review & Publish</h2>
                           <p className="text-text-secondary dark:text-text-secondary-dark mb-6">You are about to submit "{formData.title}" for approval. Once submitted, it will be reviewed by the management.</p>
                           {submitError && (
                               <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/20 text-sm text-red-500">
                                   {submitError}
                               </div>
                           )}
                        </div>
                    )}
                </div>

                <div className="flex justify-between mt-8 border-t border-border-color dark:border-border-color-dark pt-6">
                    <button 
                        onClick={prevStep} 
                        disabled={currentStep === 1 || isLoading}
                        className="bg-primary dark:bg-primary-dark hover:bg-slate-200 dark:hover:bg-slate-700/60 text-text-primary dark:text-text-primary-dark font-semibold px-6 py-2 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed border border-border-color dark:border-border-color-dark"
                    >
                        Back
                    </button>
                    {currentStep < steps.length ? (
                         <button onClick={nextStep} className="bg-accent hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-md transition-colors duration-200 flex items-center">
                            Next Step
                            <ArrowRightIcon className="w-4 h-4 ml-2" />
                        </button>
                    ) : (
                         <button 
                            onClick={handleSubmit} 
                            disabled={isLoading}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2 rounded-md transition-colors duration-200 flex items-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                         >
                            {isLoading ? 'Submitting...' : 'Submit for Approval'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublishEventPage;
