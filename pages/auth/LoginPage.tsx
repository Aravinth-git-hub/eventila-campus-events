import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/icons/IconCollection';
import { useAuth } from '../../contexts/AuthContext';
import { apiResendVerificationEmail } from '../../api';
import { isValidEmail } from '../../src/utils/validation';
import type { UserRole } from '../../types';

function getDashboardRouteForRole(role: UserRole): string {
  switch (role) {
    case 'student':
      return '/dashboard/overview';
    case 'faculty':
      return '/dashboard/overview';
    case 'hod':
      return '/dashboard/overview';
    default:
      return '/events';
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const navState = location.state as { signupSuccess?: string; verificationSuccess?: string } | null;
  const statusBanner = navState?.verificationSuccess || navState?.signupSuccess;

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={getDashboardRouteForRole(user.role)} replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setResendFeedback(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedInUser = await login(trimmedEmail, password);
      navigate(getDashboardRouteForRole(loggedInUser.role), { replace: true });
    } catch (err: any) {
      const msg = err?.message || 'Incorrect email or password.';
      setError(msg);
      if (
        err?.code === 'EMAIL_NOT_CONFIRMED' ||
        msg.toLowerCase().includes('not verified')
      ) {
        setNeedsVerification(true);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setResendFeedback({ type: 'error', text: 'Please enter your registered email address above.' });
      return;
    }
    setResending(true);
    setResendFeedback(null);
    try {
      await apiResendVerificationEmail(trimmedEmail);
      setResendFeedback({
        type: 'success',
        text: `Verification link resent to ${trimmedEmail}. Please check your inbox.`,
      });
    } catch (err: any) {
      setResendFeedback({
        type: 'error',
        text: err?.message || 'Failed to resend verification email.',
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-primary dark:bg-primary-dark min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link to="/"><Logo /></Link>
        </div>
        <div className="bg-surface dark:bg-surface-dark p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark text-center mb-2">
            Welcome Back!
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 text-sm">
            Log in to continue to your dashboard.
          </p>

          {statusBanner && !error && (
            <div className="mb-4 p-3 rounded-md bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400 text-center">
              {statusBanner}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center space-y-2">
                <p>{error}</p>
                {needsVerification && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="inline-block text-accent hover:underline font-semibold disabled:opacity-50"
                  >
                    {resending ? 'Sending verification email...' : 'Resend Verification Email'}
                  </button>
                )}
              </div>
            )}

            {resendFeedback && (
              <div
                className={`p-2.5 rounded-md border text-xs text-center ${
                  resendFeedback.type === 'success'
                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}
              >
                {resendFeedback.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
