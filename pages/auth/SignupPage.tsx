import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Logo, UserIcon, AcademicCapIcon, BuildingOfficeIcon } from '../../components/icons/IconCollection';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetchColleges } from '../../api';
import { isValidEmail, isValidPhone, validatePasswordStrength } from '../../src/utils/validation';
import type { User, UserRole, College } from '../../types';

const StepIndicator: React.FC<{ currentStep: number; totalSteps: number }> = ({ currentStep, totalSteps }) => (
  <div className="flex items-center justify-center space-x-2 mb-8">
    {Array.from({ length: totalSteps }).map((_, index) => (
      <div
        key={index}
        className={`w-2 h-2 rounded-full transition-colors duration-300 ${
          index + 1 === currentStep ? 'bg-accent' : 'bg-border-color dark:bg-border-color-dark'
        }`}
      ></div>
    ))}
  </div>
);

const RoleCard: React.FC<{ icon: React.ReactNode; label: string; selected: boolean; onClick: () => void }> = ({
  icon,
  label,
  selected,
  onClick,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full p-4 border-2 rounded-lg flex flex-col items-center justify-center space-y-2 transition-all duration-200 ${
      selected
        ? 'border-accent bg-accent/10 shadow-lg scale-105'
        : 'border-border-color dark:border-border-color-dark hover:border-accent/50 hover:bg-primary dark:hover:bg-primary-dark'
    }`}
  >
    <div className={`transition-colors ${selected ? 'text-accent' : 'text-text-secondary dark:text-text-secondary-dark'}`}>
      {icon}
    </div>
    <span className={`font-semibold text-sm transition-colors ${selected ? 'text-accent' : 'text-text-primary dark:text-text-primary-dark'}`}>
      {label}
    </span>
  </button>
);

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetchColleges().then((data) => {
      setColleges(data);
      if (data.length > 0) {
        setSelectedCollegeId(data[0].id);
      }
    });
  }, []);

  const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);

  useEffect(() => {
    if (selectedCollege && selectedRole) {
      if (!selectedCollege.availableRoles.some((r) => r.id === selectedRole)) {
        setSelectedRole(null);
      }
    }
  }, [selectedCollegeId, selectedCollege, selectedRole]);

  if (!authLoading && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleFinalSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!selectedRole || !selectedCollege) {
      setError('Please select your college and role.');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const getVal = (key: string) => (formData.get(key)?.toString() || '').trim();

    let name = '';
    let email = '';
    let department = '';
    let year: number | undefined = undefined;

    if (selectedRole === 'student') {
      const firstName = getVal('firstName');
      const lastName = getVal('lastName');
      const rollNumber = getVal('rollNumber');
      const gender = getVal('gender');
      const departmentYear = getVal('departmentYear');
      const mobile = getVal('mobile');
      email = getVal('email');

      if (!firstName || !lastName || !rollNumber || !gender || !departmentYear || !email || !mobile) {
        setError('Please fill in all required student fields.');
        return;
      }
      if (!isValidPhone(mobile)) {
        setError('Please enter a valid mobile number.');
        return;
      }

      name = `${firstName} ${lastName}`.trim();
      const parts = departmentYear.split('/').map((p) => p.trim());
      department = parts[0] || departmentYear;
      if (parts[1]) {
        const parsedYear = parseInt(parts[1], 10);
        if (!Number.isNaN(parsedYear)) year = parsedYear;
      }
    } else if (selectedRole === 'faculty') {
      const firstName = getVal('firstName');
      const lastName = getVal('lastName');
      department = getVal('department');
      email = getVal('email');

      if (!firstName || !lastName || !department || !email) {
        setError('Please fill in all required faculty fields.');
        return;
      }
      name = `${firstName} ${lastName}`.trim();
    } else if (selectedRole === 'hod') {
      const managementName = getVal('managementName');
      email = getVal('officialEmail');

      if (!managementName || !email) {
        setError('Please fill in all required management fields.');
        return;
      }
      name = managementName;
      department = 'Management';
    }

    if (!isValidEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const password = formData.get('password')?.toString() || '';
    const confirmPassword = formData.get('confirmPassword')?.toString() || '';

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      setError(passwordCheck.message);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const newUser: Omit<User, 'id'> = {
      name,
      email: email.toLowerCase(),
      role: selectedRole,
      college: selectedCollege.name,
      department: department || undefined,
      year,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=DA6308&color=fff`,
    };

    setSubmitting(true);
    try {
      await signup(newUser, password);
      form.reset();
      navigate('/login', {
        replace: true,
        state: {
          signupSuccess:
            'Registration successful! Please sign in using your registered email and password.',
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleIcon = (roleId: UserRole) => {
    switch (roleId) {
      case 'student':
        return <UserIcon className="w-8 h-8" />;
      case 'faculty':
        return <AcademicCapIcon className="w-8 h-8" />;
      case 'hod':
        return <BuildingOfficeIcon className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark text-center mb-2">
              Select Your College
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 text-sm">
              Let's get started by finding your institution.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStep(2);
              }}
            >
              <select
                value={selectedCollegeId}
                onChange={(e) => setSelectedCollegeId(e.target.value)}
                className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2.5 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              >
                {colleges.map((college) => (
                  <option key={college.id} value={college.id}>
                    {college.name}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={!selectedCollegeId}
                className="w-full mt-4 bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:bg-gray-400"
              >
                Submit
              </button>
            </form>
          </div>
        );

      case 2:
        return (
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark text-center mb-2">
              What is Your Role?
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 text-sm">
              This will help us personalize your experience.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
              {selectedCollege?.availableRoles.map((role) => (
                <RoleCard
                  key={role.id}
                  icon={getRoleIcon(role.id)}
                  label={role.label}
                  selected={selectedRole === role.id}
                  onClick={() => setSelectedRole(role.id)}
                />
              ))}
            </div>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedRole}
              className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          </div>
        );

      case 3: {
        const currentRoleInfo = selectedCollege?.availableRoles.find((r) => r.id === selectedRole);
        return (
          <div>
            <h2 className="text-2xl font-display font-bold text-text-primary dark:text-text-primary-dark text-center mb-2">
              Create Your {currentRoleInfo?.label} Account
            </h2>
            <p className="text-text-secondary dark:text-text-secondary-dark text-center mb-6 text-sm">
              Final step! Fill in your details below.
            </p>
            <form className="space-y-4" onSubmit={handleFinalSubmit}>
              {selectedRole === 'student' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      name="firstName"
                      type="text"
                      placeholder="First Name"
                      className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                      required
                    />
                    <input
                      name="lastName"
                      type="text"
                      placeholder="Last Name"
                      className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                      required
                    />
                  </div>
                  <input
                    name="rollNumber"
                    type="text"
                    placeholder="Roll Number"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                  <input
                    name="gender"
                    type="text"
                    placeholder="Gender"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                  <input
                    name="departmentYear"
                    type="text"
                    placeholder="Department / Year (e.g. CSE / 3)"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                  <input
                    name="mobile"
                    type="tel"
                    placeholder="Mobile Number"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                </>
              )}
              {selectedRole === 'faculty' && (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      name="firstName"
                      type="text"
                      placeholder="First Name"
                      className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                      required
                    />
                    <input
                      name="lastName"
                      type="text"
                      placeholder="Last Name"
                      className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                      required
                    />
                  </div>
                  <input
                    name="department"
                    type="text"
                    placeholder="Department"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                </>
              )}
              {selectedRole === 'hod' && (
                <>
                  <input
                    name="managementName"
                    type="text"
                    placeholder="Full Name"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                  <input
                    name="officialEmail"
                    type="email"
                    placeholder="Official Email"
                    autoComplete="email"
                    className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                    required
                  />
                </>
              )}
              <div>
                <input
                  name="password"
                  type="password"
                  placeholder="Create Password"
                  autoComplete="new-password"
                  className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                  required
                />
                <p className="text-[11px] text-text-secondary dark:text-text-secondary-dark mt-1">
                  Min 8 chars with uppercase, lowercase, number, and special character.
                </p>
              </div>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm Password"
                autoComplete="new-password"
                className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm"
                required
              />

              {error && (
                <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-xs text-red-500 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-accent hover:bg-orange-600 text-white font-semibold py-2.5 rounded-md transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        );
      }
      default:
        return null;
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
          <StepIndicator currentStep={step} totalSteps={3} />
          <div className="animate-fadeIn">{renderStep()}</div>
        </div>
        <div className="mt-6 text-center text-sm text-text-secondary dark:text-text-secondary-dark">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
