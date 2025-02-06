import React from 'react';
import { Logo } from './Logo';

interface NavigationProps {
  onAuthClick: () => void;
}

export function Navigation({ onAuthClick }: NavigationProps) {
  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Logo />
          <div className="flex items-center gap-4">
            <button
              onClick={onAuthClick}
              className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Sign in
            </button>
            <button
              onClick={onAuthClick}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-emerald-500 rounded-lg hover:from-indigo-500 hover:to-emerald-400 shadow-md hover:shadow-lg transition-all"
            >
              Access Research Platform
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}