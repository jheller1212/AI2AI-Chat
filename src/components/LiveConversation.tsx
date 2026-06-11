import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

type Who = 'a' | 'b';
interface Line { who: Who; text: string }

// A short, product-relevant exchange (the built-in B2B negotiation scenario).
const SCRIPT: Line[] = [
  { who: 'a', text: "Let's close this — $50k for the full build." },
  { who: 'b', text: '$50k is steep for the scope. I had $38k in mind.' },
  { who: 'a', text: "$38k won't cover support. Meet me at $46k?" },
  { who: 'b', text: '$42k, and we sign today.' },
  { who: 'a', text: 'Deal. Pleasure doing business.' },
];

const SPEAKERS: Record<Who, { name: string; initial: string; bubble: string; avatar: string; align: string }> = {
  a: {
    name: 'GPT-4o',
    initial: 'G',
    bubble: 'bg-orange-500/90 text-white rounded-2xl rounded-tl-sm',
    avatar: 'bg-gradient-to-br from-orange-400 to-orange-600',
    align: 'items-start',
  },
  b: {
    name: 'Claude',
    initial: 'C',
    bubble: 'bg-sky-500/90 text-white rounded-2xl rounded-tr-sm',
    avatar: 'bg-gradient-to-br from-sky-400 to-sky-600',
    align: 'items-end',
  },
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot w-1.5 h-1.5 rounded-full bg-white/70"
          style={{ animation: 'typing-bounce 1.2s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function Bubble({ line }: { line: Line }) {
  const s = SPEAKERS[line.who];
  const isA = line.who === 'a';
  return (
    <div className={`flex w-full ${isA ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[82%] gap-2 ${isA ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`mt-auto flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.avatar}`}>
          {s.initial}
        </div>
        <div>
          <span className={`block text-[10px] font-medium text-white/50 mb-1 ${isA ? 'text-left' : 'text-right'}`}>{s.name}</span>
          <div className={`px-3.5 py-2 text-sm leading-snug shadow-lg ${s.bubble}`}>{line.text}</div>
        </div>
      </div>
    </div>
  );
}

export function LiveConversation() {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(reduced ? SCRIPT.length : 0);
  const [typingWho, setTypingWho] = useState<Who | null>(null);
  const [loopId, setLoopId] = useState(0); // bumped each loop so keys stay stable within a loop
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced) {
      setCount(SCRIPT.length);
      setTypingWho(null);
      return;
    }
    let i = 0;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const run = () => {
      if (cancelled) return;
      if (i >= SCRIPT.length) {
        setTypingWho(null);
        timer = setTimeout(() => {
          if (cancelled) return;
          i = 0;
          setCount(0);
          setLoopId((l) => l + 1);
          run();
        }, 3200);
        return;
      }
      setTypingWho(SCRIPT[i].who);
      timer = setTimeout(() => {
        if (cancelled) return;
        setTypingWho(null);
        setCount(i + 1);
        i += 1;
        timer = setTimeout(run, 1500);
      }, 950);
    };

    timer = setTimeout(run, 700);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduced]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
  }, [count, typingWho, reduced]);

  const shown = SCRIPT.slice(0, count);

  return (
    <div
      aria-hidden
      className="w-full max-w-md rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md shadow-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-[10px] font-bold text-white ring-2 ring-[#0a1424]">G</div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-sky-600 text-[10px] font-bold text-white ring-2 ring-[#0a1424]">C</div>
          </div>
          <span className="text-xs font-medium text-white/80">GPT-4o × Claude</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[10px] uppercase tracking-wide text-white/50">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-72 space-y-3 overflow-y-auto px-4 py-4 scroll-smooth">
        <AnimatePresence initial={false}>
          {shown.map((line, idx) => (
            <motion.div
              key={`${loopId}-${idx}`}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Bubble line={line} />
            </motion.div>
          ))}
        </AnimatePresence>

        {typingWho && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${typingWho === 'a' ? 'justify-start' : 'justify-end'}`}
          >
            <div className={`rounded-2xl ${typingWho === 'a' ? 'bg-orange-500/40 rounded-tl-sm' : 'bg-sky-500/40 rounded-tr-sm'}`}>
              <TypingDots />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
