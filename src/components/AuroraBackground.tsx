import React from 'react';

/**
 * Self-contained animated hero background: a deep navy base with three large,
 * blurred brand-coloured "aurora" blobs drifting on independent loops, plus a
 * faint dot-grid for texture. Pure CSS animation (GPU transforms) — no canvas,
 * no external assets — and it freezes under prefers-reduced-motion.
 */
export function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#0a1424]" aria-hidden>
      {/* Drifting brand blobs */}
      <div
        className="aurora-blob absolute -top-1/4 -left-[10%] h-[60vh] w-[60vh] rounded-full bg-orange-500/40 blur-[90px]"
        style={{ animation: 'aurora-a 22s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob absolute top-1/3 right-[-5%] h-[55vh] w-[55vh] rounded-full bg-sky-500/40 blur-[90px]"
        style={{ animation: 'aurora-b 26s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob absolute bottom-[-15%] left-1/4 h-[50vh] w-[50vh] rounded-full bg-indigo-500/30 blur-[100px]"
        style={{ animation: 'aurora-c 30s ease-in-out infinite' }}
      />

      {/* Faint dot grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 40%, black 30%, transparent 75%)',
        }}
      />

      {/* Legibility wash — darker at bottom and left for text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1424] via-[#0a1424]/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1424]/70 via-transparent to-transparent" />
    </div>
  );
}
