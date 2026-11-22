import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/icons/IconCollection';
import {
  apiResendVerificationEmail,
  apiVerifyEmailToken,
  type SupportedEmailOtpType,
} from '../../api';
import { isValidEmail } from '../../src/utils/validation';

const SUPPORTED_OTP_TYPES: SupportedEmailOtpType[] = [
  'email',
  'signup',
  'magiclink',
  'email_change',
];

const ConfirmEmailPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const parsedParams = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const hashParams = new URLSearchParams(
      location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    );

    const errorParam = searchParams.get('error') || hashParams.get('error');
    const errorCode =
      searchParams.get('error_code') || hashParams.get('error_code');
    const errorDescription =
      searchParams.get('error_description') ||
      hashParams.get('error_description');

    const tokenHash =
      searchParams.get('token_hash') || hashParams.get('token_hash') || '';
    const rawType = (
      searchParams.get('type') ||
      hashParams.get('type') ||
      ''
    ).toLowerCase();
    const validType = SUPPORTED_OTP_TYPES.includes(
      rawType as SupportedEmailOtpType
    )
      ? (rawType as SupportedEmailOtpType)
      : null;

    let initialError: string | null = null;
    if (errorParam || errorCode || errorDescription) {
      const combined = `${errorCode || ''} ${errorDescription || ''}`.toLowerCase();
      if (combined.includes('expired') || errorCode === 'otp_expired') {
        initialError =
          'Your confirmation link has expired. Please request a new confirmation email below.';
      } else {
        initialError =
          errorDescription ||
          'This confirmation link is invalid or has already been used. Please request a new confirmation email below.';
      }
    } else if (!tokenHash || !validType) {
      initialError =
        'Invalid or incomplete confirmation link. Please use the link from your email or request a new confirmation email below.';
    }

    return {
      tokenHash,
      type: validType,
      initialError,
    };
  }, [location.search, location.hash]);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(parsedParams.initialError);
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isSubmittingRef = useRef(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setError(parsedParams.initialError);
  }, [parsedParams.initialError]);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleConfirmSignUp = async () => {
    if (
      isSubmittingRef.current ||
      isVerifying ||
      isVerified ||
      !parsedParams.tokenHash ||
      !parsedParams.type
    ) {
      return;
    }

    isSubmittingRef.current = true;
    setIsVerifying(true);
    setError(null);

    try {
      await apiVerifyEmailToken(parsedParams.tokenHash, parsedParams.type);
      setIsVerified(true);
      redirectTimerRef.current = setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: {
            verificationSuccess:
              'Email verified successfully! Your account is now activated.',
          },
        });
      }, 1500);
    } catch (err: any) {
      setError(
        err?.message ||
          'This confirmation link is invalid or has expired. Please request a new confirmation email below.'
      );
    } finally {
      isSubmittingRef.current = false;
      setIsVerifying(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendFeedback(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
      setResendFeedback({
        type: 'error',
        text: 'Please enter a valid registered email address.',
      });
      return;
    }

    setResending(true);
    try {
      await apiResendVerificationEmail(trimmedEmail);
      setResendFeedback({
        type: 'success',
        text: `A new confirmation email has been sent to ${trimmedEmail}.`,
      });
    } catch (err: any) {
      setResendFeedback({
        type: 'error',
        text: err?.message || 'Failed to resend confirmation email.',
      });
    } finally {
      setResending(false);
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
        <div className="bg-surface dark:bg-surface-dark p-8 rounded-lg shadow-lg text-center space-y-4">
          <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark">
            Confirm Your Email
          </h2>

          {isVerified ? (
            <div className="space-y-4 animate-fadeIn">
              <div className="w-12 h-12 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto text-xl font-bold">
                ✓
              </div>
              <div className="p-3 rounded-md bg-teal-500/10 border border-teal-500/20 text-xs text-teal-600 dark:text-teal-400">
                Email verified successfully! Your account is now activated.
              </div>
              <p className="text-xs text-text-secondary dark:text-text-secondary-dark">
                Redirecting you to the login page...
              </p>
            </div>
          ) : error ? (
            <div className="space-y-4 text-left animate-fadeIn">
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center">
                {error}
              </div>

              <form className="space-y-3 pt-1" onSubmit={handleResend}>
                <div>
                  <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">
                    Request a New Confirmation Email
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
                  disabled={resending}
                  className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md text-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {resending ? 'Sending...' : 'Resend Confirmation Email'}
                </button>
              </form>

              <div className="text-center pt-1">
                <Link
                  to="/login"
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              <p className="text-sm text-text-secondary dark:text-text-secondary-dark">
                Please click the button below to verify your Eventila account.
              </p>

              <button
                type="button"
                onClick={handleConfirmSignUp}
                disabled={isVerifying}
                className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md text-sm transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isVerifying && (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                <span>{isVerifying ? 'Confirming...' : 'Confirm Sign Up'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmEmailPage;
