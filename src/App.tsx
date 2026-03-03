import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { ResearchInterface } from './components/ResearchInterface';
import { LandingPage } from './components/LandingPage';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfUse } from './components/TermsOfUse';
import { StorageNotice } from './components/StorageNotice';
import { clearVault } from './lib/apiKeyVault';

type View = 'landing' | 'auth' | 'app' | 'privacy' | 'terms';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('ai2ai_theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('ai2ai_theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView('app');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setView('landing');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    // Clear all API keys from localStorage before signing out so they are not
    // left behind on shared/public devices.
    try {
      const raw = localStorage.getItem('ai2ai_settings');
      if (raw) {
        const s = JSON.parse(raw);
        localStorage.setItem('ai2ai_settings', JSON.stringify({ ...s, apiKey1: '', apiKey2: '' }));
      }
    } catch { /* ignore */ }
    clearVault();
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-gray-950">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const storageNotice = <StorageNotice onPrivacyClick={() => setView('privacy')} />;

  if (view === 'auth') {
    return <>{storageNotice}<Auth onAuthSuccess={() => setView('app')} initialIsSignUp={authMode === 'signup'} /></>;
  }

  if (view === 'app' && session) {
    return (
      <>
        {storageNotice}
        <ResearchInterface
          onSignOut={handleSignOut}
          onBack={() => setView('landing')}
          user={session.user}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(v => !v)}
        />
      </>
    );
  }

  if (view === 'privacy') {
    return <>{storageNotice}<PrivacyPolicy onBack={() => setView('landing')} /></>;
  }

  if (view === 'terms') {
    return <>{storageNotice}<TermsOfUse onBack={() => setView('landing')} /></>;
  }

  const goToSignIn = () => { setAuthMode('signin'); setView(session ? 'app' : 'auth'); };
  const goToSignUp = () => { setAuthMode('signup'); setView(session ? 'app' : 'auth'); };

  return (
    <>
      {storageNotice}
      <LandingPage
        onAuthClick={goToSignIn}
        onSignUpClick={goToSignUp}
        isAuthenticated={!!session}
        onPrivacyClick={() => setView('privacy')}
        onTermsClick={() => setView('terms')}
      />
    </>
  );
}

export default App;
