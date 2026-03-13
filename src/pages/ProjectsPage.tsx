import { useState, useEffect } from 'react';
import { supabase, Project, ProjectColor, PROJECT_COLORS, Idea } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Copy, Check, Trash2, Edit3, ChevronRight, Clock, FolderKanban, Pin, Search, Lightbulb } from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';

function ColorPicker({ selected, onChange }: { selected: ProjectColor; onChange: (color: ProjectColor) => void }) {
  return (
    <div className="flex items-center space-x-2">
      {PROJECT_COLORS.map((color) => (
        <button
          key={color.name}
          type="button"
          onClick={() => onChange(color.name)}
          className={`w-6 h-6 rounded-full ${color.bg} ${
            selected === color.name ? 'ring-2 ring-offset-2 ring-offset-slate-800 ring-white' : ''
          }`}
        />
      ))}
    </div>
  );
}

function getColorClasses(color: ProjectColor) {
  const found = PROJECT_COLORS.find((c) => c.name === color);
  return found || PROJECT_COLORS[4];
}

function buildContextString(project: Project) {
  return `# ${project.title}

${project.description || ''}

## Context
${project.context_markdown}

## Key Learnings & Decisions
${project.learnings_summary}`.trim();
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectIdeas, setProjectIdeas] = useState<Idea[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('pinnedProjects') || '[]'); }
    catch { return []; }
  });

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contextMarkdown, setContextMarkdown] = useState('');
  const [learningsSummary, setLearningsSummary] = useState('');
  const [color, setColor] = useState<ProjectColor>('blue');

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
          color,
        })
        .select()
        .single();
      if (error) throw error;
      setProjects([data, ...projects]);
      setShowNewForm(false);
      setTitle('');
      setDescription('');
      setColor('blue');
      setSelectedProject(data);
      setProjectIdeas([]);
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
          color,
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
        color,
        updated_at: new Date().toISOString(),
      };
      setSelectedProject(updated);
      setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
      setSaveError(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
      setSaveError('Failed to save. Please try again.');
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      setProjects(projects.filter((p) => p.id !== id));
      if (selectedProject?.id === id) setSelectedProject(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }

  function copyContext() {
    if (!selectedProject) return;
    navigator.clipboard.writeText(buildContextString(selectedProject));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyCardContext(project: Project) {
    navigator.clipboard.writeText(buildContextString(project));
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function togglePin(id: string) {
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((p) => p !== id)
      : [...pinnedIds, id];
    setPinnedIds(next);
    localStorage.setItem('pinnedProjects', JSON.stringify(next));
  }

  async function openProject(project: Project) {
    setSelectedProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setContextMarkdown(project.context_markdown);
    setLearningsSummary(project.learnings_summary);
    setColor(project.color || 'blue');
    setIsEditing(false);
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', project.id)
      .order('created_at', { ascending: false });
    setProjectIdeas(data || []);
  }

  const filteredProjects = projects.filter((p) => {
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
  });

  const sortedProjects = [
    ...filteredProjects.filter((p) => pinnedIds.includes(p.id)),
    ...filteredProjects.filter((p) => !pinnedIds.includes(p.id)),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Project detail view
  if (selectedProject) {
    const colorClasses = getColorClasses(selectedProject.color || 'blue');
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedProject(null)}
          className="text-slate-400 hover:text-white flex items-center space-x-1"
        >
          <ChevronRight className="rotate-180" size={16} />
          <span>Back to projects</span>
        </button>

        <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
          <div className={`h-2 ${colorClasses.bg}`} />
          <div className="p-6 border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      id="project-title"
                      aria-label="Project title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-2xl font-bold bg-slate-700 text-white rounded px-3 py-1 w-full"
                    />
                    <ColorPicker selected={color} onChange={setColor} />
                  </div>
                ) : (
                  <h2 className="text-2xl font-bold text-white">{selectedProject.title}</h2>
                )}
                {isEditing ? (
                  <textarea
                    aria-label="Project description"
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
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center space-x-2">
                      <button onClick={updateProject} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500">
                        {saved ? 'Saved!' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setSaveError(null);
                          setTitle(selectedProject.title);
                          setDescription(selectedProject.description || '');
                          setContextMarkdown(selectedProject.context_markdown);
                          setLearningsSummary(selectedProject.learnings_summary);
                          setColor(selectedProject.color || 'blue');
                        }}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                      >Cancel</button>
                    </div>
                    {saveError && <p className="text-red-400 text-xs">{saveError}</p>}
                  </div>
                ) : (
                  <>
                    <button onClick={copyContext} className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                      <span>{copied ? 'Copied!' : 'Copy Context'}</span>
                    </button>
                    <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => deleteProject(selectedProject.id)} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="project-context" className="block text-sm font-medium text-slate-300 mb-2">Project Context</label>
              <p className="text-xs text-slate-500 mb-2">Paste important context here—code snippets, decisions, current state. Copy this into new AI chats.</p>
              {isEditing ? (
                <textarea
                  id="project-context"
                  value={contextMarkdown}
                  onChange={(e) => setContextMarkdown(e.target.value)}
                  className="w-full h-64 bg-slate-700 text-slate-100 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="# Current state&#10;&#10;## What's working&#10;- ...&#10;&#10;## What's left to do&#10;- ..."
                />
              ) : (
                <div className="w-full min-h-32 bg-slate-700/50 rounded-lg px-4 py-3">
                  {contextMarkdown
                    ? <MarkdownRenderer content={contextMarkdown} />
                    : <span className="text-slate-500 italic text-sm">No context yet. Click edit to add.</span>
                  }
                </div>
              )}
            </div>

            <div>
              <label htmlFor="project-learnings" className="block text-sm font-medium text-slate-300 mb-2">Key Learnings & Decisions</label>
              <p className="text-xs text-slate-500 mb-2">Record important mistakes, insights, and why you made certain decisions.</p>
              {isEditing ? (
                <textarea
                  id="project-learnings"
                  value={learningsSummary}
                  onChange={(e) => setLearningsSummary(e.target.value)}
                  className="w-full h-40 bg-slate-700 text-slate-100 rounded-lg px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="- Don't use X because...&#10;- Chose Y over Z because..."
                />
              ) : (
                <div className="w-full min-h-24 bg-slate-700/50 rounded-lg px-4 py-3">
                  {learningsSummary
                    ? <MarkdownRenderer content={learningsSummary} />
                    : <span className="text-slate-500 italic text-sm">No learnings yet. Click edit to add.</span>
                  }
                </div>
              )}
            </div>

            {projectIdeas.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Lightbulb size={15} />
                  Linked Ideas ({projectIdeas.length})
                </label>
                <div className="space-y-2">
                  {projectIdeas.map((idea) => (
                    <div key={idea.id} className="bg-slate-700/50 rounded-lg px-4 py-3">
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{idea.content}</p>
                      <p className="text-xs text-slate-500 mt-1">{new Date(idea.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
          onClick={() => { setShowNewForm(true); setTitle(''); setDescription(''); setColor('blue'); }}
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
              id="project-title"
              aria-label="Project title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            <textarea
              aria-label="Project description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows={2}
            />
            <div>
              <label className="block text-sm text-slate-400 mb-2">Color</label>
              <ColorPicker selected={color} onChange={setColor} />
            </div>
            <div className="flex space-x-3">
              <button onClick={createProject} disabled={!title.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Create</button>
              <button onClick={() => { setShowNewForm(false); setTitle(''); setDescription(''); setColor('blue'); }} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            aria-label="Search projects"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      )}

      {sortedProjects.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <FolderKanban className="mx-auto text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-medium text-slate-300">{search ? 'No matches' : 'No projects yet'}</h3>
          <p className="text-slate-500 mt-1">{search ? 'Try a different search' : 'Create your first project to start tracking context'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedProjects.map((project) => {
            const colorClasses = getColorClasses(project.color || 'blue');
            const isPinned = pinnedIds.includes(project.id);
            return (
              <div
                key={project.id}
                onClick={() => openProject(project)}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition-colors group cursor-pointer"
              >
                <div className={`h-2 ${colorClasses.bg}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-medium text-white group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                      {isPinned && <Pin size={12} className="text-indigo-400 shrink-0" />}
                      {project.title}
                    </h3>
                    <div
                      className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => copyCardContext(project)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded"
                        title="Copy context"
                      >
                        {copiedId === project.id ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={() => togglePin(project.id)}
                        className={`p-1.5 rounded hover:bg-slate-700 ${isPinned ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
                        title={isPinned ? 'Unpin' : 'Pin to top'}
                      >
                        <Pin size={13} />
                      </button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-slate-400 text-sm mt-1 line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center space-x-1 text-slate-500 text-xs mt-3">
                    <Clock size={12} />
                    <span>Updated {new Date(project.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
