import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Copy, Check, Trash2, HelpCircle, X, ChevronUp, Tag } from 'lucide-react';

const TASKS = [
  { value: '', label: 'Select a task...' },
  { value: 'write-code', label: 'Write code' },
  { value: 'explain', label: 'Explain a concept' },
  { value: 'debug', label: 'Debug an issue' },
  { value: 'brainstorm', label: 'Brainstorm ideas' },
  { value: 'summarize', label: 'Summarize content' },
  { value: 'review', label: 'Review/improve text' },
  { value: 'translate', label: 'Translate' },
];

const TONES = [
  { value: '', label: 'Select a tone...' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'simple', label: 'Simple/ELI5' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
];

const LENGTHS = [
  { value: '', label: 'Select a length...' },
  { value: 'brief', label: 'Brief (1-2 paragraphs)' },
  { value: 'moderate', label: 'Moderate (3-5 paragraphs)' },
  { value: 'detailed', label: 'Detailed (comprehensive)' },
  { value: 'bullet', label: 'Bullet points' },
];

const principles = [
  { id: 1, title: "Assign a Clear Role", description: "Start by assigning a role (e.g., 'Act as a senior developer'). Provides context and guides the AI's tone." },
  { id: 2, title: "Embrace the Iterative Process", description: "Treat AI interaction as a conversation. Refine your prompt based on the response." },
  { id: 3, title: "Request Clarifying Questions", description: "Ask the AI to ask you 1-5 clarifying questions to 'tease out' the true goal." },
  { id: 4, title: "Encourage Critical Feedback", description: "Prompt the AI to be a critical partner and highlight incorrect assumptions." },
  { id: 5, title: "Specify Constraints", description: "Always define the desired output format and any constraints." }
];

const pitfalls = [
  { id: 1, title: "The Vague Prompt", description: "A vague prompt will yield a vague answer. The AI has no way to know what specific aspect you're interested in." },
  { id: 2, title: "Assuming the Wrong Context", description: "The AI may make incorrect assumptions about your knowledge level or the context of your request." },
  { id: 3, title: "The Hallucination Trap", description: "AI models can 'hallucinate'—they may invent facts or code that sound plausible but are incorrect. Always verify." },
  { id: 4, title: "Over-Reliance on the Oracle", description: "Don't treat AI as an infallible source of truth. It's a predictive model, not a knowledge base." },
  { id: 5, title: "Forgetting to Clarify", description: "Failing to ask for clarification leads to answers that don't solve your actual problem." }
];

type Prompt = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[] | null;
  llm_tags: string[] | null;
  notes: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export default function PromptsPage() {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Builder state
  const [task, setTask] = useState('');
  const [tone, setTone] = useState('');
  const [length, setLength] = useState('');
  const [context, setContext] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [promptTitle, setPromptTitle] = useState('');
  const [promptTags, setPromptTags] = useState('');
  const [promptNotes, setPromptNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) fetchPrompts();
  }, [user]);

  async function fetchPrompts() {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
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

  function generatePrompt() {
    if (!task || !context) {
      alert('Please select a task and provide context');
      return;
    }

    const taskLabels: Record<string, string> = {
      'write-code': 'Write code to',
      'explain': 'Explain',
      'debug': 'Help me debug',
      'brainstorm': 'Brainstorm ideas for',
      'summarize': 'Summarize',
      'review': 'Review and improve',
      'translate': 'Translate',
    };

    const toneInstructions: Record<string, string> = {
      'professional': 'Use a professional tone.',
      'casual': 'Keep it casual and conversational.',
      'technical': 'Be technical and precise.',
      'simple': 'Explain in simple terms, as if to a beginner.',
      'formal': 'Use formal language.',
      'friendly': 'Be friendly and approachable.',
    };

    const lengthInstructions: Record<string, string> = {
      'brief': 'Keep your response brief (1-2 paragraphs).',
      'moderate': 'Provide a moderate-length response (3-5 paragraphs).',
      'detailed': 'Give a comprehensive, detailed response.',
      'bullet': 'Format your response as bullet points.',
    };

    let prompt = `## Task\n${taskLabels[task] || task}: ${context}\n\n`;
    prompt += `## Guidelines\n`;
    if (tone) prompt += `- ${toneInstructions[tone]}\n`;
    if (length) prompt += `- ${lengthInstructions[length]}\n`;
    prompt += `- Be clear and actionable.\n`;
    prompt += `- If you need clarification, ask before proceeding.\n`;

    setGeneratedPrompt(prompt);
    
    // Auto-generate title if empty
    if (!promptTitle) {
      const taskLabel = TASKS.find(t => t.value === task)?.label || task;
      setPromptTitle(`${taskLabel}: ${context.slice(0, 40)}${context.length > 40 ? '...' : ''}`);
    }
  }

  async function savePrompt() {
    if (!generatedPrompt || !user || !promptTitle) {
      alert('Please generate a prompt and add a title');
      return;
    }
    setSaving(true);

    try {
      // Parse tags from comma-separated string
      const tagsArray = promptTags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const { error } = await supabase.from('prompts').insert({
        user_id: user.id,
        title: promptTitle,
        content: generatedPrompt,
        tags: tagsArray.length > 0 ? tagsArray : null,
        notes: promptNotes || null,
        is_public: false,
      });

      if (error) throw error;

      // Reset and refresh
      setTask('');
      setTone('');
      setLength('');
      setContext('');
      setGeneratedPrompt('');
      setPromptTitle('');
      setPromptTags('');
      setPromptNotes('');
      setShowBuilder(false);
      fetchPrompts();
    } catch (error) {
      console.error('Error saving prompt:', error);
      alert('Failed to save prompt');
    } finally {
      setSaving(false);
    }
  }

  async function copyToClipboard(content: string, id: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function deletePrompt(id: string) {
    if (!confirm('Delete this prompt?')) return;

    try {
      const { error } = await supabase.from('prompts').delete().eq('id', id);
      if (error) throw error;
      setPrompts(prompts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting prompt:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prompt Library</h1>
          <p className="text-slate-400 mt-1">Build, save, and reuse effective AI prompts</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowHelp(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <HelpCircle size={18} />
            <span>Tips</span>
          </button>
          <button
            onClick={() => setShowBuilder(!showBuilder)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            {showBuilder ? <ChevronUp size={18} /> : <Plus size={18} />}
            <span>{showBuilder ? 'Hide Builder' : 'New Prompt'}</span>
          </button>
        </div>
      </div>

      {/* Prompt Builder */}
      {showBuilder && (
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-lg font-semibold text-white mb-4">Prompt Builder</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Task</label>
              <select
                value={task}
                onChange={(e) => setTask(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TASKS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {TONES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Length</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {LENGTHS.map(l => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Context / Details</label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what you need help with..."
              rows={3}
              className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            onClick={generatePrompt}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Generate Prompt
          </button>

          {generatedPrompt && (
            <div className="mt-4 p-4 bg-slate-900 rounded-lg border border-slate-600">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-300">Generated Prompt:</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-slate-200 font-mono mb-4">
                {generatedPrompt}
              </pre>
              
              {/* Save options */}
              <div className="space-y-3 mb-4 pt-4 border-t border-slate-700">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={promptTitle}
                    onChange={(e) => setPromptTitle(e.target.value)}
                    placeholder="Give your prompt a title..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={promptTags}
                    onChange={(e) => setPromptTags(e.target.value)}
                    placeholder="coding, react, debugging..."
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Notes (optional)</label>
                  <textarea
                    value={promptNotes}
                    onChange={(e) => setPromptNotes(e.target.value)}
                    placeholder="Any notes about when to use this prompt..."
                    rows={2}
                    className="w-full rounded-lg border border-slate-600 bg-slate-700 px-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => copyToClipboard(generatedPrompt, 'generated')}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  {copiedId === 'generated' ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedId === 'generated' ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={savePrompt}
                  disabled={saving || !promptTitle}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-600/50 text-white rounded-lg transition-colors"
                >
                  <span>{saving ? 'Saving...' : 'Save to Library'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Prompts */}
      {prompts.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <p className="text-slate-400 mb-4">No saved prompts yet.</p>
          <button
            onClick={() => setShowBuilder(true)}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Create your first prompt →
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-white">{prompt.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(prompt.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deletePrompt(prompt.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {prompt.tags && prompt.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {prompt.tags.map((tag, i) => (
                    <span key={i} className="inline-flex items-center px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                      <Tag size={10} className="mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono mb-3 line-clamp-4">
                {prompt.content}
              </pre>
              
              {prompt.notes && (
                <p className="text-xs text-slate-500 italic mb-3">{prompt.notes}</p>
              )}
              
              <button
                onClick={() => copyToClipboard(prompt.content, prompt.id)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
              >
                {copiedId === prompt.id ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedId === prompt.id ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700">
            <div className="sticky top-0 bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Prompting Tips</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-indigo-400 mb-4">Core Principles</h3>
                <div className="space-y-4">
                  {principles.map((p) => (
                    <div key={p.id} className="pb-4 border-b border-slate-700 last:border-0">
                      <h4 className="font-medium text-white">{p.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-400 mb-4">Common Pitfalls to Avoid</h3>
                <div className="space-y-4">
                  {pitfalls.map((p) => (
                    <div key={p.id} className="pb-4 border-b border-slate-700 last:border-0">
                      <h4 className="font-medium text-white">{p.title}</h4>
                      <p className="text-slate-400 text-sm mt-1">{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
