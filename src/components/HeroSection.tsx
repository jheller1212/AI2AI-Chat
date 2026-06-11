import React from 'react';
import { motion } from 'framer-motion';
import { FadeUp } from './FadeUp';

interface HeroSectionProps {
  onSignUpClick: () => void;
}

const HEADLINE_WORDS = ['TWO', 'AI', 'MODELS.', 'ONE', 'CONVERSATION.'];

export function HeroSection({ onSignUpClick }: HeroSectionProps) {
  return (
    <section className="relative z-[1] flex h-screen flex-col justify-center px-8 pb-8 pt-[70px] max-[900px]:px-[18px] max-[900px]:pt-[90px]">
      <div className="flex max-w-[720px] flex-col items-start">
        <h2
          className="m-0 flex flex-wrap gap-[0.25em] font-bold uppercase text-white"
          style={{
            fontSize: 'clamp(26px, 3vw, 42px)',
            lineHeight: 1.08,
            letterSpacing: '-0.01em',
          }}
        >
          {HEADLINE_WORDS.map((word, i) => (
            <motion.span
              key={`${word}-${i}`}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.15 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              {word === 'TWO' || word === 'ONE' ? (
                <span className={word === 'TWO' ? 'text-orange-400' : 'text-sky-400'}>{word}</span>
              ) : (
                word
              )}
            </motion.span>
          ))}
        </h2>

        <FadeUp as="p" delay={0.9} className="mt-6 max-w-[260px] text-[14px] leading-[1.65] text-white/85">
          Put GPT, Claude, Gemini or Mistral in conversation with each other — and export every word.
        </FadeUp>

        <FadeUp delay={1.05} className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={onSignUpClick}
            className="rounded-lg bg-gradient-to-r from-orange-500 to-sky-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:from-orange-400 hover:to-sky-400 hover:shadow-xl"
          >
            Create free account
          </button>
          <span className="text-xs text-white/70">Free to use · Bring your own API keys</span>
        </FadeUp>
      </div>
    </section>
  );
}
