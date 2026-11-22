import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import type { CampusEvent, Registration, Notification } from '../types';
import * as api from '../api';
import { useAuth } from './AuthContext';

interface EventContextType {
  events: CampusEvent[];
  registrations: Registration[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  addEvent: (event: Omit<CampusEvent, 'id'>) => Promise<void>;
  updateEvent: (eventId: string, updatedData: Partial<CampusEvent>) => Promise<void>;
  updateEventStatus: (eventId: string, status: CampusEvent['status']) => Promise<void>;
  removeEvent: (eventId: string) => Promise<void>;
  addRegistration: (registration: Omit<Registration, 'id'>) => Promise<void>;
  removeRegistration: (registrationId: string) => Promise<void>;
  updateRegistrationStatus: (registrationId: string, status: Registration['ticketStatus']) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedEvents = await api.apiFetchEvents();
      setEvents(fetchedEvents);

      if (isAuthenticated && user) {
        const [fetchedRegistrations, fetchedNotifications] = await Promise.all([
          api.apiFetchRegistrations(),
          api.apiFetchNotifications(),
        ]);
        setRegistrations(fetchedRegistrations);
        setNotifications(fetchedNotifications);
      } else {
        // Guests have no access to internal registrations or notifications
        setRegistrations([]);
        setNotifications([]);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load event data.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [fetchData, authLoading]);

  const addEvent = async (eventData: Omit<CampusEvent, 'id'>) => {
    const newEvent = await api.apiAddEvent(eventData);
    setEvents((prev) => [newEvent, ...prev]);
  };

  const updateEvent = async (eventId: string, updatedData: Partial<CampusEvent>) => {
    const updatedEvent = await api.apiUpdateEvent(eventId, updatedData);
    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));
  };

  const updateEventStatus = async (eventId: string, status: CampusEvent['status']) => {
    const updatedEvent = await api.apiUpdateEvent(eventId, { status });
    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));
  };

  const removeEvent = async (eventId: string) => {
    const removedId = await api.apiRemoveEvent(eventId);
    setEvents((prev) => prev.filter((e) => e.id !== removedId));
    setRegistrations((prev) => prev.filter((r) => r.eventId !== removedId));
  };

  const addRegistration = async (registrationData: Omit<Registration, 'id'>) => {
    const newRegistration = await api.apiAddRegistration(registrationData);
    if (isAuthenticated) {
      setRegistrations((prev) => [...prev, newRegistration]);
    }
  };

  const removeRegistration = async (registrationId: string) => {
    const removedId = await api.apiRemoveRegistration(registrationId);
    setRegistrations((prev) => prev.filter((r) => r.id !== removedId));
  };

  const updateRegistrationStatus = async (
    registrationId: string,
    status: Registration['ticketStatus']
  ) => {
    const updatedRegistration = await api.apiUpdateRegistrationStatus(registrationId, status);
    setRegistrations((prev) =>
      prev.map((reg) => (reg.id === registrationId ? updatedRegistration : reg))
    );
  };

  return (
    <EventContext.Provider
      value={{
        events,
        registrations,
        notifications,
        isLoading,
        error,
        refreshData: fetchData,
        addEvent,
        updateEvent,
        updateEventStatus,
        removeEvent,
        addRegistration,
        removeRegistration,
        updateRegistrationStatus,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvents = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventProvider');
  }
  return context;
};
