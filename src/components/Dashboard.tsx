import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, FlaskConical, Clock, Play } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ScenarioCards } from './ScenarioCards';
import type { Scenario } from './ScenarioCards';
import type { Experiment } from './ExperimentsPanel';
import { staggerContainer, staggerItem } from '../lib/motionVariants';

interface RecentConversation {
  id: string;
  title: string;
  model1_type: string;
  model2_type: string;
  created_at: string;
}

interface DashboardProps {
  userId: string;
  onNewConversation: () => void;
  onLoadExperiment: (experiment: Experiment) => void;
  onLoadScenario: (scenario: Scenario) => void;
  onOpenHistory: () => void;
  onOpenExperiments: () => void;
}

const PROVIDER_LABELS: Record<string, string> = {
  gpt4: 'OpenAI',
  claude: 'Claude',
  gemini: 'Gemini',
  mistral: 'Mistral',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function SkeletonSection() {
  return (
    <div>
      <div className="h-4 w-40 rounded bg-gray-100 dark:bg-white/5 shimmer mb-3" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[68px] rounded-lg bg-gray-100 dark:bg-white/5 shimmer" />
        ))}
      </div>
    </div>
  );
}

export function Dashboard({
  userId,
  onNewConversation,
  onLoadExperiment,
  onLoadScenario,
  onOpenHistory,
  onOpenExperiments,
}: DashboardProps) {
  const [recentConvos, setRecentConvos] = useState<RecentConversation[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [convRes, expRes] = await Promise.all([
        supabase
          .from('conversations')
          .select('id, title, model1_type, model2_type, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('experiments')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(6),
      ]);
      setRecentConvos((convRes.data as RecentConversation[]) ?? []);
      setExperiments((expRes.data as Experiment[]) ?? []);
      setLoading(false);
    }
    load();
  }, [userId]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Hero / New conversation CTA */}
        <motion.div
          className="text-center space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-display text-gray-900 dark:text-white">
            What would you like to explore?
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            Set up two AI bots, give them a scenario, and watch them interact.
          </p>
          <motion.button
            onClick={onNewConversation}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-sky-500 rounded-xl shadow-lab-lift hover:shadow-xl"
          >
            <Plus className="w-4 h-4" />
            New Conversation
          </motion.button>
        </motion.div>

        {/* Scenario quick-start */}
        <ScenarioCards onSelect={(s) => onLoadScenario(s)} />

        {loading ? (
          <div className="space-y-8">
            <SkeletonSection />
            <SkeletonSection />
          </div>
        ) : (
          <>
            {/* Recent conversations */}
            {recentConvos.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <MessageSquare className="w-4 h-4" />
                    Recent Conversations
                  </div>
                  <button
                    onClick={onOpenHistory}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    View all
                  </button>
                </div>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {recentConvos.map((c) => (
                    <motion.div
                      key={c.id}
                      variants={staggerItem}
                      whileHover={{ y: -3 }}
                      className="p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.06] dark:backdrop-blur-md shadow-lab-float hover:shadow-lab-lift hover:border-sky-300 dark:hover:border-sky-600 transition-shadow"
                    >
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate mb-1">
                        {c.title || '(Untitled)'}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-400">
                        <span>{PROVIDER_LABELS[c.model1_type] || c.model1_type} vs {PROVIDER_LABELS[c.model2_type] || c.model2_type}</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(c.created_at)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            )}

            {/* Saved experiments */}
            {experiments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    <FlaskConical className="w-4 h-4" />
                    Saved Experiments
                  </div>
                  <button
                    onClick={onOpenExperiments}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300"
                  >
                    View all
                  </button>
                </div>
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                >
                  {experiments.map((exp) => (
                    <motion.button
                      key={exp.id}
                      variants={staggerItem}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onLoadExperiment(exp)}
                      className="text-left p-3 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.06] dark:backdrop-blur-md shadow-lab-float hover:shadow-lab-lift hover:border-orange-300 dark:hover:border-orange-600 transition-shadow group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {exp.name}
                        </p>
                        <Play className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-orange-500 transition-colors" />
                      </div>
                      {exp.condition_label && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400">
                          {exp.condition_label}
                        </span>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400 dark:text-gray-400">
                        {exp.run_count > 0 && <span>{exp.run_count} run{exp.run_count !== 1 ? 's' : ''}</span>}
                        <span>{timeAgo(exp.created_at)}</span>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
