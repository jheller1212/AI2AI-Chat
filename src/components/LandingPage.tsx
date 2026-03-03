import React from 'react';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { ResearchAreas } from './ResearchAreas';
import { ResearchFocus } from './ResearchFocus';
import { AcademicCTA } from './AcademicCTA';

interface LandingPageProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
}

export function LandingPage({ onAuthClick, onSignUpClick, isAuthenticated }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-emerald-50">
      <Navigation onAuthClick={onAuthClick} onSignUpClick={onSignUpClick} isAuthenticated={isAuthenticated} />
      <HeroSection onSignUpClick={onSignUpClick} />
      <ResearchAreas />
      <ResearchFocus />
      <AcademicCTA onSignUpClick={onSignUpClick} />
    </div>
  );
}
