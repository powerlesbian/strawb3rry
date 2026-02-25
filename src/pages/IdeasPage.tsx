import { useState, useEffect, useRef } from 'react';
import { supabase, Idea, Project } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Lightbulb, Trash2, Send } from 'lucide-react';

export default function IdeasPage() {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'title'>[]>([]);
  const [content, setContent] = useState('');
  const [projectId, setProjectId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (user) {
      fetchIdeas();
      fetchProjects();
    }
  }, [user]);

  async function fetchIdeas() {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setIdeas(data || []);
    } catch (error) {
      console.error('Error fetching ideas:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('id, title')
      .order('title');
    setProjects(data || []);
  }

  async function captureIdea() {
    if (!content.trim() || !user) return;
    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          user_id: user.id,
          content: content.trim(),
          project_id: projectId || null,
        })
        .select()
        .single();
      if (error) throw error;
      setIdeas([data, ...ideas]);
      setContent('');
      setProjectId('');
      textareaRef.current?.focus();
    } catch (error) {
      console.error('Error capturing idea:', error);
    }
  }

  async function deleteIdea(id: string) {
    try {
      const { error } = await supabase.from('ideas').delete().eq('id', id);
      if (error) throw error;
      setIdeas(ideas.filter((i) => i.id !== id));
    } catch (error) {
      console.error('Error deleting idea:', error);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      captureIdea();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Ideas</h2>
        <p className="text-slate-400">Quick capture for thoughts and ideas</p>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 space-y-3">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Capture an idea... (⌘↵ to save)"
          className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none text-sm"
          rows={3}
          autoFocus
        />
        <div className="flex items-center justify-between gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          <button
            onClick={captureIdea}
            disabled={!content.trim()}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={16} />
            <span>Capture</span>
          </button>
        </div>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <Lightbulb className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-300">No ideas yet</h3>
          <p className="text-slate-500 mt-1">Capture your first idea above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea) => {
            const linkedProject = projects.find((p) => p.id === idea.project_id);
            return (
              <div
                key={idea.id}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-start justify-between gap-4 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 text-sm whitespace-pre-wrap">{idea.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{new Date(idea.created_at).toLocaleString()}</span>
                    {linkedProject && (
                      <span className="px-2 py-0.5 bg-slate-700 rounded-full text-slate-400">
                        {linkedProject.title}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteIdea(idea.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded transition-all"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
