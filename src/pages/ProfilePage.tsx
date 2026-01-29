import { useAuth } from '../contexts/AuthContext';
import { User } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="flex items-center space-x-4 mb-6">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt="Profile"
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center">
              <User size={32} className="text-slate-400" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-white">
              {profile?.display_name || 'User'}
            </h2>
            <p className="text-slate-400">{user?.email}</p>
          </div>
        </div>
        <div className="text-sm text-slate-500">
          Profile settings coming soon...
        </div>
      </div>
    </div>
  );
}
