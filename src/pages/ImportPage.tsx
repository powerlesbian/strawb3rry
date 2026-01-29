import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  Upload,
  FileText,
  Zap,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
  Info,
} from 'lucide-react';

type Project = {
  id: string;
  title: string;
};

type ParsedConversation = {
  title: string;
  messages: { role: 'human' | 'assistant'; content: string }[];
  totalChars: number;
  estimatedTokens: number;
};

// Rough token estimation (1 token ≈ 4 characters for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Cost estimates per 1M tokens (as of early 2025, approximate)
const MODEL_COSTS = {
  'Claude 3.5 Sonnet': { input: 3.0, output: 15.0 },
  'Claude 3.5 Haiku': { input: 0.25, output: 1.25 },
  'Claude 3 Opus': { input: 15.0, output: 75.0 },
  'Claude 3 Sonnet': { input: 3.0, output: 15.0 },
  'Claude 3 Haiku': { input: 0.25, output: 1.25 },
  'GPT-4o': { input: 2.5, output: 10.0 },
  'GPT-4 Turbo': { input: 10.0, output: 30.0 },
  'GPT-4': { input: 30.0, output: 60.0 },
  'GPT-3.5 Turbo': { input: 0.5, output: 1.5 },
  'Gemini Pro': { input: 0.5, output: 1.5 },
  'Gemini Ultra': { input: 5.0, output: 15.0 },
};

export default function ImportPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [transcript, setTranscript] = useState('');
  const [parsed, setParsed] = useState<ParsedConversation | null>(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedModel, setSelectedModel] = useState('Claude 3.5 Sonnet');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [whatWorked, setWhatWorked] = useState('');
  const [whatDidntWork, setWhatDidntWork] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  useEffect(() => {
    if (transcript.trim()) {
      parseTranscript(transcript);
    } else {
      setParsed(null);
    }
  }, [transcript]);

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

  function parseTranscript(text: string) {
    const lines = text.split('\n');
    const messages: { role: 'human' | 'assistant'; content: string }[] = [];
    let currentRole: 'human' | 'assistant' | null = null;
    let currentContent: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Detect role markers (common formats)
      if (
        trimmedLine.toLowerCase().startsWith('human:') ||
        trimmedLine.toLowerCase().startsWith('user:') ||
        trimmedLine.toLowerCase().startsWith('me:') ||
        trimmedLine === 'Human' ||
        trimmedLine === 'User'
      ) {
        if (currentRole && currentContent.length > 0) {
          messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
        }
        currentRole = 'human';
        const content = trimmedLine.replace(/^(human|user|me):\s*/i, '');
        currentContent = content ? [content] : [];
      } else if (
        trimmedLine.toLowerCase().startsWith('assistant:') ||
        trimmedLine.toLowerCase().startsWith('claude:') ||
        trimmedLine.toLowerCase().startsWith('ai:') ||
        trimmedLine.toLowerCase().startsWith('chatgpt:') ||
        trimmedLine === 'Assistant' ||
        trimmedLine === 'Claude'
      ) {
        if (currentRole && currentContent.length > 0) {
          messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
        }
        currentRole = 'assistant';
        const content = trimmedLine.replace(/^(assistant|claude|ai|chatgpt):\s*/i, '');
        currentContent = content ? [content] : [];
      } else if (currentRole) {
        currentContent.push(line);
      }
    }

    // Don't forget the last message
    if (currentRole && currentContent.length > 0) {
      messages.push({ role: currentRole, content: currentContent.join('\n').trim() });
    }

    const totalChars = text.length;
    const estimatedTokens = estimateTokens(text);

    // Try to generate a title from first human message
    if (messages.length > 0 && !title) {
      const firstMessage = messages.find((m) => m.role === 'human')?.content || '';
      const autoTitle = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
      setTitle(autoTitle);
    }

    setParsed({
      title: title || 'Imported Conversation',
      messages,
      totalChars,
      estimatedTokens,
    });
  }

  function calculateCost(tokens: number, model: string) {
    const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
    if (!costs) return null;

    // Assume roughly 50/50 split between input and output for estimation
    const inputTokens = tokens * 0.4;
    const outputTokens = tokens * 0.6;

    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;

    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
    };
  }

  async function handleSave() {
    if (!parsed || parsed.messages.length === 0) {
      setError('No valid conversation to import');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const { error } = await supabase.from('conversations').insert([
        {
          user_id: user?.id,
          project_id: selectedProject || null,
          title: title || 'Imported Conversation',
          ai_model: selectedModel,
          summary: summary || null,
          what_worked: whatWorked || null,
          what_didnt_work: whatDidntWork || null,
          rating: rating,
          transcript: transcript,
          tags: tags ? tags.split(',').map((t) => t.trim()) : null,
        },
      ]);

      if (error) throw error;

      setSaved(true);
      setTimeout(() => {
        setTranscript('');
        setTitle('');
        setSummary('');
        setWhatWorked('');
        setWhatDidntWork('');
        setRating(null);
        setTags('');
        setParsed(null);
        setSaved(false);
      }, 2000);
    } catch (err) {
      console.error('Error saving conversation:', err);
      setError('Failed to save conversation');
    } finally {
      setSaving(false);
    }
  }

  function copyTokenStats() {
    if (!parsed) return;
    const cost = calculateCost(parsed.estimatedTokens, selectedModel);
    const stats = `Tokens: ~${parsed.estimatedTokens.toLocaleString()}
Characters: ${parsed.totalChars.toLocaleString()}
Messages: ${parsed.messages.length}
Estimated Cost (${selectedModel}): $${cost?.total.toFixed(4) || 'N/A'}`;

    navigator.clipboard.writeText(stats);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const cost = parsed ? calculateCost(parsed.estimatedTokens, selectedModel) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Import Conversation</h1>
        <p className="text-slate-400 mt-1">
          Paste a conversation transcript to import it and track token usage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Input */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transcript Input */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <FileText size={20} className="text-indigo-400" />
                <span>Conversation Transcript</span>
              </h2>
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <Info size={16} />
                <span>Use "Human:" and "Assistant:" prefixes</span>
              </div>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={`Paste your conversation here...\n\nExample format:\n\nHuman: How do I create a React component?\n\nAssistant: Here's how you create a React component...\n\nHuman: Can you add TypeScript?\n\nAssistant: Sure! Here's the TypeScript version...`}
              rows={16}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono text-sm"
            />
          </div>

          {/* Metadata */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Conversation Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Conversation title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  {Object.keys(MODEL_COSTS).map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Project</label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Rating</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(rating === star ? null : star)}
                      className={`p-2 rounded-lg transition-colors ${
                        rating && rating >= star
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-slate-700 text-slate-400 hover:text-yellow-400'
                      }`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="Brief summary of the conversation"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">What Worked</label>
                <textarea
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Effective prompts or approaches"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">What Didn't Work</label>
                <textarea
                  value={whatDidntWork}
                  onChange={(e) => setWhatDidntWork(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Issues or failed approaches"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="react, typescript, api (comma-separated)"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Stats & Actions */}
        <div className="space-y-6">
          {/* Token Stats */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Zap size={20} className="text-yellow-400" />
                <span>Token Usage</span>
              </h2>
              <button
                onClick={copyTokenStats}
                disabled={!parsed}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
              </button>
            </div>

            {parsed ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Est. Tokens</p>
                    <p className="text-2xl font-bold text-white">
                      {parsed.estimatedTokens.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Characters</p>
                    <p className="text-2xl font-bold text-white">
                      {parsed.totalChars.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-slate-400 text-sm">Messages Parsed</p>
                  <p className="text-2xl font-bold text-white">{parsed.messages.length}</p>
                  <div className="flex space-x-4 mt-2 text-sm">
                    <span className="text-blue-400">
                      {parsed.messages.filter((m) => m.role === 'human').length} human
                    </span>
                    <span className="text-purple-400">
                      {parsed.messages.filter((m) => m.role === 'assistant').length} assistant
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText size={32} className="mx-auto mb-2 opacity-50" />
                <p>Paste a conversation to see stats</p>
              </div>
            )}
          </div>

          {/* Cost Estimate */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
              <DollarSign size={20} className="text-green-400" />
              <span>Cost Estimate</span>
            </h2>

            {parsed && cost ? (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Input (~40%)</span>
                  <span className="text-white">${cost.input.toFixed(4)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Output (~60%)</span>
                  <span className="text-white">${cost.output.toFixed(4)}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 flex justify-between">
                  <span className="text-slate-300 font-medium">Total</span>
                  <span className="text-green-400 font-bold">${cost.total.toFixed(4)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Based on {selectedModel} pricing. Actual costs may vary.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500">
                <DollarSign size={32} className="mx-auto mb-2 opacity-50" />
                <p>Select a model to estimate cost</p>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="space-y-3">
            {error && (
              <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {saved && (
              <div className="flex items-center space-x-2 text-green-400 bg-green-500/10 px-4 py-2 rounded-lg">
                <CheckCircle size={18} />
                <span>Conversation saved successfully!</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!parsed || parsed.messages.length === 0 || saving || saved}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : saved ? (
                <>
                  <CheckCircle size={20} />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>Import Conversation</span>
                </>
              )}
            </button>
          </div>

          {/* Pricing Reference */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-white mb-3">Pricing Reference (per 1M tokens)</h3>
            <div className="space-y-2 text-xs">
              {Object.entries(MODEL_COSTS).map(([model, costs]) => (
                <div key={model} className="flex justify-between">
                  <span className="text-slate-400">{model}</span>
                  <span className="text-slate-300">
                    ${costs.input} / ${costs.output}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">Input / Output costs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
