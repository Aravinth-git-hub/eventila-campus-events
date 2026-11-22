import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Public pages
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// Dashboard layout and pages
import DashboardLayout from './components/layout/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import SettingsPage from './pages/dashboard/SettingsPage';

// HOD specific pages
import ApprovalPage from './pages/dashboard/hod/ApprovalPage';
import AllEventsOverviewPage from './pages/dashboard/hod/AllEventsOverviewPage';
import ReportsPage from './pages/dashboard/hod/ReportsPage';

// Faculty specific pages
import PublishEventPage from './pages/dashboard/faculty/PublishEventPage';
import ManageEventsPage from './pages/dashboard/faculty/ManageEventsPage';
import ManageRegistrationsPage from './pages/dashboard/faculty/ManageRegistrationsPage';
import FacultyReportsPage from './pages/dashboard/faculty/FacultyReportsPage';

// Student specific pages
import MyRegistrationsPage from './pages/dashboard/student/MyRegistrationsPage';
import NotificationsPage from './pages/dashboard/student/NotificationsPage';
import AvailableEventsPage from './pages/dashboard/student/AvailableEventsPage';

import ProtectedRoute from './components/ProtectedRoute';
import SignInPage from './pages/SignInPage';
import { EventProvider } from './contexts/EventContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FullPageLoader } from './components/common/LoadingSpinner';

const AppRoutes: React.FC = () => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:eventId" element={<EventDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signin" element={<SignInPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'faculty', 'hod']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<OverviewPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* HOD Routes */}
        <Route
          path="approvals"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <ApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="all-events"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <AllEventsOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['hod']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Faculty Routes */}
        <Route
          path="publish-event"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <PublishEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-events"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <ManageEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="manage-registrations"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <ManageRegistrationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="faculty-reports"
          element={
            <ProtectedRoute allowedRoles={['faculty']}>
              <FacultyReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="available-events"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AvailableEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="my-registrations"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MyRegistrationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <EventProvider>
          <AppRoutes />
        </EventProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
