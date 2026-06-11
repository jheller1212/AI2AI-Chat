import React from 'react';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { ResearchAreas } from './ResearchAreas';
import { ResearchFocus } from './ResearchFocus';
import { FAQ } from './FAQ';
import { AcademicCTA } from './AcademicCTA';
import { Footer } from './Footer';

interface LandingPageProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

const HERO_VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260514_135830_bb6491d1-9b66-4aec-9722-13b4dfe3fb46.mp4';

export function LandingPage({ onAuthClick, onSignUpClick, isAuthenticated, onPrivacyClick, onTermsClick }: LandingPageProps) {
  return (
    <div>
      {/* Fixed background video — visible only where content above is transparent */}
      <video
        className="fixed left-0 top-0 z-0 h-screen w-full object-cover"
        src={HERO_VIDEO_SRC}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      {/* Brand-tinted scrim for text legibility over the video */}
      <div
        className="fixed inset-0 z-0 bg-gradient-to-br from-sky-950/60 via-black/30 to-orange-950/40"
        aria-hidden
      />

      <Navigation onAuthClick={onAuthClick} onSignUpClick={onSignUpClick} isAuthenticated={isAuthenticated} />
      <HeroSection onSignUpClick={onSignUpClick} />

      {/* Solid backdrop so the fixed video stays confined to the hero */}
      <div className="relative z-[1] bg-gradient-to-b from-orange-50 via-white to-sky-50">
        <ResearchAreas />
        <ResearchFocus />
        <div id="faq">
          <FAQ />
        </div>
        <AcademicCTA onSignUpClick={onSignUpClick} />
        <Footer onPrivacyClick={onPrivacyClick} onTermsClick={onTermsClick} />
      </div>
    </div>
  );
}
