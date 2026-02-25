import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import ProjectsPage from './pages/ProjectsPage';

type Page = 'projects' | 'ideas' | 'settings';

// Placeholder pages - we'll build these out
function IdeasPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Ideas</h2>
      <p className="text-slate-400">Quick capture for thoughts and ideas. Coming soon.</p>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Settings</h2>
      <p className="text-slate-400">App preferences. Coming soon.</p>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('projects');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'projects':
        return <ProjectsPage />;
      case 'ideas':
        return <IdeasPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <ProjectsPage />;
    }
  };

  return (
    <Layout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
