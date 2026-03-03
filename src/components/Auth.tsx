import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, Mail, Lock, AlertCircle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthProps {
  onAuthSuccess: () => void;
  initialIsSignUp?: boolean;
}

const TERMS_TEXT = `TERMS OF USE & USER AGREEMENT
Last updated: March 2026

By creating an account and using AI2AI Chat ("the Service"), you agree to the following terms. If you do not agree, do not use the Service.

1. ACCEPTANCE OF TERMS
By registering, you confirm that you are at least 16 years of age and legally capable of entering into this agreement. If you are accessing the Service on behalf of an organisation, you represent that you have authority to bind that organisation to these terms.

2. SERVICE PROVIDED "AS IS"
The Service is provided on an "as is" and "as available" basis without warranties of any kind, express or implied. The operator makes no representations regarding the accuracy, reliability, completeness, or fitness for a particular purpose of any content generated through the Service. Use of the Service is entirely at your own risk.

3. LIMITATION OF LIABILITY
To the fullest extent permitted by applicable law, the operator shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Service — including but not limited to damages resulting from AI-generated content, data loss, or reliance on information obtained through the Service.

4. THIRD-PARTY AI SERVICES & API KEYS
You are solely responsible for obtaining and managing your own API keys from third-party AI providers (including but not limited to OpenAI, Anthropic, Google, and Mistral). You agree to comply with the terms of service of any third-party AI provider whose services you access through this platform. The operator assumes no responsibility for charges, restrictions, or actions taken by third-party providers in relation to your API usage.

5. ACCEPTABLE USE
You agree not to use the Service to:
- Generate, distribute, or facilitate illegal, abusive, defamatory, or harmful content
- Produce, promote, or distribute child sexual abuse material (CSAM) or content exploiting minors
- Harass, threaten, or impersonate any individual or organisation
- Circumvent the safety systems, rate limits, or terms of service of any AI provider
- Conduct automated bulk usage that violates provider policies
- Engage in activities regulated by export control laws (ITAR/EAR) without authorisation
- Violate any applicable local, national, or international law

6. ACCOUNT SUSPENSION & TERMINATION
The operator may suspend or terminate your access at any time for any reason, including breach of these Terms, without liability. You may delete your account at any time from Settings. All associated data is permanently removed within 30 days of deletion.

7. EMAIL COMMUNICATIONS
By creating an account, you agree to receive service-related emails including account confirmations, important notices, and occasional product updates. You may opt out of non-essential communications at any time.

8. DATA & PRIVACY
Conversation data you choose to save may be stored to provide the Service. You retain ownership of your content. The operator will not sell your personal data to third parties. Data is stored via Supabase (US servers). For full details, see the Privacy Policy at ai2aichat.netlify.app. Data retention: account data is kept until you delete your account, after which it is removed within 30 days.

9. GOVERNING LAW
These Terms are governed by the laws of the European Union and, where applicable, the laws of the country in which the operator is established. Disputes shall be subject to the exclusive jurisdiction of the competent courts of that jurisdiction. EU consumers retain the benefit of mandatory consumer protection laws in their country of residence.

10. CHANGES TO TERMS
These Terms may be updated from time to time. We will notify you by email or in-app notice for material changes. Continued use of the Service after the effective date constitutes acceptance of the revised terms.`;

export function Auth({ onAuthSuccess, initialIsSignUp = false }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setError(null);
    setConfirmPassword('');
    setAgreedToTerms(false);
    setShowTerms(false);
    setForgotSent(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setError('Enter your email address above, then click Forgot password.'); return; }
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!agreedToTerms) {
        setError('You must agree to the Terms of Use to create an account.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin }
        });
        if (error) throw error;
        if (data.session) {
          onAuthSuccess();
        } else {
          setAwaitingConfirmation(true);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err) {
      if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) {
        setError('Unable to reach the authentication server. Please check your internet connection and try again.');
      } else if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes('Invalid login credentials')) {
          setError('Incorrect email or password.');
        } else if (msg.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else if (msg.includes('User already registered')) {
          setError('An account with this email already exists. Try signing in instead.');
        } else if (msg.includes('Password should be')) {
          setError('Password must be at least 6 characters.');
        } else {
          setError(msg);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
          <CheckCircle className="mx-auto h-14 w-14 text-emerald-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
            <p className="mt-2 text-gray-600">
              We sent a confirmation link to <span className="font-medium">{email}</span>.
              Click the link to activate your account, then come back and sign in.
            </p>
          </div>
          <button
            onClick={() => { setAwaitingConfirmation(false); switchMode(false); }}
            className="w-full py-2 px-4 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            {isSignUp ? 'Create your account' : 'Sign in to AI2AI Chat'}
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Email */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-lg block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="appearance-none rounded-lg block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Password (min 6 characters)"
            />
          </div>

          {/* Confirm password — sign-up only */}
          {isSignUp && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none rounded-lg block w-full pl-10 px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Confirm password"
              />
            </div>
          )}

          {/* Terms & Conditions — sign-up only */}
          {isSignUp && (
            <div className="space-y-2">
              {/* Expandable terms box */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span>View Terms of Use &amp; User Agreement</span>
                  {showTerms ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showTerms && (
                  <pre className="px-4 py-3 text-xs text-gray-600 bg-white max-h-48 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed">
                    {TERMS_TEXT}
                  </pre>
                )}
              </div>

              {/* Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-600">
                  I have read and agree to the Terms of Use, including that the service is provided without warranty, and I consent to receiving service-related emails.
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing…' : isSignUp ? 'Create Account' : 'Sign in'}
          </button>
        </form>

        {!isSignUp && (
          <div className="text-center space-y-1">
            {forgotSent ? (
              <p className="text-sm text-emerald-600">Reset link sent — check your inbox.</p>
            ) : (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-indigo-600 disabled:opacity-50"
              >
                Forgot password?
              </button>
            )}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={() => switchMode(!isSignUp)}
            className="text-sm text-indigo-600 hover:text-indigo-500"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
