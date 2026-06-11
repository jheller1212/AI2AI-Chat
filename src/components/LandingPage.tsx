import React from 'react';
import { MotionConfig } from 'framer-motion';
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

export function LandingPage({ onAuthClick, onSignUpClick, isAuthenticated, onPrivacyClick, onTermsClick }: LandingPageProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-white">
        <Navigation onAuthClick={onAuthClick} onSignUpClick={onSignUpClick} isAuthenticated={isAuthenticated} />

        {/* Self-contained animated hero (aurora background + live conversation) */}
        <HeroSection onSignUpClick={onSignUpClick} />

        <div className="relative bg-white">
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
