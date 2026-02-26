import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CryptoProvider } from './contexts/CryptoContext';
import Layout, { type Page } from './components/Layout';
import AuthPage from './pages/AuthPage';
import ProjectsPage from './pages/ProjectsPage';
import IdeasPage from './pages/IdeasPage';
import SecretsPage from './pages/SecretsPage';
import SettingsPage from './pages/SettingsPage';

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
      case 'secrets':
        return <SecretsPage />;
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
      <CryptoProvider>
        <AppContent />
      </CryptoProvider>
    </AuthProvider>
  );
}
