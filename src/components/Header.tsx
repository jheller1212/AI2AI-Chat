import React from 'react';
import type { User } from '@supabase/supabase-js';
import { Settings, Bot, MessageSquare, ArrowLeft, UserCircle, Clock, Moon, Sun, FlaskConical, GraduationCap, BarChart3 } from 'lucide-react';
import { Logo } from './Logo';

interface HeaderProps {
  onBack: () => void;
  onSignOut: () => Promise<void>;
  onToggleSettings: () => void;
  onOpenUserSettings: () => void;
  onOpenHistory: () => void;
  onOpenExperiments: () => void;
  onOpenWorkshops?: () => void;
  onOpenAdmin?: () => void;
  isOrganizer?: boolean;
  showSettings: boolean;
  user: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({ onBack, onSignOut, onToggleSettings, onOpenUserSettings, onOpenHistory, onOpenExperiments, onOpenWorkshops, onOpenAdmin, isOrganizer, showSettings, user, isDarkMode, onToggleDarkMode }: HeaderProps) {
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Account';

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm dark:border-b dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            aria-label="Back to landing page"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Back to landing page"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <Logo />
        </div>
        <div className="flex items-center gap-2">
          {isOrganizer && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              aria-label="Admin dashboard"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 rounded-lg transition-all shadow-sm"
              title="Admin dashboard"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
          )}
          {isOrganizer && onOpenWorkshops && (
            <button
              onClick={onOpenWorkshops}
              aria-label="Workshop manager"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-400 hover:to-sky-500 rounded-lg transition-all shadow-sm"
              title="Workshop manager"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Workshops</span>
            </button>
          )}
          <button
            data-tour="experiments-btn"
            onClick={onOpenExperiments}
            aria-label="Saved experiments"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Saved experiments"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:block">Experiments</span>
          </button>
          <button
            onClick={onOpenHistory}
            aria-label="Conversation history"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Conversation history"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:block">History</span>
          </button>
          <button
            onClick={onToggleSettings}
            aria-label={showSettings ? 'Hide bot config — show chat only' : 'Show bot config panels'}
            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
              showSettings
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
            title={showSettings ? 'Hide bot config — show chat only' : 'Show bot config panels'}
          >
            {showSettings ? (
              <MessageSquare className="w-5 h-5" />
            ) : (
              <div className="flex -space-x-1.5">
                <Bot className="w-4 h-4" />
                <Bot className="w-4 h-4" />
              </div>
            )}
          </button>
          <button
            onClick={onOpenUserSettings}
            aria-label="Settings"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title="Account settings & API keys"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
            <UserCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="hidden sm:block max-w-[120px] truncate">{displayName}</span>
          </div>
          <button
            onClick={onSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
