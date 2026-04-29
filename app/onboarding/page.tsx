'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Users, Building, Package, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

const ROLES = [
  {
    id: 'victim',
    title: 'Victim / Reporter',
    description: 'I need help or want to report an emergency.',
    icon: ShieldAlert,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    activeBg: 'bg-red-500/20',
    activeBorder: 'border-red-500',
    glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]',
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    description: 'I want to help victims in my local area.',
    icon: Users,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    activeBg: 'bg-blue-500/20',
    activeBorder: 'border-blue-500',
    glow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)]',
  },
  {
    id: 'supplier',
    title: 'Supplier / Donor',
    description: 'I can provide food, medical, or other supplies.',
    icon: Package,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    activeBg: 'bg-emerald-500/20',
    activeBorder: 'border-emerald-500',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string>('volunteer');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select a role to continue');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        role: selectedRole,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success(`Welcome to SahaySathi as ${selectedRole}!`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            Almost There
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">How will you help?</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            Select your role to personalize your experience. You can update this anytime.
          </p>
        </div>

        <div className="grid gap-4 mb-8">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-200 ${
                  isSelected
                    ? `${role.activeBg} ${role.activeBorder} ${role.glow}`
                    : `bg-slate-800/50 ${role.border} hover:bg-slate-800`
                }`}
              >
                <div className={`p-3 ${isSelected ? role.bg : 'bg-slate-700/50'} rounded-xl transition-all`}>
                  <Icon className={`w-6 h-6 ${role.color}`} />
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-base">{role.title}</div>
                  <div className="text-slate-400 text-sm mt-0.5">{role.description}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? `${role.activeBorder} bg-white/10` : 'border-slate-600'
                }`}>
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${role.color.replace('text-', 'bg-')}`} />}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (<>Enter Dashboard <ArrowRight className="w-6 h-6" /></>)}
        </button>

        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/" className="hover:text-slate-300 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
