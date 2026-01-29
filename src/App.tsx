import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import PromptsPage from './pages/PromptsPage';
import LearningsPage from './pages/LearningsPage';
import ProfilePage from './pages/ProfilePage';
import ConversationsPage from './pages/ConversationsPage';

console.log('App.tsx loaded');

type Page = 'dashboard' | 'projects' | 'prompts' | 'learnings' | 'conversations' | 'profile';

function AppContent() {
    console.log('AppContent rendering');
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    console.log('Auth state:', { user: !!user, loading });

  if (loading) {
      console.log('Showing loading spinner');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
      console.log('No user, showing AuthPage');
    return <AuthPage />;
  }

  const pages = {
    dashboard: <DashboardPage onNavigate={setCurrentPage} />,
    projects: <ProjectsPage />,
    prompts: <PromptsPage />,
    learnings: <LearningsPage />,
    conversations: <ConversationsPage />,
    profile: <ProfilePage />,
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {pages[currentPage]}
    </Layout>
  );
}

export default function App() {
    console.log('App component rendering');
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
