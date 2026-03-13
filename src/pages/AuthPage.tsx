import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function reset() {
    setError(null);
    setMessage(null);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    reset();

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Password reset link sent — check your email.');
      }
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage('Check your email for the confirmation link!');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4">
      {/* Hero */}
      <div className="flex flex-col items-center mb-10">
        <img
          src="/strawb3rryIcon.svg"
          alt="Strawb3rry"
          className="w-20 h-20 mb-5 drop-shadow-lg"
        />
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Strawb3rry</h1>
        <p className="text-slate-400 text-center max-w-sm leading-relaxed">
          A personal log for the age of AI — your reflections, projects,
          and secrets in one private place.
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-6">
          {mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="block text-sm font-medium text-slate-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          {mode !== 'forgot' && (
            <div>
              <label htmlFor="auth-password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg pl-9 pr-10 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {mode === 'login' && (
                <div className="text-right mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); reset(); }}
                    className="text-xs text-slate-500 hover:text-indigo-400"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2.5">
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center mt-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <span>
                {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Sign up' : 'Send reset link'}
              </span>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-slate-500 space-y-2">
          {mode === 'forgot' ? (
            <button onClick={() => { setMode('login'); reset(); }} className="text-indigo-400 hover:text-indigo-300 font-medium">
              Back to sign in
            </button>
          ) : (
            <>
              <p>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); reset(); }}
                  className="text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </>
          )}
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-600">© {new Date().getFullYear()} Strawb3rry · cr33pylabs.com</p>
    </div>
  );
}
