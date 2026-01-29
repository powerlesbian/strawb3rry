import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, FolderKanban, MessageSquare, Lightbulb, User, MessagesSquare, LayoutDashboard } from 'lucide-react';

type Page = 'dashboard' | 'projects' | 'prompts' | 'learnings' | 'conversations' | 'profile';

type LayoutProps = {
  children: ReactNode;
  currentPage: Page;
  onNavigate: (page: Page) => void;
};

export default function Layout({ children, currentPage, onNavigate }: LayoutProps) {
  const { profile, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects' as const, label: 'Projects', icon: FolderKanban },
    { id: 'prompts' as const, label: 'Prompts', icon: MessageSquare },
    { id: 'conversations' as const, label: 'Conversations', icon: MessagesSquare },
    { id: 'learnings' as const, label: 'Learnings', icon: Lightbulb },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <button 
                onClick={() => onNavigate('dashboard')}
                className="text-xl font-bold text-white hover:text-indigo-400 transition-colors"
              >
                Strawb3rry
              </button>
              
              <nav className="hidden md:flex space-x-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        currentPage === item.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => onNavigate('profile')}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  currentPage === 'profile'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name || 'Profile'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User size={18} />
                )}
                <span className="hidden sm:inline">{profile?.display_name || 'Profile'}</span>
              </button>
              
              <button
                onClick={signOut}
                className="flex items-center space-x-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden flex border-t border-slate-700">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex-1 flex flex-col items-center py-3 transition-colors ${
                  currentPage === item.id
                    ? 'text-indigo-400 bg-slate-700/50'
                    : 'text-slate-400'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs mt-1">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
