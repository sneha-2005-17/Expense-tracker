import React, { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { getApiError } from '../utils/apiError';

const Profile = () => {
  const { user, loadUser } = useAuth();
  const { success, error: notifyError } = useNotifications();
  const [profile, setProfile] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await api.put('/auth/profile', profile);
      localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
      await loadUser();
      success('Profile updated successfully');
    } catch (err) {
      notifyError(getApiError(err, 'Failed to update profile'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      notifyError('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.put('/auth/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      success('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      notifyError(getApiError(err, 'Failed to update password'));
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 page-enter">
      <div className="glass-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-violet-500/5" />
        <div className="relative flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-primary text-3xl font-bold text-white shadow-glow">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
            <p className="text-slate-500">{user?.email}</p>
            <span className="mt-2 inline-block rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-600 dark:text-primary-400">
              Premium Member
            </span>
          </div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="mb-6 text-lg font-bold">Profile information</h3>
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input
              className="input-field"
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              className="input-field"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={savingProfile}>
            {savingProfile ? <LoadingSpinner size="sm" /> : 'Save changes'}
          </button>
        </form>
      </div>

      <div className="glass-card">
        <h3 className="mb-6 text-lg font-bold">Security</h3>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current password</label>
            <input
              type="password"
              className="input-field"
              value={passwords.currentPassword}
              onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input-field"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input-field"
                value={passwords.confirm}
                onChange={(e) => setPasswords((p) => ({ ...p, confirm: e.target.value }))}
              />
            </div>
          </div>
          <button type="submit" className="btn-secondary" disabled={savingPassword}>
            {savingPassword ? <LoadingSpinner size="sm" /> : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
