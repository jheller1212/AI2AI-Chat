import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface NavigationProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
}

export function Navigation({ onAuthClick, onSignUpClick, isAuthenticated }: NavigationProps) {
  // Transparent over the video hero; frosted white once the page scrolls
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed w-full z-50 transition-colors duration-300 ${
        scrolled
          ? 'bg-white/80 backdrop-blur-sm border-b border-gray-100'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Logo light={!scrolled} />
          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <button
                onClick={onAuthClick}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  scrolled ? 'text-orange-600 hover:text-orange-500' : 'text-white/90 hover:text-white'
                }`}
              >
                Sign in
              </button>
            )}
            <button
              onClick={isAuthenticated ? onAuthClick : onSignUpClick}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-sky-500 rounded-lg hover:from-orange-400 hover:to-sky-400 shadow-md hover:shadow-lg transition-all"
            >
              {isAuthenticated ? 'Open App' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
