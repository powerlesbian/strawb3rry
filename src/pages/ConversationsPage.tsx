import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  X,
  Star,
  MessageSquare,
  Calendar,
  Tag,
  ChevronDown,
  Trash2,
  Edit3,
  FolderKanban,
} from 'lucide-react';

type Project = {
  id: string;
  title: string;
};

type Conversation = {
  id: string;
  title: string;
  ai_model: string | null;
  summary: string | null;
  what_worked: string | null;
  what_didnt_work: string | null;
  rating: number | null;
  transcript: string | null;
  tags: string[] | null;
  project_id: string | null;
  projects?: Project | null;
  created_at: string;
};

export default function ConversationsPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingConversation, setEditingConversation] = useState<Conversation | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    ai_model: '',
    summary: '',
    what_worked: '',
    what_didnt_work: '',
    rating: 0,
    transcript: '',
    tags: '',
    project_id: '',
  });

  const aiModels = [
    'Claude 3.5 Sonnet',
    'Claude 3.5 Haiku', 
    'Claude 3 Opus',
    'Claude 3 Sonnet',
    'Claude 3 Haiku',
    'GPT-4o',
    'GPT-4 Turbo',
    'GPT-4',
    'GPT-3.5 Turbo',
    'Gemini Pro',
    'Gemini Ultra',
    'Other',
  ];

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchProjects();
    }
  }, [user]);

  async function fetchConversations() {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, projects(id, title)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const conversationData = {
      user_id: user?.id,
      title: formData.title,
      ai_model: formData.ai_model || null,
      summary: formData.summary || null,
      what_worked: formData.what_worked || null,
      what_didnt_work: formData.what_didnt_work || null,
      rating: formData.rating || null,
      transcript: formData.transcript || null,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : null,
      project_id: formData.project_id || null,
    };

    try {
      if (editingConversation) {
        const { error } = await supabase
          .from('conversations')
          .update(conversationData)
          .eq('id', editingConversation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('conversations').insert([conversationData]);
        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      fetchConversations();
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this conversation?')) return;

    try {
      const { error } = await supabase.from('conversations').delete().eq('id', id);
      if (error) throw error;
      fetchConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      ai_model: '',
      summary: '',
      what_worked: '',
      what_didnt_work: '',
      rating: 0,
      transcript: '',
      tags: '',
      project_id: '',
    });
    setEditingConversation(null);
  }

  function openEditModal(conversation: Conversation) {
    setEditingConversation(conversation);
    setFormData({
      title: conversation.title,
      ai_model: conversation.ai_model || '',
      summary: conversation.summary || '',
      what_worked: conversation.what_worked || '',
      what_didnt_work: conversation.what_didnt_work || '',
      rating: conversation.rating || 0,
      transcript: conversation.transcript || '',
      tags: conversation.tags?.join(', ') || '',
      project_id: conversation.project_id || '',
    });
    setShowModal(true);
  }

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRating = filterRating === null || conv.rating === filterRating;
    const matchesProject = filterProject === null || conv.project_id === filterProject;

    return matchesSearch && matchesRating && matchesProject;
  });

  function StarRating({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={() => interactive && onRate?.(star)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
            disabled={!interactive}
          >
            <Star
              size={interactive ? 24 : 16}
              className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}
            />
          </button>
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Conversations</h1>
          <p className="text-slate-400 mt-1">Log and learn from your AI interactions</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Log Conversation</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterRating ?? ''}
          onChange={(e) => setFilterRating(e.target.value ? Number(e.target.value) : null)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => (
            <option key={r} value={r}>{r} Stars</option>
          ))}
        </select>

        <select
          value={filterProject ?? ''}
          onChange={(e) => setFilterProject(e.target.value || null)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Conversations List */}
      {filteredConversations.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <MessageSquare size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No conversations yet</h3>
          <p className="text-slate-400 mb-6">Start logging your AI conversations to track what works</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Log Your First Conversation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredConversations.map((conv) => (
            <div
              key={conv.id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === conv.id ? null : conv.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-1">
                    <h3 className="text-white font-medium truncate">{conv.title}</h3>
                    {conv.ai_model && (
                      <span className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                        {conv.ai_model}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-slate-400">
                    {conv.rating && <StarRating rating={conv.rating} />}
                    <span className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{new Date(conv.created_at).toLocaleDateString()}</span>
                    </span>
                    {conv.projects && (
                      <span className="flex items-center space-x-1">
                        <FolderKanban size={14} />
                        <span>{conv.projects.title}</span>
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform ${expandedId === conv.id ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedId === conv.id && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
                  {conv.summary && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-1">Summary</h4>
                      <p className="text-slate-400 text-sm">{conv.summary}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {conv.what_worked && (
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-green-400 mb-1">What Worked</h4>
                        <p className="text-slate-300 text-sm">{conv.what_worked}</p>
                      </div>
                    )}
                    {conv.what_didnt_work && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <h4 className="text-sm font-medium text-red-400 mb-1">What Didn't Work</h4>
                        <p className="text-slate-300 text-sm">{conv.what_didnt_work}</p>
                      </div>
                    )}
                  </div>

                  {conv.tags && conv.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag size={14} className="text-slate-400" />
                      <div className="flex flex-wrap gap-2">
                        {conv.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {conv.transcript && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-1">Transcript</h4>
                      <pre className="text-slate-400 text-sm whitespace-pre-wrap bg-slate-900 p-3 rounded-lg max-h-48 overflow-y-auto">
                        {conv.transcript}
                      </pre>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => openEditModal(conv)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(conv.id)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingConversation ? 'Edit Conversation' : 'Log Conversation'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">AI Model</label>
                  <select
                    value={formData.ai_model}
                    onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select model...</option>
                    {aiModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Project</label>
                  <select
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">No project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rating</label>
                <StarRating
                  rating={formData.rating}
                  onRate={(r) => setFormData({ ...formData, rating: r })}
                  interactive
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Summary</label>
                <textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Brief summary of the conversation..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-green-400 mb-1">What Worked</label>
                  <textarea
                    value={formData.what_worked}
                    onChange={(e) => setFormData({ ...formData, what_worked: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-900 border border-green-500/30 rounded-lg text-white focus:outline-none focus:border-green-500"
                    placeholder="Techniques or prompts that worked well..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-red-400 mb-1">What Didn't Work</label>
                  <textarea
                    value={formData.what_didnt_work}
                    onChange={(e) => setFormData({ ...formData, what_didnt_work: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-900 border border-red-500/30 rounded-lg text-white focus:outline-none focus:border-red-500"
                    placeholder="What to avoid or improve next time..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="coding, debugging, creative (comma-separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Transcript (optional)</label>
                <textarea
                  value={formData.transcript}
                  onChange={(e) => setFormData({ ...formData, transcript: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  placeholder="Paste key parts of the conversation..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  {editingConversation ? 'Save Changes' : 'Log Conversation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
