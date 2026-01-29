import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import Layout from './components/Layout';
import ProjectsPage from './pages/ProjectsPage';
import PromptsPage from './pages/PromptsPage';
import LearningsPage from './pages/LearningsPage';
import ProfilePage from './pages/ProfilePage';

type Page = 'projects' | 'prompts' | 'learnings' | 'profile';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('projects');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const pages = {
    projects: <ProjectsPage />,
    prompts: <PromptsPage />,
    learnings: <LearningsPage />,
    profile: <ProfilePage />,
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {pages[currentPage]}
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
