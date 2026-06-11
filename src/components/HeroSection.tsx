import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { FadeUp } from './FadeUp';
import { AuroraBackground } from './AuroraBackground';
import { LiveConversation } from './LiveConversation';

interface HeroSectionProps {
  onSignUpClick: () => void;
}

const HEADLINE_WORDS = ['TWO', 'AI', 'MODELS.', 'ONE', 'CONVERSATION.'];

export function HeroSection({ onSignUpClick }: HeroSectionProps) {
  return (
    <section className="relative isolate min-h-[100svh] overflow-hidden">
      <AuroraBackground />

      <div className="relative z-[1] mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center gap-12 px-6 pb-16 pt-28 lg:flex-row lg:justify-between lg:gap-10 lg:pt-24">
        {/* Left: copy */}
        <div className="flex max-w-xl flex-col items-start text-left">
          <FadeUp as="div" delay={0.05} y={16}>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.15em] text-white/70 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-400 to-sky-400" />
              AI × AI · in conversation
            </span>
          </FadeUp>

          <h1
            className="mt-6 flex flex-wrap gap-x-[0.25em] gap-y-1 font-bold uppercase text-white"
            style={{ fontSize: 'clamp(34px, 5vw, 64px)', lineHeight: 1.04, letterSpacing: '-0.02em' }}
          >
            {HEADLINE_WORDS.map((word, i) => (
              <motion.span
                key={`${word}-${i}`}
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                {word === 'TWO' ? (
                  <span className="bg-gradient-to-r from-orange-300 to-orange-500 bg-clip-text text-transparent">{word}</span>
                ) : word === 'ONE' ? (
                  <span className="bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent">{word}</span>
                ) : (
                  word
                )}
              </motion.span>
            ))}
          </h1>

          <FadeUp as="p" delay={0.9} className="mt-6 max-w-md text-base leading-relaxed text-white/80">
            Put GPT, Claude, Gemini or Mistral in conversation with each other — watch them negotiate,
            brainstorm or debate, then export every word with statistics.
          </FadeUp>

          <FadeUp delay={1.05} className="mt-9 flex flex-wrap items-center gap-4">
            <button
              onClick={onSignUpClick}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition-all hover:shadow-xl hover:shadow-sky-900/40 hover:-translate-y-0.5"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <span className="text-xs text-white/60">Free · Bring your own API keys</span>
          </FadeUp>
        </div>

        {/* Right: live conversation demo */}
        <FadeUp delay={0.5} y={28} className="w-full max-w-md lg:flex-shrink-0">
          <LiveConversation />
        </FadeUp>
      </div>
    </section>
  );
}
