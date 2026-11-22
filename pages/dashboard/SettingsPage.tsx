import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiUpdatePassword } from '../../api';
import { validatePasswordStrength } from '../../src/utils/validation';

const SettingsPage: React.FC = () => {
    const { user, updateUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [savingProfile, setSavingProfile] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [updatingPassword, setUpdatingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
        }
    }, [user]);

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileMessage(null);
        const trimmed = name.trim();
        if (!trimmed) {
            setProfileMessage({ type: 'error', text: 'Full name cannot be empty.' });
            return;
        }
        setSavingProfile(true);
        try {
            await updateUser({ name: trimmed });
            setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err: any) {
            setProfileMessage({ type: 'error', text: err?.message || 'Failed to update profile.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordMessage(null);

        if (!currentPassword || !newPassword || !confirmPassword) {
            setPasswordMessage({ type: 'error', text: 'Please fill in all password fields.' });
            return;
        }
        const strength = validatePasswordStrength(newPassword);
        if (!strength.valid) {
            setPasswordMessage({ type: 'error', text: strength.message || 'Password is too weak.' });
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordMessage({ type: 'error', text: "New passwords don't match!" });
            return;
        }

        setUpdatingPassword(true);
        try {
            await apiUpdatePassword(currentPassword, newPassword);
            setPasswordMessage({ type: 'success', text: 'Password updated successfully!' });
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordMessage({ type: 'error', text: err?.message || 'Failed to update password.' });
        } finally {
            setUpdatingPassword(false);
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-display font-bold text-text-primary dark:text-text-primary-dark">Settings</h1>
            <p className="text-text-secondary dark:text-text-secondary-dark mt-2 mb-8">
                Manage your account settings and preferences.
            </p>

            <div className="max-w-2xl space-y-10">
                {/* Profile Information */}
                <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold font-display text-text-primary dark:text-text-primary-dark mb-4">Profile Information</h2>
                    <form className="space-y-4" onSubmit={handleProfileSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Email Address</label>
                            <input type="email" value={user?.email || ''} disabled className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm disabled:opacity-50" />
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Role</label>
                                <input type="text" value={user?.role ? user.role.toUpperCase() : ''} disabled className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm disabled:opacity-50" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">College</label>
                                <input type="text" value={user?.college || ''} disabled className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 text-sm disabled:opacity-50" />
                            </div>
                        </div>

                        {profileMessage && (
                            <div className={`p-2.5 rounded-md border text-xs ${
                                profileMessage.type === 'success'
                                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                                {profileMessage.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="bg-accent hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-md disabled:bg-gray-400"
                            >
                                {savingProfile ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-surface dark:bg-surface-dark p-6 rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold font-display text-text-primary dark:text-text-primary-dark mb-4">Change Password</h2>
                     <form className="space-y-4" onSubmit={handlePasswordSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Current Password</label>
                            <input type="password" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">New Password</label>
                            <input type="password" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                            <p className="text-[11px] text-text-secondary dark:text-text-secondary-dark mt-1">
                                Min 8 chars with uppercase, lowercase, number, and special character.
                            </p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-text-secondary dark:text-text-secondary-dark mb-1">Confirm New Password</label>
                            <input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="w-full bg-primary dark:bg-primary-dark border border-border-color dark:border-border-color-dark rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-accent text-sm" />
                        </div>

                        {passwordMessage && (
                            <div className={`p-2.5 rounded-md border text-xs ${
                                passwordMessage.type === 'success'
                                    ? 'bg-teal-500/10 border-teal-500/20 text-teal-600 dark:text-teal-400'
                                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                                {passwordMessage.text}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={updatingPassword}
                                className="bg-accent hover:bg-orange-600 text-white font-semibold px-6 py-2 rounded-md disabled:bg-gray-400"
                            >
                                {updatingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
export default SettingsPage;
