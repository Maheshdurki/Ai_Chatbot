import { useState } from 'react';
import { User, Lock, Check, ShieldCheck, Mail } from 'lucide-react';
import type { User as UserType } from '../types';
import { updateProfile, changeUserPassword } from '../services/api';

interface ProfileSettingsViewProps {
  user: UserType | null;
  onProfileUpdated: () => void;
}

export const ProfileSettingsView: React.FC<ProfileSettingsViewProps> = ({ user, onProfileUpdated }) => {
  const [fullName, setFullName] = useState(user?.full_name || 'Alex Learner');
  const [academicLevel, setAcademicLevel] = useState(user?.academic_level || 'Undergraduate');
  const [prefLang, setPrefLang] = useState(user?.preferred_language || 'en');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateProfile({
        full_name: fullName,
        academic_level: academicLevel,
        preferred_language: prefLang
      });
      onProfileUpdated();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    try {
      await changeUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to change password.');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-900 space-y-6">
      {/* Workspace Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          <User className="w-6 h-6 text-violet-400" />
          My Account & Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage your personal profile information, academic preferences, and account password.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Info Form */}
        <form onSubmit={handleUpdateProfile} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-violet-400" />
            Profile Details
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Email Address (Read-only)</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="email"
                value={user?.email || 'alex@edumate.ai'}
                disabled
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900/40 border border-slate-800/80 rounded-xl text-slate-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Academic Level</label>
              <select
                value={academicLevel}
                onChange={(e) => setAcademicLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="High School">High School</option>
                <option value="Undergraduate">Undergraduate</option>
                <option value="Graduate">Graduate</option>
                <option value="Self-Learner">Self-Learner</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Preferred Language</label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              >
                <option value="en">English 🇺🇸</option>
                <option value="te">Telugu 🇮🇳</option>
                <option value="hi">Hindi 🇮🇳</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold shadow-lg shadow-violet-600/20 transition-all flex items-center justify-center gap-2"
          >
            {profileSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Profile Updated!</span>
              </>
            ) : (
              <span>Save Profile Changes</span>
            )}
          </button>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-violet-400" />
            Security & Password
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-violet-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            {passwordSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Password Changed!</span>
              </>
            ) : (
              <span>Update Password</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
