import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Strawb3rry</h1>
          <p className="text-slate-400">Your personal AI workflow companion</p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-6 shadow-2xl border border-slate-700">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#6366f1',
                    brandAccent: '#4f46e5',
                    inputBackground: '#1e293b',
                    inputText: 'white',
                    inputBorder: '#334155',
                    inputBorderFocus: '#6366f1',
                    inputBorderHover: '#475569',
                  },
                },
              },
              className: {
                container: 'auth-container',
                button: 'auth-button',
                input: 'auth-input',
              },
            }}
            providers={['google', 'github']}
            redirectTo={window.location.origin}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Password',
                },
                sign_up: {
                  email_label: 'Email',
                  password_label: 'Password',
                },
              },
            }}
          />
        </div>
        
        <p className="text-center text-slate-500 text-sm mt-6">
          Track your prompts, save project context, learn from mistakes
        </p>
      </div>
    </div>
  );
}
