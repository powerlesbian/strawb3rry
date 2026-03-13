import { useState, useEffect, useRef } from 'react';
import { supabase, Media, MediaCategory, Project } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Trash2, X, ImageIcon, FileText, File, Shield, FolderKanban, Eye } from 'lucide-react';

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType, className }: { mimeType: string; className?: string }) {
  if (mimeType.startsWith('image/')) return <ImageIcon className={className} />;
  if (mimeType === 'application/pdf') return <FileText className={className} />;
  return <File className={className} />;
}

export default function MediaPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<MediaCategory>('secure');
  const [items, setItems] = useState<Media[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [projects, setProjects] = useState<Pick<Project, 'id' | 'title'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewItem, setPreviewItem] = useState<{ item: Media; url: string } | null>(null);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadProject, setUploadProject] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchItems();
      fetchProjects();
    }
  }, [user, tab]);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('media')
      .select('*')
      .eq('category', tab)
      .order('created_at', { ascending: false });

    const mediaItems = data || [];
    setItems(mediaItems);

    if (mediaItems.length > 0) {
      const { data: urls } = await supabase.storage
        .from('media')
        .createSignedUrls(mediaItems.map(i => i.storage_path), 3600);

      const urlMap: Record<string, string> = {};
      urls?.forEach((u, idx) => {
        if (u.signedUrl) urlMap[mediaItems[idx].id] = u.signedUrl;
      });
      setSignedUrls(urlMap);
    } else {
      setSignedUrls({});
    }
    setLoading(false);
  }

  async function fetchProjects() {
    const { data } = await supabase.from('projects').select('id, title').order('title');
    setProjects(data || []);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ''));
    setShowUploadForm(true);
  }

  function cancelUpload() {
    setShowUploadForm(false);
    setUploadFile(null);
    setUploadName('');
    setUploadDescription('');
    setUploadProject('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleUpload() {
    if (!uploadFile || !user) return;
    setUploading(true);

    const ext = uploadFile.name.split('.').pop();
    const path = `${user.id}/${tab}/${Date.now()}.${ext}`;

    const { error: storageError } = await supabase.storage
      .from('media')
      .upload(path, uploadFile);

    if (storageError) {
      console.error('Upload error:', storageError);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('media').insert({
      user_id: user.id,
      project_id: uploadProject || null,
      name: uploadName.trim() || uploadFile.name,
      description: uploadDescription.trim() || null,
      storage_path: path,
      mime_type: uploadFile.type || 'application/octet-stream',
      size_bytes: uploadFile.size,
      category: tab,
    });

    if (dbError) {
      console.error('DB error:', dbError);
      await supabase.storage.from('media').remove([path]);
    }

    setUploading(false);
    cancelUpload();
    fetchItems();
  }

  async function handleDelete(item: Media) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    await supabase.storage.from('media').remove([item.storage_path]);
    await supabase.from('media').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    setSignedUrls(prev => { const n = { ...prev }; delete n[item.id]; return n; });
  }

  async function handlePreview(item: Media) {
    let url = signedUrls[item.id];
    if (!url) {
      const { data } = await supabase.storage.from('media').createSignedUrl(item.storage_path, 3600);
      url = data?.signedUrl || '';
    }
    setPreviewItem({ item, url });
  }

  const isImage = (mime: string) => mime.startsWith('image/');
  const isPdf = (mime: string) => mime === 'application/pdf';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Media</h2>
          <p className="text-slate-400 text-sm mt-0.5">Secure files and project assets</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            <Upload size={18} />
            Upload
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('secure')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'secure' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Shield size={15} />
          Secure
        </button>
        <button
          onClick={() => setTab('asset')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'asset' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <FolderKanban size={15} />
          Project Assets
        </button>
      </div>

      {/* Upload form */}
      {showUploadForm && uploadFile && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">Upload file</h3>
            <button onClick={cancelUpload} className="text-slate-400 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <p className="text-slate-400 text-sm">{uploadFile.name} · {formatBytes(uploadFile.size)}</p>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Name</label>
            <input
              type="text"
              value={uploadName}
              onChange={e => setUploadName(e.target.value)}
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Description (optional)</label>
            <input
              type="text"
              value={uploadDescription}
              onChange={e => setUploadDescription(e.target.value)}
              placeholder="What is this file?"
              className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          {tab === 'asset' && (
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Project (optional)</label>
              <select
                value={uploadProject}
                onChange={e => setUploadProject(e.target.value)}
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">— none —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadName.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 font-medium"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button onClick={cancelUpload} className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-slate-800/50 rounded-xl border border-slate-700">
          <Upload className="mx-auto text-slate-600 mb-4" size={40} />
          <h3 className="text-slate-300 font-medium">
            No {tab === 'secure' ? 'secure files' : 'project assets'} yet
          </h3>
          <p className="text-slate-500 text-sm mt-1">Upload files using the button above</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {items.map(item => {
            const url = signedUrls[item.id];
            const project = projects.find(p => p.id === item.project_id);
            return (
              <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden group">
                <div
                  className="h-36 bg-slate-700 flex items-center justify-center cursor-pointer relative overflow-hidden"
                  onClick={() => handlePreview(item)}
                >
                  {isImage(item.mime_type) && url ? (
                    <img src={url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <FileIcon mimeType={item.mime_type} className="text-slate-400 w-10 h-10" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Eye size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-white text-sm font-medium truncate">{item.name}</p>
                  {item.description && (
                    <p className="text-slate-400 text-xs truncate mt-0.5">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-slate-500 text-xs">{formatBytes(item.size_bytes)}</span>
                    <div className="flex items-center gap-1.5">
                      {project && (
                        <span className="text-xs px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded truncate max-w-20">
                          {project.title}
                        </span>
                      )}
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview modal */}
      {previewItem && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative max-w-4xl w-full flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-medium">{previewItem.item.name}</p>
                {previewItem.item.description && (
                  <p className="text-slate-400 text-sm">{previewItem.item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewItem.url}
                  download={previewItem.item.name}
                  className="px-3 py-1.5 bg-slate-700 text-white text-sm rounded-lg hover:bg-slate-600"
                  onClick={e => e.stopPropagation()}
                >
                  Download
                </a>
                <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white">
                  <X size={22} />
                </button>
              </div>
            </div>
            <div className="overflow-auto rounded-xl bg-slate-800 flex items-center justify-center min-h-64">
              {isImage(previewItem.item.mime_type) ? (
                <img
                  src={previewItem.url}
                  alt={previewItem.item.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              ) : isPdf(previewItem.item.mime_type) ? (
                <iframe src={previewItem.url} className="w-full h-[75vh] rounded-xl" />
              ) : (
                <div className="text-center p-8">
                  <FileIcon mimeType={previewItem.item.mime_type} className="mx-auto text-slate-400 mb-4 w-12 h-12" />
                  <p className="text-slate-300 mb-4">{previewItem.item.name}</p>
                  <a
                    href={previewItem.url}
                    download
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                  >
                    Download file
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
