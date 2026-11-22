import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Logo, SunIcon, MoonIcon, MenuIcon, XIcon } from '../icons/IconCollection';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const PublicNavbar: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinkClass = ({ isActive }: { isActive: boolean }) => 
        `text-sm font-medium transition-colors ${isActive ? 'text-accent' : 'text-text-secondary dark:text-text-secondary-dark hover:text-text-primary dark:hover:text-text-primary-dark'}`;
    
    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) => 
        `block py-2 px-3 rounded-md text-base font-medium ${isActive ? 'bg-accent text-white' : 'text-text-primary dark:text-text-primary-dark hover:bg-surface dark:hover:bg-surface-dark'}`;


    return (
        <header className="bg-primary/80 dark:bg-primary-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-border-color dark:border-border-color-dark">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-8">
                        <Link to="/" onClick={() => setIsMenuOpen(false)}>
                            <Logo />
                        </Link>
                        <nav className="hidden md:flex space-x-6">
                            <NavLink to="/events" className={navLinkClass}>
                                Events
                            </NavLink>
                        </nav>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-surface dark:hover:bg-surface-dark transition-colors">
                            {theme === 'dark' ? (
                                <SunIcon className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                            ) : (
                                <MoonIcon className="w-5 h-5 text-text-secondary dark:text-text-secondary-dark" />
                            )}
                        </button>

                        <div className="hidden md:flex items-center space-x-2">
                            {user ? (
                                <Link to="/dashboard" className="bg-accent hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-md transition-colors text-sm">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link to="/login" className="text-text-primary dark:text-text-primary-dark font-medium px-4 py-2 rounded-md hover:bg-surface dark:hover:bg-surface-dark transition-colors text-sm">
                                        Login
                                    </Link>
                                    <Link to="/signup" className="bg-accent hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-md transition-colors text-sm">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                        
                        <div className="md:hidden">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-md text-text-secondary dark:text-text-secondary-dark hover:bg-surface dark:hover:bg-surface-dark">
                                <span className="sr-only">Open main menu</span>
                                {isMenuOpen ? <XIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile menu, show/hide based on menu state. */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 w-full bg-primary dark:bg-primary-dark shadow-lg border-t border-border-color dark:border-border-color-dark" id="mobile-menu">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <NavLink to="/events" className={mobileNavLinkClass} onClick={() => setIsMenuOpen(false)}>
                            Events
                        </NavLink>
                    </div>
                    <div className="pt-4 pb-3 border-t border-border-color dark:border-border-color-dark">
                        <div className="px-5 space-y-3">
                            {user ? (
                                <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-accent hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-md transition-colors text-sm">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <div className="flex flex-col space-y-3">
                                    <Link to="/login" onClick={() => setIsMenuOpen(false)} className="block w-full text-center text-text-primary dark:text-text-primary-dark font-medium px-4 py-2 rounded-md hover:bg-surface dark:hover:bg-surface-dark transition-colors text-sm">
                                        Login
                                    </Link>
                                    <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block w-full text-center bg-accent hover:bg-orange-600 text-white font-semibold px-4 py-2 rounded-md transition-colors text-sm">
                                        Sign Up
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default PublicNavbar;