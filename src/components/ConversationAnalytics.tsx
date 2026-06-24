import React, { useMemo } from 'react';
import { BarChart3, Download, MessageSquare, Hash, Clock, Sparkles, Info } from 'lucide-react';
import { InfoTooltip } from './InfoTooltip';
import type { Message } from '../types';
import {
  buildConversationReport,
  significanceLabel,
  effectSizeLabel,
  type BotStats,
  type TTestResult,
} from '../lib/conversationStats';

interface ConversationAnalyticsProps {
  messages: Message[];
  botName1: string;
  botName2: string;
  textColor1: string;
  textColor2: string;
}

const COLOR1 = '#4338CA';
const COLOR2 = '#047857';

const fmt = (n: number, d = 1) => n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtInt = (n: number) => n.toLocaleString();

function buildTextReport(
  report: ReturnType<typeof buildConversationReport>,
  name1: string,
  name2: string,
): string {
  const { bot1, bot2, tests, distinctive } = report;
  const lines: string[] = [];
  lines.push('AI2AI CHAT — CONVERSATION ANALYTICS');
  lines.push(`${name1} vs ${name2}`);
  lines.push('='.repeat(48));
  lines.push('');
  lines.push('DESCRIPTIVES');
  const rows: [string, string, string][] = [
    ['Metric', name1, name2],
    ['Turns', String(bot1.turns), String(bot2.turns)],
    ['Total words', String(bot1.totalWords), String(bot2.totalWords)],
    ['Mean words/turn', `${fmt(bot1.meanWordsPerTurn)} (SD ${fmt(bot1.sdWordsPerTurn)})`, `${fmt(bot2.meanWordsPerTurn)} (SD ${fmt(bot2.sdWordsPerTurn)})`],
    ['Unique words', String(bot1.uniqueWords), String(bot2.uniqueWords)],
    ['Type-token ratio', fmt(bot1.typeTokenRatio, 3), fmt(bot2.typeTokenRatio, 3)],
    ['Lexical diversity (Guiraud R)', fmt(bot1.guiraudR, 2), fmt(bot2.guiraudR, 2)],
    ['Mean sentence length', fmt(bot1.meanSentenceLength), fmt(bot2.meanSentenceLength)],
  ];
  for (const r of rows) lines.push(`  ${r[0].padEnd(32)} ${r[1].padEnd(20)} ${r[2]}`);
  lines.push('');
  lines.push('SIGNIFICANCE TESTS (per-turn metrics)');
  for (const t of tests) {
    const sig = significanceLabel(t.p);
    lines.push(`  ${t.metric}`);
    lines.push(`    ${name1}: M=${fmt(t.meanA)} (SD ${fmt(t.sdA)}), ${name2}: M=${fmt(t.meanB)} (SD ${fmt(t.sdB)})`);
    lines.push(`    Welch t(${fmt(t.df)})=${fmt(t.t, 2)}, ${sig.text}, Cohen's d=${fmt(t.cohenD, 2)} (${effectSizeLabel(t.cohenD)})`);
    if (t.mannWhitney) {
      const mwSig = significanceLabel(t.mannWhitney.p);
      lines.push(`    Mann-Whitney U=${fmt(t.mannWhitney.u, 1)}, z=${fmt(t.mannWhitney.z, 2)}, ${mwSig.text}`);
    }
  }
  lines.push('  Corpus-level metrics (total/unique words, type-token ratio, Guiraud R)');
  lines.push('  are a single value per bot and are not significance-tested.');
  lines.push('');
  lines.push('DISTINCTIVE WORDS (weighted log-odds z)');
  lines.push(`  ${name1}: ${distinctive.botA.map(d => `${d.word} (${d.z.toFixed(1)})`).join(', ') || '—'}`);
  lines.push(`  ${name2}: ${distinctive.botB.map(d => `${d.word} (${Math.abs(d.z).toFixed(1)})`).join(', ') || '—'}`);
  lines.push('');
  lines.push('Note: turns within a conversation are sequential and not strictly');
  lines.push('independent, so p-values are indicative rather than confirmatory.');
  return lines.join('\n');
}

/** Compact inline significance line: Welch t + Mann-Whitney U. */
function SigInline({ test }: { test: TTestResult }) {
  const tSig = significanceLabel(test.p);
  const mw = test.mannWhitney;
  const mwSig = mw ? significanceLabel(mw.p) : null;
  const anyStars = !!tSig.stars || !!mwSig?.stars;
  return (
    <p className={`text-[10px] tabular-nums mt-0.5 ${anyStars ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`}>
      Welch t {tSig.text} {tSig.stars}
      {mwSig && <> · Mann-Whitney {mwSig.text} {mwSig.stars}</>}
    </p>
  );
}

function StatRow({ label, icon, v1, v2, test, corpus, tooltip }: {
  label: string;
  icon?: React.ReactNode;
  v1: string;
  v2: string;
  test?: TTestResult | null;
  corpus?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="py-1.5 border-b border-gray-100 dark:border-gray-700/60 last:border-0">
      <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center">
        <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1.5">{icon}{label}{tooltip && <InfoTooltip text={tooltip} />}</span>
        <span className="text-sm font-semibold tabular-nums text-right w-24" style={{ color: COLOR1 }}>{v1}</span>
        <span className="text-sm font-semibold tabular-nums text-right w-24" style={{ color: COLOR2 }}>{v2}</span>
      </div>
      {test && <SigInline test={test} />}
      {corpus && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5" title="A single value per bot — there is no per-turn distribution to run a two-sample test on.">— corpus-level (no per-turn test)</p>}
    </div>
  );
}

export function ConversationAnalytics({ messages, botName1, botName2, textColor1, textColor2 }: ConversationAnalyticsProps) {
  const report = useMemo(() => buildConversationReport(messages, botName1, botName2), [messages, botName1, botName2]);
  const c1 = textColor1 !== '#312E81' ? textColor1 : COLOR1;
  const c2 = textColor2 !== '#064E3B' ? textColor2 : COLOR2;

  const { bot1, bot2, tests, distinctive, insufficient } = report;
  const testByMetric = useMemo(() => new Map(tests.map(t => [t.metric, t])), [tests]);

  if (bot1.turns === 0 && bot2.turns === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm gap-3 p-8 text-center">
        <BarChart3 className="w-10 h-10" />
        Run a conversation to see a statistical comparison of the two AIs.
      </div>
    );
  }

  const handleDownload = () => {
    const blob = new Blob([buildTextReport(report, botName1, botName2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai2ai-analytics-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const spokeMore = bot1.totalWords === bot2.totalWords ? null : bot1.totalWords > bot2.totalWords ? botName1 : botName2;

  return (
    <div className="p-5 max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-500" />
            Conversation analytics
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            <span className="font-medium" style={{ color: c1 }}>{botName1}</span>
            <span className="mx-1.5">vs</span>
            <span className="font-medium" style={{ color: c2 }}>{botName2}</span>
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          Report (.txt)
        </button>
      </div>

      {/* Headline takeaway */}
      {spokeMore && (
        <div className="rounded-xl bg-gradient-to-r from-indigo-50 to-emerald-50 dark:from-indigo-900/20 dark:to-emerald-900/20 border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold" style={{ color: spokeMore === botName1 ? c1 : c2 }}>{spokeMore}</span>
          {' '}produced more total words ({fmtInt(Math.max(bot1.totalWords, bot2.totalWords))} vs {fmtInt(Math.min(bot1.totalWords, bot2.totalWords))}).
        </div>
      )}

      {/* Descriptives */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="grid grid-cols-[1fr_auto_auto] gap-3 items-center pb-2 mb-1 border-b border-gray-200 dark:border-gray-600">
          <span className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Metric</span>
          <span className="text-xs font-semibold text-right w-24 truncate" style={{ color: c1 }} title={botName1}>{botName1}</span>
          <span className="text-xs font-semibold text-right w-24 truncate" style={{ color: c2 }} title={botName2}>{botName2}</span>
        </div>
        <StatRow label="Turns" icon={<MessageSquare className="w-3 h-3 text-gray-400" />} v1={fmtInt(bot1.turns)} v2={fmtInt(bot2.turns)}
          tooltip="How many times this AI spoke. Good for a quick check that both bots took part roughly equally." />
        <StatRow label="Total words" icon={<Hash className="w-3 h-3 text-gray-400" />} v1={fmtInt(bot1.totalWords)} v2={fmtInt(bot2.totalWords)} corpus
          tooltip="Total words this AI produced across the whole conversation. A simple measure of how talkative or verbose it was." />
        <StatRow label="Mean words / turn" v1={`${fmt(bot1.meanWordsPerTurn)}`} v2={`${fmt(bot2.meanWordsPerTurn)}`} test={testByMetric.get('Words per turn')}
          tooltip="Average words per message. Higher = longer, more detailed replies; lower = shorter, more concise ones. Good for comparing how wordy each bot is." />
        <StatRow label="± SD" v1={fmt(bot1.sdWordsPerTurn)} v2={fmt(bot2.sdWordsPerTurn)}
          tooltip="Standard deviation of words per turn — how much the reply length jumped around. Small = consistent length; large = a mix of very short and very long replies." />
        <StatRow label="Unique words" v1={fmtInt(bot1.uniqueWords)} v2={fmtInt(bot2.uniqueWords)} corpus
          tooltip="The number of different words used (vocabulary size). More unique words suggests a broader vocabulary." />
        <StatRow label="Type-token ratio" v1={fmt(bot1.typeTokenRatio, 3)} v2={fmt(bot2.typeTokenRatio, 3)} corpus
          tooltip="Unique words ÷ total words. Closer to 1 = more varied wording; closer to 0 = more repetition. Caveat: longer texts naturally score lower, so compare with care." />
        <StatRow label="Lexical diversity (Guiraud R)" v1={fmt(bot1.guiraudR, 2)} v2={fmt(bot2.guiraudR, 2)} corpus
          tooltip="A length-adjusted vocabulary-richness score (unique words ÷ √total words). Fairer than type-token ratio when the bots wrote different amounts. Higher = richer, more varied vocabulary." />
        <StatRow label="Mean sentence length (words)" v1={fmt(bot1.meanSentenceLength)} v2={fmt(bot2.meanSentenceLength)} test={testByMetric.get('Sentence length (words)')}
          tooltip="Average words per sentence. Higher suggests denser, more complex writing; lower suggests punchier, simpler sentences." />
        {(bot1.hasResponseTimes || bot2.hasResponseTimes) && (
          <StatRow
            label="Total response time"
            icon={<Clock className="w-3 h-3 text-gray-400" />}
            v1={bot1.hasResponseTimes ? `${fmt(bot1.totalResponseMs / 1000)}s` : '—'}
            v2={bot2.hasResponseTimes ? `${fmt(bot2.totalResponseMs / 1000)}s` : '—'}
            test={testByMetric.get('Response time (s)')}
            tooltip="Combined time this AI took to generate its replies. Good for comparing the raw speed of the two models or providers."
          />
        )}
      </section>

      {/* Significance tests */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
          Are the differences significant?
          <InfoTooltip text="Tells you whether a gap between the two bots is real or could just be random chance. A low p-value (shown with ★ stars) means the difference is unlikely to be a fluke. Cohen's d is how BIG the gap is (0.2 small, 0.5 medium, 0.8+ large). Welch's t and Mann-Whitney are two ways of testing the same thing — agreement between them makes the result more trustworthy." />
        </h4>
        {insufficient ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Each AI needs at least 2 turns to run a t-test. Let the conversation run longer for a statistical comparison.
          </p>
        ) : (
          <div className="space-y-2">
            {tests.map((t: TTestResult) => {
              const sig = significanceLabel(t.p);
              const higher = t.meanA === t.meanB ? null : t.meanA > t.meanB ? botName1 : botName2;
              return (
                <div key={t.metric} className="text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{t.metric}</span>
                    <span className={`tabular-nums ${sig.stars ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                      {sig.text} {sig.stars}
                    </span>
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 tabular-nums mt-0.5">
                    Welch t({fmt(t.df)}) = {fmt(t.t, 2)}, {sig.text} {sig.stars}, Cohen&apos;s d = {fmt(t.cohenD, 2)} ({effectSizeLabel(t.cohenD)})
                    {sig.stars && higher && (
                      <> — <span style={{ color: higher === botName1 ? c1 : c2 }} className="font-medium">{higher}</span> higher</>
                    )}
                  </div>
                  {t.mannWhitney && (() => {
                    const mwSig = significanceLabel(t.mannWhitney.p);
                    return (
                      <div className="text-gray-500 dark:text-gray-400 tabular-nums mt-0.5">
                        Mann-Whitney U = {fmt(t.mannWhitney.u, 1)}, z = {fmt(t.mannWhitney.z, 2)}, {mwSig.text} {mwSig.stars}
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Distinctive words */}
      {(distinctive.botA.length > 0 || distinctive.botB.length > 0) && (
        <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Distinctive words
            <InfoTooltip text="The words each bot used far more than the other — its verbal fingerprint. Good for spotting how the two personalities or system prompts shaped their language. Common filler words (the, and, is…) are filtered out." />
          </h4>
          <div className="grid grid-cols-2 gap-4">
            {[{ name: botName1, color: c1, words: distinctive.botA }, { name: botName2, color: c2, words: distinctive.botB }].map((col) => (
              <div key={col.name}>
                <p className="text-xs font-medium mb-2 truncate" style={{ color: col.color }} title={col.name}>{col.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {col.words.length === 0 ? (
                    <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                  ) : (
                    col.words.map((w) => (
                      <span
                        key={w.word}
                        className="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        title={`used ${col.name === botName1 ? w.countA : w.countB}× here vs ${col.name === botName1 ? w.countB : w.countA}× by the other`}
                      >
                        {w.word}
                      </span>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Methodology note */}
      <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-start gap-1.5 leading-relaxed">
        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
        Each per-turn metric is tested two ways: Welch&apos;s two-sample t-test (parametric) and the
        Mann-Whitney U test (non-parametric, robust to skew). Each AI turn is one observation; turns
        within a conversation are sequential and not strictly independent, so p-values are indicative
        rather than confirmatory. Corpus-level metrics (type-token ratio, Guiraud R, total/unique
        words) are a single value per bot and cannot be two-sample tested. Distinctive words use
        weighted log-odds (Monroe et al., 2008), excluding common function words.
      </p>
    </div>
  );
}
