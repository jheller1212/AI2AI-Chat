import React, { useState, useEffect, useCallback } from 'react';
import { X, Plus, Copy, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`;

async function callWorkshopApi(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const resp = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const result = await resp.json();
  if (!resp.ok || result.error) throw new Error(result.error || `HTTP ${resp.status}`);
  return result;
}

interface Workshop {
  code: string;
  name: string;
  welcome: string;
  provider: string;
  active: boolean;
  created_at: string;
}

interface WorkshopAdminProps {
  onClose: () => void;
}

export function WorkshopAdmin({ onClose }: WorkshopAdminProps) {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newWelcome, setNewWelcome] = useState('');
  const [newApiKey, setNewApiKey] = useState('');
  const [newProvider, setNewProvider] = useState('gpt4');
  const [creating, setCreating] = useState(false);

  const fetchWorkshops = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await callWorkshopApi({ action: 'list' });
      setWorkshops(result.workshops || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load workshops');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkshops(); }, [fetchWorkshops]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await callWorkshopApi({
        action: 'create',
        code: newCode,
        name: newName,
        welcome: newWelcome,
        apiKey: newApiKey,
        provider: newProvider,
      });
      setShowCreate(false);
      setNewCode(''); setNewName(''); setNewWelcome(''); setNewApiKey('');
      await fetchWorkshops();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create workshop');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (code: string, active: boolean) => {
    try {
      await callWorkshopApi({ action: 'update', code, active: !active });
      await fetchWorkshops();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update workshop');
    }
  };

  const copyLink = (code: string) => {
    navigator.clipboard.writeText(`https://ai2aichat.com/?workshop=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Workshop Manager</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Workshop
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>
          )}

          {/* Create form */}
          {showCreate && (
            <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Code (URL slug)</label>
                  <input
                    value={newCode}
                    onChange={e => setNewCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="mba-2026"
                    required
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Provider</label>
                  <select
                    value={newProvider}
                    onChange={e => setNewProvider(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="gpt4">OpenAI</option>
                    <option value="claude">Anthropic</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="mistral">Mistral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Workshop Name</label>
                <input
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="MBA Marketing Workshop 2026"
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Welcome Message</label>
                <textarea
                  value={newWelcome}
                  onChange={e => setNewWelcome(e.target.value)}
                  placeholder="Welcome! Your API key is pre-loaded. Pick a scenario or configure your own bots."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">API Key (will be encrypted)</label>
                <input
                  type="password"
                  value={newApiKey}
                  onChange={e => setNewApiKey(e.target.value)}
                  placeholder="sk-..."
                  required
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Workshop'}
                </button>
              </div>
            </form>
          )}

          {/* Workshop list */}
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Loading workshops...</p>
          ) : workshops.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No workshops yet. Create your first one.</p>
          ) : (
            <div className="space-y-3">
              {workshops.map(w => (
                <div key={w.code} className={`p-4 rounded-lg border ${w.active ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">{w.name}</h3>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${w.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'}`}>
                          {w.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {w.provider} · created {new Date(w.created_at).toLocaleDateString()}
                      </p>
                      {w.welcome && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{w.welcome}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => copyLink(w.code)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Copy workshop link"
                      >
                        {copiedCode === w.code ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleToggle(w.code, w.active)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title={w.active ? 'Deactivate' : 'Activate'}
                      >
                        {w.active ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {copiedCode === w.code && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">Link copied: ai2aichat.com/?workshop={w.code}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
