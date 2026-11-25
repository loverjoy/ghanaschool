import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../hooks/useSchool';
import { Settings, Sparkles, ShieldCheck, Key, HelpCircle } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const schoolId = user?.school_id || null;
  const { school, updateSchoolSettings } = useSchool(schoolId);

  // Form States
  const [passMark, setPassMark] = useState<number | null>(null);
  const [multiStream, setMultiStream] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  // Sync state when school hook loads
  React.useEffect(() => {
    if (school) {
      setPassMark(school.passMark ?? 50);
      setMultiStream(!!school.multiStreamMode);
    }
  }, [school]);

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId) return;

    await updateSchoolSettings({
      passMark: Number(passMark),
      multiStreamMode: multiStream
    });

    setSettingsMsg('School operational parameters updated successfully.');
    setTimeout(() => setSettingsMsg(''), 4000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password !== confirmPassword) {
      setPwdMsg('Passwords do not match.');
      return;
    }
    setPwdMsg('Password updated successfully (sandbox environment).');
    setPassword('');
    setConfirmPassword('');
    setTimeout(() => setPwdMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-900 dark:text-white">User & Node Settings</h1>
        <p className="text-sm text-slate-500">Configure operational boundaries, change password keys, and edit user profile settings.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Side: School Settings (Admin only) */}
        {user?.role === 'admin' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
              <Settings size={18} />
              School Node Configurations
            </h3>
            <p className="text-xs text-slate-500">
              Modify criteria governing promotion pass rates and school-wide stream structures.
            </p>

            <form onSubmit={handleSaveSchoolSettings} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Academic Pass Mark Threshold (%)
                </label>
                <input
                  type="number"
                  min={30}
                  max={90}
                  required
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                  value={passMark ?? 50}
                  onChange={(e) => setPassMark(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-800 text-amber-500 focus:ring-0"
                    checked={multiStream}
                    onChange={(e) => setMultiStream(e.target.checked)}
                  />
                  Enable Multi-Stream Mode
                </label>
              </div>

              {settingsMsg && (
                <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded p-2.5 text-center">
                  {settingsMsg}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition text-xs"
              >
                Apply School Settings
              </button>
            </form>
          </div>
        )}

        {/* Right Side: Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-amber-500">
            <Key size={18} />
            Security & Authentication
          </h3>
          <p className="text-xs text-slate-500">Update password security parameters.</p>

          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">New Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs outline-none"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            {pwdMsg && (
              <div className={`text-xs p-2.5 rounded text-center border ${
                pwdMsg.includes('match') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
              }`}>
                {pwdMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition text-xs"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
