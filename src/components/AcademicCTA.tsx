import React from 'react';

interface AcademicCTAProps {
  onAuthClick: () => void;
}

export function AcademicCTA({ onAuthClick }: AcademicCTAProps) {
  return (
    <div className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Join the Research Community</h2>
        <p className="text-lg text-gray-600 mb-8">Contribute to the advancement of AI interaction research in academia.</p>
        <button
          onClick={onAuthClick}
          className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-lg hover:from-indigo-500 hover:to-emerald-400 shadow-lg hover:shadow-xl transition-all"
        >
          Begin Research Study
        </button>
      </div>
    </div>
  );
}