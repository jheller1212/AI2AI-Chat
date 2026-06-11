import React from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
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
  const prefersReducedMotion = useReducedMotion();

  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white">
        {/* Vivid brand base — always rendered, so the hero stays colourful (not grey)
            even if the video is slow, blocked, or the user prefers reduced motion. */}
        <div
          className="fixed left-0 top-0 z-0 h-[100svh] w-full bg-gradient-to-b from-sky-500 via-sky-700 to-sky-950"
          aria-hidden
        />
        {/* Background video on top of the base (skipped for reduced motion). */}
        {!prefersReducedMotion && (
          <video
            className="fixed left-0 top-0 z-0 h-[100svh] w-full object-cover"
            src={HERO_VIDEO_SRC}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
        )}
        {/* Warm orange brand glow, top-right — an accent that avoids blending the two
            complementary hues across the centre (which is what muddied to grey). */}
        <div
          className="fixed left-0 top-0 z-0 h-[100svh] w-full bg-[radial-gradient(115%_115%_at_88%_8%,rgba(249,115,22,0.38),transparent_55%)]"
          aria-hidden
        />
        {/* Legibility scrim — single-hue navy darkening weighted to the text side
            (left), fading clear so the right of the video stays vivid. */}
        <div
          className="fixed inset-0 z-0 bg-gradient-to-r from-sky-950/75 via-sky-950/25 to-transparent"
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
    </MotionConfig>
  );
}
