'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Building, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';

export default function NgoLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // VERIFY ROLE: Check if this user is actually an NGO
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError || profile?.role !== 'ngo') {
          // Access Denied: Not an NGO account
          await supabase.auth.signOut();
          toast.error('Unauthorized: This account does not have NGO administrative privileges.');
          setLoading(false);
          return;
        }

        toast.success('NGO Authorized Successfully');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error(error.message);
    } else if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, role: 'ngo', updated_at: new Date().toISOString() });
      toast.success('NGO Account Created. Please verify email if required, or login.');
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
      {/* Left side - Branding specifically for NGO */}
      <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-slate-900 relative overflow-hidden border-r border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-900 to-slate-900 z-0"></div>
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <Building className="w-8 h-8 text-purple-500" />
            <span className="text-xl font-bold tracking-tight text-white">Sahay<span className="text-purple-500">Sathi</span> <span className="text-sm font-normal text-slate-400">for Organizations</span></span>
          </Link>
          
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Coordinate. <br/>
            Deploy. <br/>
            <span className="text-purple-400">Save Lives.</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            The dedicated administrative portal for verified NGOs and Emergency Response Teams.
          </p>
        </div>
        
        <div className="relative z-10 mt-auto">
          <div className="glass-panel p-6 rounded-2xl flex items-start gap-4 border-purple-500/20">
            <div className="bg-purple-500/20 p-3 rounded-lg text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold mb-1">Official Partners Only</h4>
              <p className="text-slate-400 text-sm">Access broad coordination tools, AI fraud detection, and multi-volunteer dispatch systems.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="absolute top-6 left-6 md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Building className="w-6 h-6 text-purple-500" />
            <span className="text-lg font-bold tracking-tight text-white">SahaySathi NGO</span>
          </Link>
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">NGO / Admin Portal</h2>
            <p className="text-slate-400">Sign in to manage broad relief efforts.</p>
          </div>

          <form className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Organization Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="admin@ngo.org"
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
                  className="block w-full pl-10 pr-3 py-3 border border-slate-700 rounded-xl bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button 
                onClick={handleEmailLogin}
                type="button"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Sign In</>
                )}
              </button>
              
              <button 
                onClick={handleSignup}
                type="button"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-3 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed border border-slate-700"
              >
                Register NGO
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-slate-400 mt-8">
            Are you a volunteer or victim? <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">Go to Standard Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
