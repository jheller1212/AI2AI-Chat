import React from 'react';

interface HeroSectionProps {
  onSignUpClick: () => void;
}

export function HeroSection({ onSignUpClick }: HeroSectionProps) {
  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="px-3 py-1 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-full">Research Platform</span>
            <span className="px-3 py-1 text-sm font-medium text-emerald-600 bg-emerald-100 rounded-full">Academic Use</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Advanced Platform for <span className="bg-gradient-to-r from-indigo-600 to-emerald-500 text-transparent bg-clip-text">AI Interaction Research</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A dedicated academic research platform for studying AI model interactions, cognitive processes, and emergent behaviors in controlled environments.
          </p>
          <button
            onClick={onSignUpClick}
            className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-lg hover:from-indigo-500 hover:to-emerald-400 shadow-lg hover:shadow-xl transition-all"
          >
            Create Free Account
          </button>
        </div>
      </div>
    </div>
  );
}
