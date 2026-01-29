import { useState, useEffect } from 'react';
import { supabase, Project } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Copy, Check, Trash2, Edit3, ChevronRight, Clock, FolderKanban } from 'lucide-react';


export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contextMarkdown, setContextMarkdown] = useState('');
  const [learningsSummary, setLearningsSummary] = useState('');

  useEffect(() => {
    if (user) fetchProjects();
  }, [user]);

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!title.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: title.trim(),
          description: description.trim() || null,
          context_markdown: '',
          learnings_summary: '',
        })
        .select()
        .single();

      if (error) throw error;
      setProjects([data, ...projects]);
      setShowNewForm(false);
      setTitle('');
      setDescription('');
      setSelectedProject(data);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  }

  async function updateProject() {
    if (!selectedProject) return;

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          title,
          description,
          context_markdown: contextMarkdown,
          learnings_summary: learningsSummary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProject.id);

      if (error) throw error;
      
      const updated = {
        ...selectedProject,
        title,
        description,
        context_markdown: contextMarkdown,
        learnings_summary: learningsSummary,
        updated_at: new Date().toISOString(),
      };
      
      setSelectedProject(updated);
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  function copyContext() {
    if (!selectedProject) return;
    
    const contextToCopy = `# ${selectedProject.title}

${selectedProject.description || ''}

## Context
${selectedProject.context_markdown}

## Key Learnings & Decisions
${selectedProject.learnings_summary}
`.trim();

    navigator.clipboard.writeText(contextToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openProject(project: Project) {
    setSelectedProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setContextMarkdown(project.context_markdown);
    setLearningsSummary(project.learnings_summary);
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Project detail view
  if (selectedProject) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProject(null)}
          className="text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ChevronRight className="rotate-180" size={16} />
          <span>Back to projects</span>
        </button>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-2xl font-bold bg-slate-700 text-white rounded px-3 py-1 w-full"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
                )}
                
                {isEditing ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Project description..."
                    className="mt-2 w-full bg-slate-700 text-slate-300 rounded px-3 py-2 text-sm"
                    rows={2}
                  />
                ) : (
                  selectedProject.description && (
                    <p className="text-slate-400 mt-1">{selectedProject.description}</p>
                  )
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {isEditing ? (
                  <>
                    <button
                      onClick={updateProject}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setTitle(selectedProject.title);
                        setDescription(selectedProject.description || '');
                        setContextMarkdown(selectedProject.context_markdown);
                        setLearningsSummary(selectedProject.learnings_summary);
                      }}
                      className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={copyContext}
                      className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      <span>{copied ? 'Copied!' : 'Copy Context'}</span>
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => deleteProject(selectedProject.id)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Project Context
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Paste important context here—code snippets, decisions, current state. Copy this into new AI chats when you lose context.
              </p>
              {isEditing ? (
                <textarea
                  value={contextMarkdown}
                  onChange={(e) => setContextMarkdown(e.target.value)}
                  className="w-full h-64 bg-slate-700 text-slate-100 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="# Current state&#10;&#10;## What's working&#10;- ...&#10;&#10;## What's left to do&#10;- ...&#10;&#10;## Key code&#10;```&#10;...&#10;```"
                />
              ) : (
                <div className="w-full min-h-32 bg-slate-700/50 text-slate-100 rounded-lg px-4 py-3 font-mono text-sm whitespace-pre-wrap">
                  {contextMarkdown || <span className="text-slate-500 italic">No context yet. Click edit to add.</span>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Key Learnings & Decisions
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Record important mistakes, insights, and why you made certain decisions.
              </p>
              {isEditing ? (
                <textarea
                  value={learningsSummary}
                  onChange={(e) => setLearningsSummary(e.target.value)}
                  className="w-full h-40 bg-slate-700 text-slate-100 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="- Don't use X because...&#10;- Chose Y over Z because...&#10;- Remember to always..."
                />
              ) : (
                <div className="w-full min-h-24 bg-slate-700/50 text-slate-100 rounded-lg px-4 py-3 font-mono text-sm whitespace-pre-wrap">
                  {learningsSummary || <span className="text-slate-500 italic">No learnings yet. Click edit to add.</span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Project list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Projects</h2>
          <p className="text-slate-400">Your AI project workspaces</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
        >
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {showNewForm && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <h3 className="text-lg font-medium text-white mb-4">Create New Project</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={2}
            />
            <div className="flex space-x-3">
              <button
                onClick={createProject}
                disabled={!title.trim()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setTitle('');
                  setDescription('');
                }}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <FolderKanban className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-300">No projects yet</h3>
          <p className="text-slate-500 mt-1">Create your first project to start tracking context</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <button
              key={project.id}
              onClick={() => openProject(project)}
              className="text-left bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-indigo-500 transition-colors group"
            >
              <h3 className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                {project.title}
              </h3>
              {project.description && (
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{project.description}</p>
              )}
              <div className="flex items-center space-x-1 text-slate-500 text-xs mt-3">
                <Clock size={12} />
                <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
