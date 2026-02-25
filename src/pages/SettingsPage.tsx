import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Check, User, Lock } from 'lucide-react';

export default function SettingsPage() {
  const { user, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user!.id)
      .single();
    setDisplayName(data?.display_name || user?.email?.split('@')[0] || '');
  }

  async function saveDisplayName() {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        display_name: displayName.trim(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      await refreshProfile();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 2000);
    } catch (err) {
      console.error('Error saving display name:', err);
    } finally {
      setSavingName(false);
    }
  }

  async function changePassword() {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400">Manage your account</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <User size={16} />
          Profile
        </h3>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <p className="text-slate-300 text-sm">{user?.email}</p>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Display name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveDisplayName()}
              className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={saveDisplayName}
              disabled={savingName || !displayName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              {nameSaved ? <><Check size={14} />Saved</> : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-4">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <Lock size={16} />
          Change Password
        </h3>
        <div>
          <label className="block text-xs text-slate-400 mb-1">New password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Confirm new password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
        <button
          onClick={changePassword}
          disabled={savingPassword || !newPassword || !confirmPassword}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 text-sm flex items-center gap-2"
        >
          {passwordSaved ? <><Check size={14} />Changed!</> : 'Change Password'}
        </button>
      </div>
    </div>
  );
}
