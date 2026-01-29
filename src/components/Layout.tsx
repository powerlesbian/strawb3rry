import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  Sparkles,
  BarChart3,
  Menu,
  X,
  LogOut,
  Upload,
} from 'lucide-react';

type Page = 'dashboard' | 'projects' | 'conversations' | 'prompts' | 'insights' | 'import' | 'learnings';

const navigation: { name: string; page: Page; icon: React.ElementType }[] = [
  { name: 'Dashboard', page: 'dashboard', icon: LayoutDashboard },
  { name: 'Projects', page: 'projects', icon: FolderKanban },
  { name: 'Conversations', page: 'conversations', icon: MessageSquare },
  { name: 'Prompts', page: 'prompts', icon: Sparkles },
  { name: 'Insights', page: 'insights', icon: BarChart3 },
  { name: 'Import', page: 'import', icon: Upload },
];

type LayoutProps = {
  children: React.ReactNode;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
};

export default function Layout({ children, currentPage, setCurrentPage }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-800 border-r border-slate-700 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700">
          <h1 className="text-xl font-bold text-white">AI Journal</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.name}
                onClick={() => {
                  setCurrentPage(item.page);
                  setSidebarOpen(false);
                }}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition-colors w-full text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-4 py-2.5 w-full rounded-lg text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between h-16 px-4 bg-slate-800 border-b border-slate-700">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">AI Journal</h1>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
