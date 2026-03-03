import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { ResearchInterface } from './components/ResearchInterface';
import { LandingPage } from './components/LandingPage';

type View = 'landing' | 'auth' | 'app';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>('landing');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup');

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
    // Clear API keys from localStorage before signing out so they are not
    // left behind on shared/public devices.
    try {
      const raw = localStorage.getItem('ai2ai_settings');
      if (raw) {
        const s = JSON.parse(raw);
        localStorage.setItem('ai2ai_settings', JSON.stringify({ ...s, apiKey1: '', apiKey2: '' }));
      }
    } catch { /* ignore */ }
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (view === 'auth') {
    return <Auth onAuthSuccess={() => setView('app')} initialIsSignUp={authMode === 'signup'} />;
  }

  if (view === 'app' && session) {
    return (
      <ResearchInterface
        onSignOut={handleSignOut}
        onBack={() => setView('landing')}
        user={session.user}
      />
    );
  }

  const goToSignIn = () => { setAuthMode('signin'); setView(session ? 'app' : 'auth'); };
  const goToSignUp = () => { setAuthMode('signup'); setView(session ? 'app' : 'auth'); };

  return <LandingPage onAuthClick={goToSignIn} onSignUpClick={goToSignUp} isAuthenticated={!!session} />;
}

export default App;
