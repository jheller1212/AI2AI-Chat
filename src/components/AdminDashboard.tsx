import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X, Users, UserCheck, UserPlus, MessageSquare, MessagesSquare, FlaskConical,
  GraduationCap, BarChart3, ShieldCheck, Trash2, Plus, AlertTriangle, Layers, Download, Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/workshop-config`;

type Period = 'day' | 'week' | 'month' | 'all';
type TimelineMetric = 'messages' | 'conversations' | 'newUsers' | 'signups';

interface AdminStats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  avgMessagesPerConversation: number;
  totalExperiments: number;
  classicExperiments: number;
  researchExperiments: number;
  totalScenarios: number;
  totalExports: number;
  providerErrors: number;
  providerUsage: Array<{ provider: string; count: number }>;
  activeWorkshops: number;
  inactiveWorkshops: number;
  totalSignups: number;
  signupsByWorkshop: Array<{ workshop_code: string; count: number }>;
  recentSignups: Array<{ user_id: string; workshop_code: string; created_at: string }>;
  timeline: Array<{ day: string; conversations: number; messages: number; newUsers: number; signups: number }>;
}

interface Organizer {
  email: string;
  created_at: string;
  isSuper: boolean;
}

interface AdminDashboardProps {
  onClose: () => void;
}

async function callEdge(body: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const resp = await fetch(EDGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const result = await resp.json();
  if (!resp.ok || result.error) throw new Error(result.error || `HTTP ${resp.status}`);
  return result;
}

function formatDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const periodLabels: Record<Period, string> = {
  day: 'Today',
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
};

const metricLabels: Record<TimelineMetric, string> = {
  messages: 'Messages',
  conversations: 'Conversations',
  newUsers: 'New users',
  signups: 'Sign-ups',
};

export function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('week');

  // Admin management
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [orgBusy, setOrgBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const result = await callEdge({ action: 'admin-stats', period });
        if (!cancelled) setStats(result);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, [period]);

  const loadOrganizers = useCallback(async () => {
    setOrgError(null);
    try {
      const result = await callEdge({ action: 'list-organizers' });
      setOrganizers(result.organizers || []);
    } catch (e) {
      setOrgError(e instanceof Error ? e.message : 'Failed to load admins');
    }
  }, []);

  useEffect(() => { loadOrganizers(); }, [loadOrganizers]);

  const addOrganizer = useCallback(async () => {
    const email = newEmail.trim();
    if (!email) return;
    setOrgBusy(true);
    setOrgError(null);
    try {
      await callEdge({ action: 'add-organizer', email });
      setNewEmail('');
      await loadOrganizers();
    } catch (e) {
      setOrgError(e instanceof Error ? e.message : 'Failed to add admin');
    } finally {
      setOrgBusy(false);
    }
  }, [newEmail, loadOrganizers]);

  const removeOrganizer = useCallback(async (email: string) => {
    setOrgBusy(true);
    setOrgError(null);
    try {
      await callEdge({ action: 'remove-organizer', email });
      await loadOrganizers();
    } catch (e) {
      setOrgError(e instanceof Error ? e.message : 'Failed to remove admin');
    } finally {
      setOrgBusy(false);
    }
  }, [loadOrganizers]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Dashboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {(['day', 'week', 'month', 'all'] as Period[]).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    period === p
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {periodLabels[p]}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Loading analytics…</p>
          ) : error ? (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">{error}</div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <StatCard icon={<Users className="w-4 h-4" />} label="Total Users" value={stats.totalUsers} sub="all time" />
                <StatCard icon={<UserCheck className="w-4 h-4" />} label="Active Users" value={stats.activeUsers} sub={`ran a chat · ${periodLabels[period].toLowerCase()}`} />
                <StatCard icon={<UserPlus className="w-4 h-4" />} label="New Users" value={stats.newUsers} sub={periodLabels[period].toLowerCase()} />
                <StatCard icon={<MessageSquare className="w-4 h-4" />} label="Conversations" value={stats.totalConversations} />
                <StatCard icon={<MessagesSquare className="w-4 h-4" />} label="Messages" value={stats.totalMessages} sub={`${stats.userMessages} user · ${stats.assistantMessages} bot`} />
                <StatCard icon={<MessagesSquare className="w-4 h-4" />} label="Avg / Conversation" value={stats.avgMessagesPerConversation} sub="messages per chat" />
                <StatCard icon={<FlaskConical className="w-4 h-4" />} label="Experiments" value={stats.totalExperiments} sub={`${stats.classicExperiments} classic · ${stats.researchExperiments} research`} />
                <StatCard icon={<Layers className="w-4 h-4" />} label="Scenarios" value={stats.totalScenarios} />
                <StatCard icon={<GraduationCap className="w-4 h-4" />} label="Workshops" value={`${stats.activeWorkshops} / ${stats.activeWorkshops + stats.inactiveWorkshops}`} sub={`${stats.activeWorkshops} active`} />
                <StatCard icon={<UserPlus className="w-4 h-4" />} label="Workshop Sign-ups" value={stats.totalSignups} />
                <StatCard icon={<Download className="w-4 h-4" />} label="Exports" value={stats.totalExports} />
                <StatCard
                  icon={<AlertTriangle className="w-4 h-4" />}
                  label="Provider Errors"
                  value={stats.providerErrors}
                  tone={stats.providerErrors > 0 ? 'warn' : 'default'}
                />
              </div>

              {/* Timeline */}
              <Timeline data={stats.timeline} />

              {/* Provider usage + Sign-ups by workshop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <BreakdownCard title="Provider Usage (bots configured)" empty="No conversations yet">
                  {stats.providerUsage.map(({ provider, count }) => (
                    <BarRow key={provider} label={provider} count={count} max={Math.max(...stats.providerUsage.map(p => p.count), 1)} />
                  ))}
                </BreakdownCard>

                <BreakdownCard title="Sign-ups by Workshop" empty="No workshop sign-ups yet">
                  {stats.signupsByWorkshop.map(({ workshop_code, count }) => (
                    <div key={workshop_code} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400 font-mono text-xs">{workshop_code}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                  ))}
                </BreakdownCard>
              </div>

              {/* Admin management */}
              <AdminManagement
                organizers={organizers}
                error={orgError}
                newEmail={newEmail}
                setNewEmail={setNewEmail}
                onAdd={addOrganizer}
                onRemove={removeOrganizer}
                busy={orgBusy}
              />

              {/* Recent sign-ups */}
              {stats.recentSignups.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent Sign-ups</h3>
                  <div className="space-y-2">
                    {stats.recentSignups.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400">{s.workshop_code}</span>
                          <span className="text-gray-400 dark:text-gray-500 text-xs truncate max-w-[180px]">{s.user_id.slice(0, 8)}…</span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone = 'default' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; tone?: 'default' | 'warn';
}) {
  const accent = tone === 'warn' && value !== 0
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-indigo-600 dark:text-indigo-400';
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className={`flex items-center gap-2 mb-2 ${accent}`}>{icon}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</div>}
    </div>
  );
}

function BreakdownCard({ title, empty, children }: { title: string; empty: string; children: React.ReactNode }) {
  const hasChildren = React.Children.toArray(children).length > 0;
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{title}</h3>
      {hasChildren ? <div className="space-y-2">{children}</div> : <p className="text-xs text-gray-400 dark:text-gray-500 italic">{empty}</p>}
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600 dark:text-gray-400 text-xs w-20 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.max((count / max) * 100, 2)}%` }} />
      </div>
      <span className="text-gray-700 dark:text-gray-300 font-medium w-10 text-right text-xs">{count}</span>
    </div>
  );
}

function Timeline({ data }: { data: AdminStats['timeline'] }) {
  const [metric, setMetric] = useState<TimelineMetric>('messages');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const max = useMemo(() => Math.max(...data.map(d => d[metric]), 1), [data, metric]);
  const total = useMemo(() => data.reduce((s, d) => s + d[metric], 0), [data, metric]);
  const hovered = hoveredIdx !== null ? data[hoveredIdx] : null;

  if (data.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Activity Timeline</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No activity in this period yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Activity Timeline</h3>
        <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-0.5">
          {(['messages', 'conversations', 'newUsers', 'signups'] as TimelineMetric[]).map(m => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                metric === m
                  ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {metricLabels[m]}
            </button>
          ))}
        </div>
      </div>

      <div className="h-6 mb-2 text-xs">
        {hovered ? (
          <div className="flex items-center gap-4">
            <span className="font-semibold text-gray-900 dark:text-white">{formatDay(hovered.day)}</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium">{hovered[metric]} {metricLabels[metric].toLowerCase()}</span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
            <span>{total} {metricLabels[metric].toLowerCase()} over {data.length} day{data.length === 1 ? '' : 's'}</span>
            <span className="ml-auto">Hover bars for detail</span>
          </div>
        )}
      </div>

      {/* Column chart */}
      <div className="flex items-end gap-px h-40 border-b border-gray-200 dark:border-gray-700">
        {data.map((d, i) => {
          const h = (d[metric] / max) * 100;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={d.day}
              className="flex-1 h-full flex flex-col justify-end cursor-pointer"
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className={`w-full rounded-t transition-colors ${isHovered ? 'bg-indigo-700 dark:bg-indigo-400' : 'bg-indigo-500 dark:bg-indigo-500'}`}
                style={{ height: `${Math.max(h, d[metric] > 0 ? 2 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 dark:text-gray-500">
        <span>{formatDay(data[0].day)}</span>
        {data.length > 6 && <span>{formatDay(data[Math.floor(data.length / 2)].day)}</span>}
        <span>{formatDay(data[data.length - 1].day)}</span>
      </div>
    </div>
  );
}

function AdminManagement({ organizers, error, newEmail, setNewEmail, onAdd, onRemove, busy }: {
  organizers: Organizer[];
  error: string | null;
  newEmail: string;
  setNewEmail: (v: string) => void;
  onAdd: () => void;
  onRemove: (email: string) => void;
  busy: boolean;
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
        <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        Admin Accounts ({organizers.length})
      </h3>

      <div className="space-y-1.5 mb-3">
        {organizers.map(org => (
          <div key={org.email} className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm text-gray-900 dark:text-white truncate">{org.email}</span>
              {org.isSuper && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shrink-0">
                  Primary
                </span>
              )}
              {org.created_at && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                  since {new Date(org.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            {org.isSuper ? (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">protected</span>
            ) : (
              <button
                onClick={() => onRemove(org.email)}
                disabled={busy}
                className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 shrink-0"
                title="Revoke admin access"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onAdd(); }}
          placeholder="new-admin@example.com"
          className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
        <button
          onClick={onAdd}
          disabled={busy || !newEmail.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Grant
        </button>
      </div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2">
        Admins can view this dashboard, manage workshops, and grant or revoke access. The user must already have an account with this email.
      </p>
      {error && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}
