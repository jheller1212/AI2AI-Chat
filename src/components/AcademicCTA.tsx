import React from 'react';
import { FadeUp } from './FadeUp';

interface AcademicCTAProps {
  onSignUpClick: () => void;
}

export function AcademicCTA({ onSignUpClick }: AcademicCTAProps) {
  return (
    <section className="py-20 sm:py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-sky-500 px-8 py-14 sm:py-16 text-center shadow-xl">
          {/* Soft light accents */}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_0%,rgba(255,255,255,0.25),transparent_50%)]" aria-hidden />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Ready to try it?</h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto leading-relaxed">
              Free for researchers, teams, and educators. Bring your own API keys from OpenAI, Anthropic, Google, or Mistral.
            </p>
            <button
              onClick={onSignUpClick}
              className="px-8 py-4 text-lg font-semibold text-orange-600 bg-white rounded-xl hover:bg-orange-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Create free account
            </button>
            <p className="mt-4 text-sm text-white/75">Free to use · No credit card · Cancel anytime</p>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
