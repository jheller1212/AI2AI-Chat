import React from 'react';
import { Settings, ArrowLeft } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onBack: () => void;
  onSignOut: () => Promise<void>;
  onToggleSettings: () => void;
}

export function Header({ onBack, onSignOut, onToggleSettings }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSettings}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}