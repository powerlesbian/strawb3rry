import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Profile</h2>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div className="flex items-center space-x-4">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name || 'Profile'}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold">
              {profile?.display_name?.[0] || profile?.email?.[0] || '?'}
            </div>
          )}
          
          <div>
            <h3 className="text-lg font-medium text-white">{profile?.display_name || 'Anonymous'}</h3>
            <p className="text-slate-400">{profile?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
