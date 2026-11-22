export type UserRole = 'student' | 'faculty' | 'hod' | 'guest';

export interface College {
  id: string;
  name: string;
  availableRoles: { id: UserRole; label: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  college?: string;
  avatarUrl?: string;
  department?: string;
  year?: number;
}

export interface ContactPerson {
    name: string;
    email: string;
    phone: string;
}

export interface CampusEvent {
  id:string;
  title: string;
  description: string;
  date: string; // ISO 8601 format
  time: string;
  venue: string;
  posterUrl: string;
  createdBy: string; // faculty_id (user.id)
  college: string;
  audience: 'inter' | 'outer';
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  category: string[];
  organizer: {
    name: string;
    logo?: string;
  };
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
  contactDetails?: ContactPerson[];
}

export interface GuestRegistrationDetails {
    name: string;
    college: string;
    department: string;
    email: string;
    phone: string;
}

export interface Registration {
    id: string;
    eventId: string;
    userId?: string; // For internal students
    guestDetails?: GuestRegistrationDetails; // For external participants
    ticketStatus: 'Confirmed' | 'Pending';
}

export interface Notification {
    id: string;
    userId: string;
    message: string;
    time: string;
    eventId: string;
}


export interface Testimonial {
  quote: string;
  name:string;
  role: string;
  imageUrl: string;
}