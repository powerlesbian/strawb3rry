import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart3,
  TrendingUp,
  MessageSquare,
  FolderKanban,
  Sparkles,
  Star,
  Calendar,
  Tag,
  Clock,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

type Stats = {
  totalProjects: number;
  totalConversations: number;
  totalPrompts: number;
  avgRating: number;
  conversationsByModel: { model: string; count: number }[];
  conversationsByProject: { project: string; count: number }[];
  conversationsOverTime: { date: string; count: number }[];
  topTags: { tag: string; count: number }[];
  recentActivity: { type: string; title: string; date: string }[];
  ratingDistribution: { rating: number; count: number }[];
};

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function InsightsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, timeRange]);

  async function fetchStats() {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date | null = null;

      if (timeRange === '7d') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '30d') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (timeRange === '90d') {
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      // Fetch projects count
      const { count: projectCount } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch prompts count
      const { count: promptCount } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id);

      // Fetch conversations with filters
      let conversationsQuery = supabase
        .from('conversations')
        .select('*, projects(title)')
        .eq('user_id', user?.id);

      if (startDate) {
        conversationsQuery = conversationsQuery.gte('created_at', startDate.toISOString());
      }

      const { data: conversations } = await conversationsQuery;

      // Calculate stats from conversations
      const totalConversations = conversations?.length || 0;

      // Average rating
      const ratedConversations = conversations?.filter((c) => c.rating) || [];
      const avgRating =
        ratedConversations.length > 0
          ? ratedConversations.reduce((sum, c) => sum + c.rating, 0) / ratedConversations.length
          : 0;

      // Conversations by model
      const modelCounts: Record<string, number> = {};
      conversations?.forEach((c) => {
        const model = c.ai_model || 'Unknown';
        modelCounts[model] = (modelCounts[model] || 0) + 1;
      });
      const conversationsByModel = Object.entries(modelCounts)
        .map(([model, count]) => ({ model, count }))
        .sort((a, b) => b.count - a.count);

      // Conversations by project
      const projectCounts: Record<string, number> = {};
      conversations?.forEach((c) => {
        const project = c.projects?.title || 'No Project';
        projectCounts[project] = (projectCounts[project] || 0) + 1;
      });
      const conversationsByProject = Object.entries(projectCounts)
        .map(([project, count]) => ({ project, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Conversations over time
      const dateCounts: Record<string, number> = {};
      conversations?.forEach((c) => {
        const date = new Date(c.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      });
      const conversationsOverTime = Object.entries(dateCounts)
        .map(([date, count]) => ({ date, count }))
        .slice(-14);

      // Top tags
      const tagCounts: Record<string, number> = {};
      conversations?.forEach((c) => {
        c.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });
      const topTags = Object.entries(tagCounts)
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Rating distribution
      const ratingCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      conversations?.forEach((c) => {
        if (c.rating) {
          ratingCounts[c.rating] = (ratingCounts[c.rating] || 0) + 1;
        }
      });
      const ratingDistribution = Object.entries(ratingCounts).map(([rating, count]) => ({
        rating: parseInt(rating),
        count,
      }));

      // Recent activity
      const { data: recentProjects } = await supabase
        .from('projects')
        .select('title, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentConversations } = await supabase
        .from('conversations')
        .select('title, created_at')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);

      const recentActivity = [
        ...(recentProjects?.map((p) => ({ type: 'project', title: p.title, date: p.created_at })) || []),
        ...(recentConversations?.map((c) => ({ type: 'conversation', title: c.title, date: c.created_at })) || []),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setStats({
        totalProjects: projectCount || 0,
        totalConversations,
        totalPrompts: promptCount || 0,
        avgRating,
        conversationsByModel,
        conversationsByProject,
        conversationsOverTime,
        topTags,
        recentActivity,
        ratingDistribution,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400">Failed to load insights</p>
      </div>
    );
  }

  const hasData = stats.totalConversations > 0 || stats.totalProjects > 0 || stats.totalPrompts > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Insights</h1>
          <p className="text-slate-400 mt-1">Analytics and patterns from your AI usage</p>
        </div>
        <div className="flex items-center space-x-2">
          {(['7d', '30d', '90d', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <BarChart3 size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No data yet</h3>
          <p className="text-slate-400">Start adding projects, conversations, and prompts to see insights</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Projects</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalProjects}</p>
                </div>
                <div className="p-3 bg-indigo-500/20 rounded-lg">
                  <FolderKanban className="text-indigo-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Conversations</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalConversations}</p>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <MessageSquare className="text-purple-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Prompts</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalPrompts}</p>
                </div>
                <div className="p-3 bg-pink-500/20 rounded-lg">
                  <Sparkles className="text-pink-400" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Avg Rating</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-500/20 rounded-lg">
                  <Star className="text-yellow-400" size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Activity Over Time */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <TrendingUp size={20} className="text-indigo-400" />
                <span>Activity Over Time</span>
              </h3>
              {stats.conversationsOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.conversationsOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#f8fafc' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ fill: '#6366f1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No activity data yet
                </div>
              )}
            </div>

            {/* Conversations by Model */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Target size={20} className="text-purple-400" />
                <span>By AI Model</span>
              </h3>
              {stats.conversationsByModel.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.conversationsByModel}
                      dataKey="count"
                      nameKey="model"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ model, percent }) => `${model} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {stats.conversationsByModel.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No model data yet
                </div>
              )}
            </div>
          </div>

          {/* Second Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* By Project */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FolderKanban size={20} className="text-green-400" />
                <span>By Project</span>
              </h3>
              {stats.conversationsByProject.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.conversationsByProject} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="project"
                      stroke="#94a3b8"
                      fontSize={12}
                      width={100}
                      tickFormatter={(value) => (value.length > 12 ? value.slice(0, 12) + '...' : value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No project data yet
                </div>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Star size={20} className="text-yellow-400" />
                <span>Rating Distribution</span>
              </h3>
              {stats.ratingDistribution.some((r) => r.count > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.ratingDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="rating"
                      stroke="#94a3b8"
                      fontSize={12}
                      tickFormatter={(value) => `${value}★`}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(value) => `${value} Stars`}
                    />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-500">
                  No ratings yet
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tags */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Tag size={20} className="text-cyan-400" />
                <span>Top Tags</span>
              </h3>
              {stats.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map((tag, index) => (
                    <span
                      key={tag.tag}
                      className="px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: `${COLORS[index % COLORS.length]}20`,
                        color: COLORS[index % COLORS.length],
                      }}
                    >
                      {tag.tag} ({tag.count})
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No tags used yet</p>
              )}
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Clock size={20} className="text-pink-400" />
                <span>Recent Activity</span>
              </h3>
              {stats.recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          activity.type === 'project' ? 'bg-indigo-500/20' : 'bg-purple-500/20'
                        }`}
                      >
                        {activity.type === 'project' ? (
                          <FolderKanban size={16} className="text-indigo-400" />
                        ) : (
                          <MessageSquare size={16} className="text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{activity.title}</p>
                        <p className="text-slate-500 text-xs">
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500">No recent activity</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
