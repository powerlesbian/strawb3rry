import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Plus,
  Search,
  X,
  Trash2,
  Edit3,
  Lightbulb,
  Tag,
  Calendar,
  FolderKanban,
  Sparkles,
} from 'lucide-react';

type Project = {
  id: string;
  title: string;
};

type Learning = {
  id: string;
  title: string;
  content: string | null;
  tags: string[] | null;
  project_id: string | null;
  projects?: Project | null;
  created_at: string;
};

export default function LearningsPage() {
  const { user } = useAuth();
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingLearning, setEditingLearning] = useState<Learning | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    project_id: '',
  });

useEffect(() => {
  if (user) {
    Promise.all([fetchLearnings(), fetchProjects()]).finally(() => setLoading(false));
  }
}, [user]);

  const allTags = Array.from(
    new Set(learnings.flatMap((l) => l.tags || []))
  ).sort();

  async function fetchLearnings() {
    try {
      const { data, error } = await supabase
        .from('learnings')
        .select('*, projects(id, title)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLearnings(data || []);
    } catch (error) {
      console.error('Error fetching learnings:', error);
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

    const learningData = {
      user_id: user?.id,
      title: formData.title,
      content: formData.content || null,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
      project_id: formData.project_id || null,
    };

    try {
      if (editingLearning) {
        const { error } = await supabase
          .from('learnings')
          .update(learningData)
          .eq('id', editingLearning.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('learnings').insert([learningData]);
        if (error) throw error;
      }

      setShowModal(false);
      resetForm();
      fetchLearnings();
    } catch (error) {
      console.error('Error saving learning:', error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this learning?')) return;

    try {
      const { error } = await supabase.from('learnings').delete().eq('id', id);
      if (error) throw error;
      fetchLearnings();
    } catch (error) {
      console.error('Error deleting learning:', error);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      content: '',
      tags: '',
      project_id: '',
    });
    setEditingLearning(null);
  }

  function openEditModal(learning: Learning) {
    setEditingLearning(learning);
    setFormData({
      title: learning.title,
      content: learning.content || '',
      tags: learning.tags?.join(', ') || '',
      project_id: learning.project_id || '',
    });
    setShowModal(true);
  }

  const filteredLearnings = learnings.filter((learning) => {
    const matchesSearch =
      learning.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      learning.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      learning.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag = filterTag === null || learning.tags?.includes(filterTag);
    const matchesProject = filterProject === null || learning.project_id === filterProject;

    return matchesSearch && matchesTag && matchesProject;
  });

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
          <h1 className="text-2xl font-bold text-white">Learnings</h1>
          <p className="text-slate-400 mt-1">Capture quick tips, insights, and lessons from AI chats</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span>Add Learning</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search learnings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500"
          />
        </div>

        <select
          value={filterTag ?? ''}
          onChange={(e) => setFilterTag(e.target.value || null)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
        >
          <option value="">All Tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>{tag}</option>
          ))}
        </select>

        <select
          value={filterProject ?? ''}
          onChange={(e) => setFilterProject(e.target.value || null)}
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.title}</option>
          ))}
        </select>
      </div>

      {/* Learnings Grid */}
      {filteredLearnings.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-xl border border-slate-700">
          <Lightbulb size={48} className="mx-auto text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No learnings yet</h3>
          <p className="text-slate-400 mb-6">Start capturing insights from your AI conversations</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
          >
            Add Your First Learning
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLearnings.map((learning) => (
            <div
              key={learning.id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-yellow-500/50 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Lightbulb size={18} className="text-yellow-400" />
                  <h3 className="text-white font-medium line-clamp-1">{learning.title}</h3>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(learning)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(learning.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {learning.content && (
                <p className="text-slate-300 text-sm mb-3 line-clamp-3">{learning.content}</p>
              )}

              <div className="space-y-2">
                {learning.tags && learning.tags.length > 0 && (
                  <div className="flex items-center flex-wrap gap-1">
                    <Tag size={12} className="text-slate-500" />
                    {learning.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{formatDate(learning.created_at)}</span>
                  </div>
                  {learning.projects && (
                    <div className="flex items-center space-x-1">
                      <FolderKanban size={12} />
                      <span className="truncate max-w-24">{learning.projects.title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {learnings.length > 0 && (
        <div className="flex items-center justify-center space-x-6 text-sm text-slate-400 pt-4">
          <div className="flex items-center space-x-2">
            <Sparkles size={16} className="text-yellow-400" />
            <span>{learnings.length} total learnings</span>
          </div>
          <div className="flex items-center space-x-2">
            <Tag size={16} />
            <span>{allTags.length} unique tags</span>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingLearning ? 'Edit Learning' : 'Add Learning'}
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
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="e.g., Better way to handle API errors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Details</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="What did you learn? Any code snippets or tips?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Project</label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                  placeholder="react, debugging, api (comma-separated)"
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
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                >
                  {editingLearning ? 'Save Changes' : 'Add Learning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}