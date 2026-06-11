import React from 'react';

/**
 * Calm, app-wide navy aurora backdrop for the signed-in app (dark mode only).
 * A quieter sibling of the landing's AuroraBackground — lower-opacity blobs,
 * slower drift — so it sets the brand atmosphere without distracting from work.
 * Fixed behind all content; freezes under prefers-reduced-motion.
 */
export function AppBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden dark:block" aria-hidden>
      <div
        className="aurora-blob absolute -top-[15%] -left-[8%] h-[55vh] w-[55vh] rounded-full bg-orange-500/20 blur-[110px]"
        style={{ animation: 'aurora-a 34s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob absolute top-1/3 right-[-8%] h-[50vh] w-[50vh] rounded-full bg-sky-500/20 blur-[110px]"
        style={{ animation: 'aurora-b 40s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob absolute bottom-[-18%] left-1/3 h-[45vh] w-[45vh] rounded-full bg-indigo-500/15 blur-[120px]"
        style={{ animation: 'aurora-c 46s ease-in-out infinite' }}
      />
    </div>
  );
}
