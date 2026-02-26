import { useState, useEffect } from 'react';
import { supabase, Secret, SecretCategory, Project } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useCrypto } from '../contexts/CryptoContext';
import {
  Plus, Copy, Check, Trash2, Edit3, Eye, EyeOff,
  Lock, KeyRound, ShieldCheck, X,
} from 'lucide-react';

const CATEGORY_LABELS: Record<SecretCategory, string> = {
  api_key: 'API Key',
  password: 'Password',
  env_var: 'Env Var',
  other: 'Other',
};

const CATEGORY_COLORS: Record<SecretCategory, string> = {
  api_key: 'bg-blue-500/20 text-blue-300',
  password: 'bg-red-500/20 text-red-300',
  env_var: 'bg-emerald-500/20 text-emerald-300',
  other: 'bg-slate-500/20 text-slate-300',
};

// ── Unlock / Setup screen ────────────────────────────────────────────────────

function VaultGate({
  isSetup,
  onSubmit,
}: {
  isSetup: boolean;
  onSubmit: (passphrase: string) => Promise<boolean | void>;
}) {
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (isSetup && passphrase !== confirm) {
      setError('Passphrases do not match.');
      return;
    }
    if (passphrase.length < 8) {
      setError('Passphrase must be at least 8 characters.');
      return;
    }
    setLoading(true);
    const result = await onSubmit(passphrase);
    if (result === false) setError('Incorrect passphrase. Try again.');
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-center min-h-96">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 w-full max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <KeyRound size={28} className="text-indigo-400" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-white text-center mb-1">
          {isSetup ? 'Set Up Secrets Vault' : 'Unlock Secrets Vault'}
        </h2>
        <p className="text-slate-400 text-sm text-center mb-6">
          {isSetup
            ? 'Choose a master passphrase. Secrets are encrypted in your browser — this server never sees plaintext values.'
            : 'Enter your master passphrase to decrypt your secrets.'}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Passphrase field with reveal toggle */}
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder={isSetup ? 'Choose a strong passphrase' : 'Master passphrase'}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 pr-11 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              tabIndex={-1}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm field with reveal toggle (setup only) */}
          {isSetup && (
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm passphrase"
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 pr-11 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          {/* Acknowledgement checkbox (setup only) */}
          {isSetup && (
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 accent-indigo-500 w-4 h-4 shrink-0"
              />
              <span className="text-sm text-amber-300">
                I have written down or saved my passphrase. I understand it <strong>cannot be recovered</strong> if lost.
              </span>
            </label>
          )}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !passphrase || (isSetup && !acknowledged)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Processing…' : isSetup ? 'Create Vault' : 'Unlock'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main vault UI ────────────────────────────────────────────────────────────

export default function SecretsPage() {
  const { user } = useAuth();
  const { vaultStatus, setupVault, unlock, lock, encryptValue, decryptValue } = useCrypto();

  const [secrets, setSecrets] = useState<Secret[]>([]);
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'title'>[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<SecretCategory | 'all'>('all');
  // id → decrypted plaintext (only for currently-revealed items)
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [formName, setFormName] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formCategory, setFormCategory] = useState<SecretCategory>('api_key');
  const [formProject, setFormProject] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showFormValue, setShowFormValue] = useState(false);

  useEffect(() => {
    if (vaultStatus === 'unlocked' && user) {
      fetchSecrets();
      fetchProjects();
    }
  }, [vaultStatus, user]);

  async function fetchSecrets() {
    setLoading(true);
    const { data } = await supabase.from('secrets').select('*').order('name');
    setSecrets(data || []);
    setLoading(false);
  }

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, title').order('title');
    setProjects(data || []);
  }

  function openAddForm() {
    setEditingSecret(null);
    setFormName('');
    setFormValue('');
    setFormCategory('api_key');
    setFormProject('');
    setFormNotes('');
    setShowForm(true);
  }

  async function openEditForm(secret: Secret) {
    setEditingSecret(secret);
    setFormName(secret.name);
    setFormCategory(secret.category);
    setFormProject(secret.project_id || '');
    setFormNotes(secret.notes || '');
    const plaintext = await decryptValue(secret.encrypted_value, secret.iv);
    setFormValue(plaintext);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingSecret(null);
    setFormValue('');
    setShowFormValue(false);
  }

  async function saveSecret() {
    if (!formName.trim() || !formValue.trim() || !user) return;
    setFormLoading(true);
    try {
      const { ciphertext: encrypted_value, iv } = await encryptValue(formValue);
      const patch = {
        name: formName.trim(),
        encrypted_value,
        iv,
        category: formCategory,
        project_id: formProject || null,
        notes: formNotes.trim() || null,
      };
      if (editingSecret) {
        const { error } = await supabase
          .from('secrets')
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq('id', editingSecret.id);
        if (error) throw error;
        setSecrets((prev) =>
          prev.map((s) => (s.id === editingSecret.id ? { ...s, ...patch } : s)),
        );
        // Clear stale revealed value
        setRevealed((prev) => { const n = { ...prev }; delete n[editingSecret.id]; return n; });
      } else {
        const { data, error } = await supabase
          .from('secrets')
          .insert({ user_id: user.id, ...patch })
          .select()
          .single();
        if (error) throw error;
        setSecrets((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
      closeForm();
    } catch (err) {
      console.error('Error saving secret:', err);
    } finally {
      setFormLoading(false);
    }
  }

  async function deleteSecret(id: string) {
    if (!confirm('Delete this secret? This cannot be undone.')) return;
    await supabase.from('secrets').delete().eq('id', id);
    setSecrets((prev) => prev.filter((s) => s.id !== id));
    setRevealed((prev) => { const n = { ...prev }; delete n[id]; return n; });
  }

  async function toggleReveal(secret: Secret) {
    if (revealed[secret.id] !== undefined) {
      setRevealed((prev) => { const n = { ...prev }; delete n[secret.id]; return n; });
    } else {
      const plaintext = await decryptValue(secret.encrypted_value, secret.iv);
      setRevealed((prev) => ({ ...prev, [secret.id]: plaintext }));
    }
  }

  async function copySecret(secret: Secret) {
    const plaintext = revealed[secret.id] ?? await decryptValue(secret.encrypted_value, secret.iv);
    await navigator.clipboard.writeText(plaintext);
    setCopiedId(secret.id);
    // Auto-clear clipboard after 30 s
    setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {});
      setCopiedId((prev) => (prev === secret.id ? null : prev));
    }, 30_000);
  }

  // ── Vault gate screens ──────────────────────────────────────────────────

  if (vaultStatus === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (vaultStatus === 'not_setup') {
    return <VaultGate isSetup onSubmit={setupVault} />;
  }

  if (vaultStatus === 'locked') {
    return <VaultGate isSetup={false} onSubmit={unlock} />;
  }

  // ── Unlocked vault ──────────────────────────────────────────────────────

  const categories: (SecretCategory | 'all')[] = ['all', 'api_key', 'password', 'env_var', 'other'];
  const filtered = categoryFilter === 'all' ? secrets : secrets.filter((s) => s.category === categoryFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <KeyRound size={22} className="text-indigo-400" />
            Secrets Vault
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Client-side encrypted · values never stored in plaintext
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={lock}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 text-slate-300 hover:text-white rounded-lg hover:bg-slate-600 text-sm"
          >
            <Lock size={15} />
            Lock
          </button>
          <button
            onClick={openAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            <Plus size={18} />
            Add Secret
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            {cat !== 'all' && (
              <span className="ml-1.5 opacity-60">
                {secrets.filter((s) => s.category === cat).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Secret list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <KeyRound className="mx-auto text-slate-600 mb-4" size={40} />
          <h3 className="text-slate-300 font-medium">
            {secrets.length === 0 ? 'No secrets yet' : 'None in this category'}
          </h3>
          <p className="text-slate-500 text-sm mt-1">
            {secrets.length === 0
              ? 'Add API keys, passwords, and env vars here.'
              : 'Try a different category filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((secret) => {
            const isRevealed = revealed[secret.id] !== undefined;
            const isCopied = copiedId === secret.id;
            const project = projects.find((p) => p.id === secret.project_id);
            return (
              <div
                key={secret.id}
                className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-4 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{secret.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${CATEGORY_COLORS[secret.category]}`}>
                      {CATEGORY_LABELS[secret.category]}
                    </span>
                    {project && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-500/20 text-indigo-300">
                        {project.title}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 font-mono text-sm text-slate-300 truncate">
                    {isRevealed ? revealed[secret.id] : '••••••••••••••••'}
                  </div>
                  {secret.notes && (
                    <p className="text-xs text-slate-500 mt-1 truncate">{secret.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => copySecret(secret)}
                    className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Copy (clipboard clears after 30 s)"
                  >
                    {isCopied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                  </button>
                  <button
                    onClick={() => toggleReveal(secret)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title={isRevealed ? 'Hide' : 'Reveal'}
                  >
                    {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => openEditForm(secret)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteSecret(secret.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
        >
          <div
            className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white">
                {editingSecret ? 'Edit Secret' : 'Add Secret'}
              </h3>
              <button onClick={closeForm} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. OpenAI API Key"
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Value</label>
                <div className="relative">
                  <input
                    type={showFormValue ? 'text' : 'password'}
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder="sk-…"
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 pr-11 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowFormValue((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    tabIndex={-1}
                  >
                    {showFormValue ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as SecretCategory)}
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="api_key">API Key</option>
                    <option value="password">Password</option>
                    <option value="env_var">Env Variable</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Project (optional)</label>
                  <select
                    value={formProject}
                    onChange={(e) => setFormProject(e.target.value)}
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="">— none —</option>
                    {projects
                      .filter((p) => {
                        try { return JSON.parse(localStorage.getItem('pinnedProjects') || '[]').includes(p.id); }
                        catch { return false; }
                      })
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Notes (optional)</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Where this is used, expiry date, etc."
                  rows={2}
                  className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveSecret}
                  disabled={!formName.trim() || !formValue.trim() || formLoading}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 font-medium"
                >
                  {formLoading ? 'Saving…' : editingSecret ? 'Save Changes' : 'Add Secret'}
                </button>
                <button
                  onClick={closeForm}
                  className="px-5 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
