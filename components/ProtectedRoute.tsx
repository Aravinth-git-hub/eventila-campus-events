import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FullPageLoader } from './common/LoadingSpinner';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-surface dark:bg-surface-dark border border-border-color dark:border-border-color-dark rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark mb-2">
            Access Denied
          </h2>
          <p className="text-sm text-text-secondary dark:text-text-secondary-dark mb-6">
            You do not have permission to view this page with your current role ({user.role}).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard/overview"
              className="bg-accent hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-md text-sm transition-colors"
            >
              Go to My Dashboard
            </Link>
            <Link
              to="/events"
              className="bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark text-text-primary dark:text-text-primary-dark font-semibold px-5 py-2.5 rounded-md text-sm hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
            >
              Browse Public Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;