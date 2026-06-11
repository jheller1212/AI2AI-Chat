import type { Message } from '../types';

// ──────────────────────────────────────────────────────────────────────────
// Conversation analytics: compares the two AIs' responses in a conversation
// with descriptive stats and a Welch's two-sample t-test per metric.
//
// All maths is implemented locally (no runtime deps). The t-distribution
// p-value uses the regularised incomplete beta function (Numerical Recipes).
// ──────────────────────────────────────────────────────────────────────────

const WORD_RE = /[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu;
const SENTENCE_RE = /[^.!?]+[.!?]*/g;

/** Common English function words — excluded from the distinctive-word view only. */
const STOPWORDS = new Set(
  ('a an and are as at be been being but by for from had has have he her his i in into is it its ' +
    'me my no nor not of on or our she so that the their them then there they this to too us was ' +
    'we were what when which who will with would you your i\'m it\'s that\'s don\'t can\'t do does ' +
    'did if just about would could should can may might also more most than then them these those ' +
    'how why all any some such only own same other some any each')
    .split(/\s+/),
);

export function tokenizeWords(text: string): string[] {
  return (text.toLowerCase().match(WORD_RE) ?? []);
}

export function countSentences(text: string): number {
  const m = text.match(SENTENCE_RE);
  const n = m ? m.filter(s => s.trim().length > 0).length : 0;
  return Math.max(n, 1); // a non-empty turn is at least one sentence
}

// ── Descriptive helpers ─────────────────────────────────────────────────────

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Sample variance (n − 1 denominator). */
function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
}

function sd(xs: number[]): number {
  return Math.sqrt(variance(xs));
}

// ── Regularised incomplete beta + Student's t two-tailed p ──────────────────

function logGamma(x: number): number {
  const c = [
    76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
  ];
  let y = x;
  let tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += c[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function betacf(a: number, b: number, x: number): number {
  const FPMIN = 1e-30;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 200; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 3e-7) break;
  }
  return h;
}

/** Regularised incomplete beta function I_x(a, b). */
function regIncBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Two-tailed p-value for a t statistic with df degrees of freedom. */
export function studentTPValue(t: number, df: number): number {
  if (!isFinite(t) || df <= 0) return NaN;
  return regIncBeta(df / (df + t * t), df / 2, 0.5);
}

// ── Welch's two-sample t-test ───────────────────────────────────────────────

export interface TTestResult {
  metric: string;
  meanA: number;
  meanB: number;
  sdA: number;
  sdB: number;
  nA: number;
  nB: number;
  t: number;
  df: number;
  p: number;
  cohenD: number;
}

export function welchTTest(metric: string, a: number[], b: number[]): TTestResult | null {
  if (a.length < 2 || b.length < 2) return null;
  const mA = mean(a);
  const mB = mean(b);
  const vA = variance(a);
  const vB = variance(b);
  const nA = a.length;
  const nB = b.length;

  const seA = vA / nA;
  const seB = vB / nB;
  const denom = Math.sqrt(seA + seB);
  if (denom === 0) return null; // both samples constant & equal

  const t = (mA - mB) / denom;
  const df = (seA + seB) ** 2 / (seA ** 2 / (nA - 1) + seB ** 2 / (nB - 1));
  const p = studentTPValue(t, df);

  // Cohen's d with pooled SD
  const pooledSd = Math.sqrt(((nA - 1) * vA + (nB - 1) * vB) / (nA + nB - 2));
  const cohenD = pooledSd === 0 ? 0 : (mA - mB) / pooledSd;

  return { metric, meanA: mA, meanB: mB, sdA: Math.sqrt(vA), sdB: Math.sqrt(vB), nA, nB, t, df, p, cohenD };
}

// ── Distinctive words (weighted log-odds, uninformative Dirichlet prior) ─────
// Monroe, Colaresi & Quinn (2008). Positive z → distinctive to bot A.

export interface DistinctiveWord {
  word: string;
  z: number;
  countA: number;
  countB: number;
}

export function distinctiveWords(
  tokensA: string[],
  tokensB: string[],
  minTotal = 3,
  topN = 8,
): { botA: DistinctiveWord[]; botB: DistinctiveWord[] } {
  const countA = new Map<string, number>();
  const countB = new Map<string, number>();
  for (const w of tokensA) if (!STOPWORDS.has(w) && w.length > 2) countA.set(w, (countA.get(w) ?? 0) + 1);
  for (const w of tokensB) if (!STOPWORDS.has(w) && w.length > 2) countB.set(w, (countB.get(w) ?? 0) + 1);

  const vocab = new Set([...countA.keys(), ...countB.keys()]);
  const a0 = 0.5 * vocab.size; // total prior mass (uniform α = 0.5 per word)
  const nA = [...countA.values()].reduce((s, v) => s + v, 0);
  const nB = [...countB.values()].reduce((s, v) => s + v, 0);

  const scored: DistinctiveWord[] = [];
  for (const w of vocab) {
    const yA = countA.get(w) ?? 0;
    const yB = countB.get(w) ?? 0;
    if (yA + yB < minTotal) continue;
    const a = yA + 0.5;
    const b = yB + 0.5;
    const delta = Math.log(a / (nA + a0 - a)) - Math.log(b / (nB + a0 - b));
    const varDelta = 1 / a + 1 / b;
    const z = delta / Math.sqrt(varDelta);
    scored.push({ word: w, z, countA: yA, countB: yB });
  }

  const byA = [...scored].sort((x, y) => y.z - x.z).filter(d => d.z > 0).slice(0, topN);
  const byB = [...scored].sort((x, y) => x.z - y.z).filter(d => d.z < 0).slice(0, topN);
  return { botA: byA, botB: byB };
}

// ── Per-bot aggregate + full conversation report ────────────────────────────

export interface BotStats {
  label: string;
  turns: number;
  totalWords: number;
  meanWordsPerTurn: number;
  sdWordsPerTurn: number;
  uniqueWords: number;
  typeTokenRatio: number;
  guiraudR: number; // length-robust lexical diversity: types / sqrt(tokens)
  meanSentenceLength: number;
  totalResponseMs: number;
  hasResponseTimes: boolean;
}

export interface ConversationReport {
  bot1: BotStats;
  bot2: BotStats;
  tests: TTestResult[];
  distinctive: { botA: DistinctiveWord[]; botB: DistinctiveWord[] };
  /** True when at least one bot has < 2 turns, so the t-tests can't run. */
  insufficient: boolean;
}

interface PerTurn {
  words: number;
  sentenceLength: number;
  responseMs: number | null;
}

function collect(messages: Message[], botIndex: 1 | 2): { turns: PerTurn[]; tokens: string[] } {
  const turns: PerTurn[] = [];
  const tokens: string[] = [];
  for (const m of messages) {
    if (m.role !== 'assistant' || m.hidden || m.botIndex !== botIndex) continue;
    const toks = tokenizeWords(m.content);
    tokens.push(...toks);
    const sentences = countSentences(m.content);
    turns.push({
      words: toks.length,
      sentenceLength: toks.length / sentences,
      responseMs: m.timeTaken && m.timeTaken > 0 ? m.timeTaken : null,
    });
  }
  return { turns, tokens };
}

function aggregate(label: string, turns: PerTurn[], tokens: string[]): BotStats {
  const words = turns.map(t => t.words);
  const totalWords = words.reduce((a, b) => a + b, 0);
  const unique = new Set(tokens).size;
  const times = turns.map(t => t.responseMs).filter((x): x is number => x != null);
  return {
    label,
    turns: turns.length,
    totalWords,
    meanWordsPerTurn: mean(words),
    sdWordsPerTurn: sd(words),
    uniqueWords: unique,
    typeTokenRatio: tokens.length ? unique / tokens.length : 0,
    guiraudR: tokens.length ? unique / Math.sqrt(tokens.length) : 0,
    meanSentenceLength: mean(turns.map(t => t.sentenceLength)),
    totalResponseMs: times.reduce((a, b) => a + b, 0),
    hasResponseTimes: times.length > 0,
  };
}

/**
 * Build a full comparison report from the visible messages of a conversation.
 * `messages` should be the on-screen messages (system/hidden are ignored).
 */
export function buildConversationReport(
  messages: Message[],
  botName1: string,
  botName2: string,
): ConversationReport {
  const a = collect(messages, 1);
  const b = collect(messages, 2);

  const bot1 = aggregate(botName1, a.turns, a.tokens);
  const bot2 = aggregate(botName2, b.turns, b.tokens);

  const tests: TTestResult[] = [];
  const wpt = welchTTest('Words per turn', a.turns.map(t => t.words), b.turns.map(t => t.words));
  if (wpt) tests.push(wpt);
  const sl = welchTTest('Sentence length (words)', a.turns.map(t => t.sentenceLength), b.turns.map(t => t.sentenceLength));
  if (sl) tests.push(sl);
  if (bot1.hasResponseTimes && bot2.hasResponseTimes) {
    const rt = welchTTest(
      'Response time (s)',
      a.turns.filter(t => t.responseMs != null).map(t => (t.responseMs as number) / 1000),
      b.turns.filter(t => t.responseMs != null).map(t => (t.responseMs as number) / 1000),
    );
    if (rt) tests.push(rt);
  }

  return {
    bot1,
    bot2,
    tests,
    distinctive: distinctiveWords(a.tokens, b.tokens),
    insufficient: a.turns.length < 2 || b.turns.length < 2,
  };
}

/** Plain-language significance label for a p-value. */
export function significanceLabel(p: number): { stars: string; text: string } {
  if (!isFinite(p)) return { stars: '', text: 'n/a' };
  if (p < 0.001) return { stars: '***', text: 'p < .001' };
  if (p < 0.01) return { stars: '**', text: `p = ${p.toFixed(3)}` };
  if (p < 0.05) return { stars: '*', text: `p = ${p.toFixed(3)}` };
  return { stars: '', text: `p = ${p.toFixed(2)} (n.s.)` };
}

/** Cohen's d magnitude descriptor. */
export function effectSizeLabel(d: number): string {
  const a = Math.abs(d);
  if (a < 0.2) return 'negligible';
  if (a < 0.5) return 'small';
  if (a < 0.8) return 'medium';
  return 'large';
}
