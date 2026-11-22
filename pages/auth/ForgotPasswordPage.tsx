import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../../components/icons/IconCollection';
import { apiSendPasswordReset } from '../../api';
import { isValidEmail } from '../../src/utils/validation';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const trimmed = email.trim();
    if (!trimmed || !isValidEmail(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiSendPasswordReset(trimmed);
      setSuccessMessage(
        'If an account exists for that email address, a password recovery link has been sent. Please check your inbox.'
      );
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Unable to send reset link. Please try again.');
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
            Forgot Password?
          </h2>
          <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 text-sm">
            Enter your email to receive a password reset link.
          </p>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="p-2.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400 text-center">
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;