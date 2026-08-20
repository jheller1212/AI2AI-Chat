// Not rendered in normal operation. Kept as a ready-made holding page for the
// next time the backend is unavailable: point main.tsx at <UnderConstruction />
// instead of <App /> and update the title/description in index.html.
import React from 'react';
import { Mail } from 'lucide-react';
import { AuroraBackground } from './AuroraBackground';
import { Logo } from './Logo';

const CONTACT_EMAIL = 'j.heller@maastrichtuniversity.nl';

/**
 * Standalone holding page shown while the app is offline. Deliberately
 * self-contained: no Supabase, no auth, no data access — so it renders even
 * with the backend removed.
 */
export function UnderConstruction() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden text-white">
      <AuroraBackground />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
        <Logo light />

        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white/80 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
          Under construction
        </div>

        <h1 className="mt-6 max-w-2xl font-heading text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
          AI2AI Chat is under construction
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          The platform is temporarily offline while we rebuild it. It will be
          back — thanks for your patience.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3">
          <p className="text-sm text-white/60">If you have questions, please email:</p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="inline-flex items-center gap-2 rounded-lab-btn border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition-colors duration-200 ease-lab hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <Mail className="h-4 w-4" aria-hidden />
            {CONTACT_EMAIL}
          </a>
        </div>

        <p className="mt-14 text-xs text-white/40">
          A research project by Jonas Heller, Maastricht University
        </p>
      </div>
    </div>
  );
}
