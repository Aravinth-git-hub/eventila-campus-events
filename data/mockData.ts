import type { User, CampusEvent, Registration, Notification, College, Testimonial } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Dr. Robert Vance',
    email: 'hod@aec.edu',
    role: 'hod',
    college: 'Annapoorana Engineering College, Salem',
    department: 'Management',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-2',
    name: 'Dr. Sarah Jenkins',
    email: 'faculty@aec.edu',
    role: 'faculty',
    college: 'Annapoorana Engineering College, Salem',
    department: 'Computer Science',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-3',
    name: 'Prof. David Miller',
    email: 'david@sct.edu',
    role: 'faculty',
    college: 'Sona College of Technology',
    department: 'Information Technology',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-4',
    name: 'John Doe',
    email: 'student@aec.edu',
    role: 'student',
    college: 'Annapoorana Engineering College, Salem',
    department: 'Computer Science',
    year: 3,
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80',
  },
  {
    id: 'user-5',
    name: 'Priya Sharma',
    email: 'priya@sct.edu',
    role: 'student',
    college: 'Sona College of Technology',
    department: 'Information Technology',
    year: 2,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80',
  }
];

export const INITIAL_EVENTS: CampusEvent[] = [
  {
    id: 'event-1',
    title: 'Tech Innovate 2026 Hackathon',
    description: '<p>Join us for a 24-hour national level hackathon exploring AI, IoT, and Cloud solutions. Prizes worth ₹1,00,000 up for grabs!</p><p>Rules & Guidelines:</p><ul><li>Teams of 2 to 4 members</li><li>Bring your own laptops and hardware kits</li><li>Mentors available on site</li></ul>',
    date: '2026-08-15',
    time: '09:00 AM',
    venue: 'Main Auditorium, AEC Campus',
    posterUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop',
    createdBy: 'user-2',
    college: 'Annapoorana Engineering College, Salem',
    audience: 'outer',
    status: 'approved',
    category: ['Tech', 'Academics'],
    organizer: {
      name: 'Computer Science Dept',
      logo: 'https://picsum.photos/seed/csdept/100/100',
    },
    location: {
      lat: 11.6643,
      lng: 78.1460,
      address: 'Annapoorana Engineering College, Sankari Main Road, NH-47, Salem, Tamil Nadu',
    },
    contactDetails: [
      { name: 'Dr. Sarah Jenkins', email: 'faculty@aec.edu', phone: '+91 98765 43210' },
      { name: 'John Doe', email: 'student@aec.edu', phone: '+91 98765 12345' }
    ],
  },
  {
    id: 'event-2',
    title: "Annual Cultural Fest - Resonance '26",
    description: '<p>A grand celebration of music, dance, drama, and fine arts across all engineering departments.</p><p>Key Highlights:</p><ul><li>Battle of the Bands</li><li>Choreography Night</li><li>Folk & Classical Dance</li></ul>',
    date: '2026-09-01',
    time: '10:00 AM',
    venue: 'Open Air Theatre, AEC Campus',
    posterUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop',
    createdBy: 'user-2',
    college: 'Annapoorana Engineering College, Salem',
    audience: 'inter',
    status: 'approved',
    category: ['Arts', 'Music', 'Social'],
    organizer: {
      name: 'Cultural Committee',
      logo: 'https://picsum.photos/seed/cultural/100/100',
    },
    location: {
      lat: 11.6643,
      lng: 78.1460,
      address: 'AEC Campus Open Air Theatre',
    },
    contactDetails: [
      { name: 'Dr. Sarah Jenkins', email: 'faculty@aec.edu', phone: '+91 98765 43210' }
    ],
  },
  {
    id: 'event-3',
    title: 'AI & Machine Learning Symposium',
    description: '<p>Guest lectures and paper presentations on cutting-edge generative AI models, computer vision, and NLP applications in industry.</p>',
    date: '2026-08-28',
    time: '10:30 AM',
    venue: 'Seminar Hall B, AEC Campus',
    posterUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop',
    createdBy: 'user-2',
    college: 'Annapoorana Engineering College, Salem',
    audience: 'inter',
    status: 'pending',
    category: ['Tech', 'Academics'],
    organizer: {
      name: 'Computer Science Dept',
      logo: 'https://picsum.photos/seed/csdept/100/100',
    },
    contactDetails: [
      { name: 'Dr. Sarah Jenkins', email: 'faculty@aec.edu', phone: '+91 98765 43210' }
    ],
  }
];

export const INITIAL_REGISTRATIONS: Registration[] = [
  {
    id: 'reg-1',
    eventId: 'event-1',
    userId: 'user-4',
    ticketStatus: 'Confirmed',
  },
  {
    id: 'reg-2',
    eventId: 'event-2',
    userId: 'user-4',
    ticketStatus: 'Confirmed',
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-4',
    message: 'Welcome to Eventila! You are registered for Tech Innovate 2026 Hackathon.',
    time: new Date().toLocaleString(),
    eventId: 'event-1',
  }
];

export const COLLEGES: College[] = [
  {
    id: 'aec',
    name: 'Annapoorana Engineering College, Salem',
    availableRoles: [
      { id: 'student', label: 'Student' },
      { id: 'faculty', label: 'Faculty' },
      { id: 'hod', label: 'Management' },
    ],
  },
  {
    id: 'sct',
    name: 'Sona College of Technology',
    availableRoles: [
      { id: 'student', label: 'Student' },
      { id: 'faculty', label: 'Faculty' },
    ],
  },
  {
    id: 'kiot',
    name: 'Knowledge Institute of Technology, Salem',
    availableRoles: [
      { id: 'student', label: 'Student' },
      { id: 'hod', label: 'Admin' },
    ],
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Eventila has revolutionized how we manage campus events. The approval workflow is a game-changer for us!",
    name: 'Dr. Evelyn Reed',
    role: 'Professor, CSE Dept.',
    imageUrl: 'https://picsum.photos/100/100?random=1',
  },
  {
    quote: "As a student, finding and registering for events has never been easier. I love the centralized platform.",
    name: 'Alex Johnson',
    role: '3rd Year, IT Student',
    imageUrl: 'https://picsum.photos/100/100?random=2',
  },
  {
    quote: "The analytics provide incredible insights into student engagement. It's an essential tool for our administration.",
    name: 'Dr. Samuel Chen',
    role: 'Head of Department, ECE',
    imageUrl: 'https://picsum.photos/100/100?random=3',
  },
];
