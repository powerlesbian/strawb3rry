import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  X,
  Copy,
  Check,
  Trash2,
  Edit3,
  FolderKanban,
  Tag,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

type Project = {
  id: string;
  title: string;
};

type Prompt = {
  id: string;
  title: string;
  content: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  project_id: string | null;
  projects?: Project | null;
  created_at: string;
};

const CATEGORIES = [
  'Coding',
  'Writing',
  'Analysis',
  'Creative',
  'Research',
  'Debugging',
  'Explanation',
  'Other',
];

export default function PromptsPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    description: '',
    category: '',
    tags: '',
    project_id: '',
  });

  useEffect(() => {
    if (user) {
      fetchPrompts();
      fetchProjects();
    }
  }, [user]);

  async function fetchPrompts() {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*, projects(id, title)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error('Error fetching prompts:', error);
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

    const promptData = {
      user_id: user?.id,
      title: formData.title,
      content: formData.content,
      description: formData.description || null,
      category: formData.category || null,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()) : null,
      project_id: formData.project_id || null,
    };

    try {
      if (editingPrompt) {
        const { error } = await supabase
          .from('prompts')
          .update(promptData)
          .eq('id', editingPrompt.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('prompts').insert([promptData]);
        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this prompt?')) return;

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      fetchPrompts();
    } catch (error) {
      console.error('Error deleting prompt:', error);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      description: '',
      category: '',
      tags: '',
      project_id: '',
    });
    setEditingPrompt(null);
  }

  function openEditModal(prompt: Prompt) {
    setEditingPrompt(prompt);
    setFormData({
      title: prompt.title,
      content: prompt.content,
      description: prompt.description || '',
      category: prompt.category || '',
      tags: prompt.tags?.join(', ') || '',
      project_id: prompt.project_id || '',
    });
    setShowModal(true);
  }

  async function copyToClipboard(prompt: Prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  const filteredPrompts = prompts.filter((prompt) => {
    const matchesSearch =
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = filterCategory === null || prompt.category === filterCategory;
    const matchesProject = filterProject === null || prompt.project_id === filterProject;

    return matchesSearch && matchesCategory && matchesProject;
  });

  function getCategoryColor(category: string | null) {
    switch (category) {
      case 'Coding': return 'bg-blue-500/20 text-blue-400';
      case 'Writing': return 'bg-purple-500/20 text-purple-400';
      case 'Analysis': return 'bg-green-500/20 text-green-400';
      case 'Creative': return 'bg-pink-500/20 text-pink-400';
      case 'Research': return 'bg-yellow-500/20 text-yellow-400';
      case 'Debugging': return 'bg-red-500/20 text-red-400';
      case 'Explanation': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
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
          <h1 className="text-2xl font-bold text-white">Prompts</h1>
          <p className="text-slate-400 mt-1">Build and organize your prompt library</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>New Prompt</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterCategory ?? ''}
          onChange={(e) => setFilterCategory(e.target.value || null)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
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

      {/* Prompts List */}
      {filteredPrompts.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Sparkles size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No prompts yet</h3>
          <p className="text-slate-400 mb-6">Start building your prompt library</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Create Your First Prompt
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(expandedId === prompt.id ? null : prompt.id)}
                className="p-4 cursor-pointer hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-white font-medium truncate">{prompt.title}</h3>
                      {prompt.category && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(prompt.category)}`}>
                          {prompt.category}
                        </span>
                      )}
                    </div>
                    {prompt.description && (
                      <p className="text-slate-400 text-sm mb-2 line-clamp-1">{prompt.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      {prompt.projects && (
                        <span className="flex items-center space-x-1">
                          <FolderKanban size={14} />
                          <span>{prompt.projects.title}</span>
                        </span>
                      )}
                      {prompt.tags && prompt.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Tag size={14} />
                          <span>{prompt.tags.length} tags</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(prompt);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      title="Copy prompt"
                    >
                      {copiedId === prompt.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                    <ChevronDown
                      size={20}
                      className={`text-slate-400 transition-transform ${expandedId === prompt.id ? 'rotate-180' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {expandedId === prompt.id && (
                <div className="px-4 pb-4 border-t border-slate-700 pt-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Prompt Content</h4>
                    <pre className="text-slate-300 text-sm whitespace-pre-wrap bg-slate-900 p-4 rounded-lg max-h-64 overflow-y-auto">
                      {prompt.content}
                    </pre>
                  </div>

                  {prompt.tags && prompt.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag size={14} className="text-slate-400" />
                      <div className="flex flex-wrap gap-2">
                        {prompt.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-2">
                    <button
                      onClick={() => copyToClipboard(prompt)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                      {copiedId === prompt.id ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedId === prompt.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => openEditModal(prompt)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
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
                {editingPrompt ? 'Edit Prompt' : 'New Prompt'}
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
                  placeholder="e.g., Code Review Assistant"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Brief description of what this prompt does"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select category...</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
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
                <label className="block text-sm font-medium text-slate-300 mb-1">Prompt Content *</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
                  placeholder="Enter your prompt here..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="react, typescript, api (comma-separated)"
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
                  {editingPrompt ? 'Save Changes' : 'Create Prompt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
