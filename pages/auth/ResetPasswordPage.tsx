import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/icons/IconCollection';
import { apiCompletePasswordRecovery } from '../../api';
import { validatePasswordStrength } from '../../src/utils/validation';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const strength = validatePasswordStrength(newPassword);
    if (!strength.valid) {
      setError(strength.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiCompletePasswordRecovery(newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Your recovery link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-primary dark:bg-primary-dark min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="bg-surface dark:bg-surface-dark p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark text-center mb-2">
            Reset Password
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 text-sm">
            Choose a strong new password for your account.
          </p>

          {success ? (
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-md bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400">
                Your password has been updated successfully! Redirecting to login...
              </div>
              <Link
                to="/login"
                className="block w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
                <p className="text-[11px] text-text-secondary dark:text-text-secondary-dark mt-1">
                  Min 8 chars with uppercase, lowercase, number, and special character.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
                />
              </div>

              {error && (
                <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
