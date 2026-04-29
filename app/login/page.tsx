'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ShieldAlert, Activity, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Login successful!');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Clear any existing session to prevent "Failed to fetch" on stale session
      // This often fixes the slow login/re-login issues
      await supabase.auth.signOut().catch(() => {});

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        toast.error(`Login Error: ${error.message}`);
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(`Network Error: ${err.message || 'Please check your connection'}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col md:flex-row font-sans">
      {/* Left side - Branding */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-slate-900 relative overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-900 to-slate-900 z-0"></div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <Activity className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">Sahay<span className="text-blue-500">Sathi</span></span>
          </Link>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Connect. <br/>
            Coordinate. <br/>
            <span className="text-blue-400">Save Lives.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Join the centralized emergency response network connecting victims with nearby volunteers.
          </p>
        </div>
        
        <div className="relative z-10 mt-auto">
          <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
            <div className="bg-blue-500/20 p-3 rounded-lg text-blue-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Secure & Encrypted</h4>
              <p className="text-slate-400 text-sm">Your data and location are securely encrypted and only shared with verified responders.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-500" />
            <span className="text-lg font-bold tracking-tight text-white">SahaySathi</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-slate-400">Sign in to coordinate emergency responses.</p>
          </div>

          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 px-4 py-3 rounded-xl font-semibold hover:bg-slate-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 py-4">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">or email</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Are you an NGO or Admin? <Link href="/ngo-login" className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">Go to NGO Portal</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
