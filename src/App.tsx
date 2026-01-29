import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ConversationsPage from './pages/ConversationsPage';
import PromptsPage from './pages/PromptsPage';
import InsightsPage from './pages/InsightsPage';
import ImportPage from './pages/ImportPage';
import LearningsPage from './pages/LearningsPage';

type Page = 'dashboard' | 'projects' | 'conversations' | 'prompts' | 'insights' | 'import' | 'learnings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

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

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'projects':
        return <ProjectsPage />;
      case 'conversations':
        return <ConversationsPage />;
      case 'prompts':
        return <PromptsPage />;
      case 'insights':
        return <InsightsPage />;
      case 'import':
        return <ImportPage />;
      case 'learnings':
        return <LearningsPage/>;
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
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
