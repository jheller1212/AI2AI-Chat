import React from 'react';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { ResearchAreas } from './ResearchAreas';
import { ResearchFocus } from './ResearchFocus';
import { AcademicCTA } from './AcademicCTA';

interface LandingPageProps {
  onAuthClick: () => void;
}

export function LandingPage({ onAuthClick }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-emerald-50">
      <Navigation onAuthClick={onAuthClick} />
      <HeroSection onAuthClick={onAuthClick} />
      <ResearchAreas />
      <ResearchFocus />
      <AcademicCTA onAuthClick={onAuthClick} />
    </div>
  );
}