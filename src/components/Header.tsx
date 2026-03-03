import React from 'react';
import type { User } from '@supabase/supabase-js';
import { Settings, ArrowLeft, UserCircle, Clock } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onBack: () => void;
  onSignOut: () => Promise<void>;
  onToggleSettings: () => void;
  onOpenUserSettings: () => void;
  onOpenHistory: () => void;
  user: User;
}

export function Header({ onBack, onSignOut, onToggleSettings, onOpenUserSettings, onOpenHistory, user }: HeaderProps) {
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Account';

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
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Conversation history"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:block">History</span>
          </button>
          <button
            onClick={onToggleSettings}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
            title="Toggle AI settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onOpenUserSettings}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Account settings"
          >
            <UserCircle className="w-5 h-5 text-indigo-600" />
            <span className="hidden sm:block max-w-[120px] truncate">{displayName}</span>
          </button>
          <button
            onClick={onSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
