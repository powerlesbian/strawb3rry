import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FolderKanban, 
  MessageSquare, 
  MessagesSquare, 
  Lightbulb, 
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react';

type Page = 'dashboard' | 'projects' | 'prompts' | 'learnings' | 'conversations' | 'profile';

type DashboardProps = {
  onNavigate: (page: Page) => void;
};

type Stats = {
  projects: number;
  prompts: number;
  conversations: number;
  learnings: number;
  avgRating: number;
  thisWeekConversations: number;
};

type RecentItem = {
  id: string;
  title: string;
  type: 'project' | 'prompt' | 'conversation' | 'learning';
  created_at: string;
};

export default function DashboardPage({ onNavigate }: DashboardProps) {
  const { profile } = useAuth();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    projects: 0,
    prompts: 0,
    conversations: 0,
    learnings: 0,
    avgRating: 0,
    thisWeekConversations: 0,
  });
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      // Fetch counts
      const [projectsRes, promptsRes, conversationsRes, learningsRes] = await Promise.all([
        supabase.from('projects').select('id, title, created_at', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('prompts').select('id, title, created_at', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('conversations').select('id, title, created_at, rating', { count: 'exact' }).eq('user_id', user?.id),
        supabase.from('learnings').select('id, title, created_at', { count: 'exact' }).eq('user_id', user?.id),
      ]);

      // Calculate stats
      const conversations = conversationsRes.data || [];
      const ratingsWithValues = conversations.filter(c => c.rating);
      const avgRating = ratingsWithValues.length > 0
        ? ratingsWithValues.reduce((sum, c) => sum + c.rating, 0) / ratingsWithValues.length
        : 0;

      const thisWeekConversations = conversations.filter(
        c => new Date(c.created_at) >= oneWeekAgo
      ).length;

      setStats({
        projects: projectsRes.count || 0,
        prompts: promptsRes.count || 0,
        conversations: conversationsRes.count || 0,
        learnings: learningsRes.count || 0,
        avgRating,
        thisWeekConversations,
      });

      // Combine and sort recent items
      const allItems: RecentItem[] = [
        ...(projectsRes.data || []).map(p => ({ ...p, type: 'project' as const })),
        ...(promptsRes.data || []).map(p => ({ ...p, type: 'prompt' as const })),
        ...(conversationsRes.data || []).map(c => ({ ...c, type: 'conversation' as const })),
        ...(learningsRes.data || []).map(l => ({ ...l, type: 'learning' as const })),
      ];

      allItems.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentItems(allItems.slice(0, 8));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  function getTypeIcon(type: string) {
    switch (type) {
      case 'project': return <FolderKanban size={16} className="text-blue-400" />;
      case 'prompt': return <MessageSquare size={16} className="text-purple-400" />;
      case 'conversation': return <MessagesSquare size={16} className="text-green-400" />;
      case 'learning': return <Lightbulb size={16} className="text-yellow-400" />;
      default: return null;
    }
  }

  function getTypePage(type: string): Page {
    switch (type) {
      case 'project': return 'projects';
      case 'prompt': return 'prompts';
      case 'conversation': return 'conversations';
      case 'learning': return 'learnings';
      default: return 'dashboard';
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const statCards = [
    { 
      label: 'Projects', 
      value: stats.projects, 
      icon: FolderKanban, 
      color: 'bg-blue-500/20 text-blue-400',
      page: 'projects' as Page
    },
    { 
      label: 'Prompts', 
      value: stats.prompts, 
      icon: MessageSquare, 
      color: 'bg-purple-500/20 text-purple-400',
      page: 'prompts' as Page
    },
    { 
      label: 'Conversations', 
      value: stats.conversations, 
      icon: MessagesSquare, 
      color: 'bg-green-500/20 text-green-400',
      page: 'conversations' as Page
    },
    { 
      label: 'Learnings', 
      value: stats.learnings, 
      icon: Lightbulb, 
      color: 'bg-yellow-500/20 text-yellow-400',
      page: 'learnings' as Page
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {profile?.display_name || 'there'}!
        </h1>
        <p className="text-slate-400 mt-1">Here's an overview of your AI learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => onNavigate(stat.page)}
              className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition-colors text-left group"
            >
              <div className={`inline-flex p-2 rounded-lg ${stat.color} mb-3`}>
                <Icon size={20} />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                {stat.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <TrendingUp size={18} className="text-indigo-400" />
            </div>
            <span className="text-slate-300 text-sm">This Week</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.thisWeekConversations}</p>
          <p className="text-xs text-slate-400">conversations logged</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Star size={18} className="text-yellow-400" />
            </div>
            <span className="text-slate-300 text-sm">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-slate-400">conversation quality</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap size={18} className="text-green-400" />
            </div>
            <span className="text-slate-300 text-sm">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {stats.projects + stats.prompts + stats.conversations + stats.learnings}
          </p>
          <p className="text-xs text-slate-400">across all sections</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center space-x-2">
            <Clock size={18} className="text-slate-400" />
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
        </div>
        
        {recentItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400">No activity yet. Start by creating a project or logging a conversation!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {recentItems.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                onClick={() => onNavigate(getTypePage(item.type))}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-700/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  {getTypeIcon(item.type)}
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{item.type}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-slate-500">{formatDate(item.created_at)}</span>
                  <ArrowRight size={16} className="text-slate-500" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('projects')}
          className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center transition-colors"
        >
          <FolderKanban size={24} className="mx-auto text-blue-400 mb-2" />
          <span className="text-sm text-slate-300">New Project</span>
        </button>
        <button
          onClick={() => onNavigate('prompts')}
          className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center transition-colors"
        >
          <MessageSquare size={24} className="mx-auto text-purple-400 mb-2" />
          <span className="text-sm text-slate-300">Build Prompt</span>
        </button>
        <button
          onClick={() => onNavigate('conversations')}
          className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center transition-colors"
        >
          <MessagesSquare size={24} className="mx-auto text-green-400 mb-2" />
          <span className="text-sm text-slate-300">Log Conversation</span>
        </button>
        <button
          onClick={() => onNavigate('learnings')}
          className="p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-center transition-colors"
        >
          <Lightbulb size={24} className="mx-auto text-yellow-400 mb-2" />
          <span className="text-sm text-slate-300">Add Learning</span>
        </button>
      </div>
    </div>
  );
}
