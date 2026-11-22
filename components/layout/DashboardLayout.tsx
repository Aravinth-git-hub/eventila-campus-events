import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Logo, SunIcon, MoonIcon, ChartBarIcon, UsersIcon, CalendarIcon, CheckCircleIcon, UserIcon, ArrowRightIcon, BellIcon, ClipboardListIcon, PencilAltIcon, MenuIcon, XIcon } from '../icons/IconCollection';
import { useTheme } from '../../contexts/ThemeContext';
import type { UserRole } from '../../types';
import { useEvents } from '../../contexts/EventContext';

interface NavItem {
    path: string;
    label: string;
    icon: React.ReactNode;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    { path: '/dashboard/overview', label: 'Overview', icon: <ChartBarIcon className="w-5 h-5" />, roles: ['student', 'faculty', 'hod'] },
    
    // Student
    { path: '/dashboard/available-events', label: 'Available Events', icon: <CalendarIcon className="w-5 h-5" />, roles: ['student'] },
    { path: '/dashboard/my-registrations', label: 'My Registrations', icon: <ClipboardListIcon className="w-5 h-5" />, roles: ['student'] },
    { path: '/dashboard/notifications', label: 'Notifications', icon: <BellIcon className="w-5 h-5" />, roles: ['student'] },

    // Faculty
    { path: '/dashboard/publish-event', label: 'Publish Event', icon: <PencilAltIcon className="w-5 h-5" />, roles: ['faculty'] },
    { path: '/dashboard/manage-events', label: 'Manage Events', icon: <CalendarIcon className="w-5 h-5" />, roles: ['faculty'] },
    { path: '/dashboard/manage-registrations', label: 'Registrations', icon: <UsersIcon className="w-5 h-5" />, roles: ['faculty'] },
    { path: '/dashboard/faculty-reports', label: 'Reports', icon: <ChartBarIcon className="w-5 h-5" />, roles: ['faculty'] },

    // HOD
    { path: '/dashboard/approvals', label: 'Approvals', icon: <CheckCircleIcon className="w-5 h-5" />, roles: ['hod'] },
    { path: '/dashboard/all-events', label: 'All Events', icon: <CalendarIcon className="w-5 h-5" />, roles: ['hod'] },
    { path: '/dashboard/reports', label: 'Reports', icon: <ChartBarIcon className="w-5 h-5" />, roles: ['hod'] },
    
    { path: '/dashboard/settings', label: 'Settings', icon: <UserIcon className="w-5 h-5" />, roles: ['student', 'faculty', 'hod'] },
];


const DashboardLayout: React.FC = () => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const { notifications } = useEvents();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    
    const myNotifications = user ? notifications.filter(n => n.userId === user.id) : [];

    const handleLogout = async () => {
        await logout();
        navigate('/login', { replace: true });
    };

    const accessibleNavItems = navItems.filter(item => user && item.roles.includes(user.role));

    const SidebarContent = () => (
        <>
            <div className="h-16 flex items-center px-4 border-b border-border-color dark:border-border-color-dark flex-shrink-0">
                <Link to="/"><Logo /></Link>
            </div>
            <nav className="flex-1 p-4 space-y-2" onClick={() => setIsSidebarOpen(false)}>
                {accessibleNavItems.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-accent/10 text-accent'
                                : 'text-text-secondary dark:text-text-secondary-dark hover:bg-primary dark:hover:bg-primary-dark'
                            }`
                        }
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
            <div className="p-4 border-t border-border-color dark:border-border-color-dark">
                <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors text-text-secondary dark:text-text-secondary-dark hover:bg-primary dark:hover:bg-primary-dark">
                    <ArrowRightIcon className="w-5 h-5 transform rotate-180" />
                    <span>Logout</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-primary dark:bg-primary-dark text-text-primary dark:text-text-primary-dark">
            {/* Mobile Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-64 bg-surface dark:bg-surface-dark border-r border-border-color dark:border-border-color-dark flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <SidebarContent />
            </aside>
             {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

            {/* Desktop Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-surface dark:bg-surface-dark border-r border-border-color dark:border-border-color-dark flex-col hidden md:flex md:fixed md:h-full">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="md:pl-64 flex-1 flex flex-col">
                {/* Topbar */}
                <header className="h-16 bg-surface dark:bg-surface-dark border-b border-border-color dark:border-border-color-dark flex-shrink-0 sticky top-0 z-20">
                    <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between h-full">
                        <button className="md:hidden p-2 -ml-2 text-text-secondary dark:text-text-secondary-dark" onClick={() => setIsSidebarOpen(true)}>
                            <MenuIcon className="w-6 h-6"/>
                        </button>
                        <div className="flex-1">
                             {/* Can add breadcrumbs or page title here, hidden on mobile */}
                        </div>
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-primary dark:hover:bg-primary-dark">
                                {theme === 'dark' ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
                            </button>
                             <div className="relative">
                                <button 
                                    onClick={() => user?.role === 'student' && navigate('/dashboard/notifications')}
                                    className="p-2 rounded-full hover:bg-primary dark:hover:bg-primary-dark"
                                    aria-label={`Notifications (${myNotifications.length})`}
                                >
                                    <BellIcon className="w-6 h-6 text-text-secondary dark:text-text-secondary-dark" />
                                    {myNotifications.length > 0 && (
                                        <span className="absolute top-1 right-1 flex h-3 w-3">
                                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                        </span>
                                    )}
                                </button>
                            </div>
                            <div className="flex items-center space-x-3">
                                {user?.avatarUrl && <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full" />}
                                <div className="hidden sm:block">
                                    <p className="text-sm font-semibold">{user?.name}</p>
                                    <p className="text-xs text-text-secondary dark:text-text-secondary-dark capitalize truncate max-w-[250px]">
                                        {user?.role}
                                        {user?.college && <span className="font-normal">, {user.college}</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;