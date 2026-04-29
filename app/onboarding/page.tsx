'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { ShieldAlert, Users, Building, Package, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';
import Link from 'next/link';

const ROLES = [
  {
    id: 'victim',
    title: 'Victim / Reporter',
    description: 'I need help or want to report an emergency.',
    icon: ShieldAlert,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    activeBorder: 'border-red-500',
  },
  {
    id: 'volunteer',
    title: 'Volunteer',
    description: 'I want to help victims in my local area.',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    activeBorder: 'border-blue-500',
  },
  {
    id: 'supplier',
    title: 'Supplier / Donor',
    description: 'I can provide food, medical, or other supplies.',
    icon: Package,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    activeBorder: 'border-emerald-500',
  },
];

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          role: 'volunteer', // Default for all unified users
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Welcome to SahaySathi!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to initialize profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl">
        <div className="glass-panel p-12 rounded-3xl border border-blue-500/20 text-center mb-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-5 bg-blue-600/20 rounded-2xl mb-6">
              <ShieldAlert className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">You're all set!</h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
              Welcome to the SahaySathi Responder network. You can now report emergencies or provide assistance to those in need—all from one unified dashboard.
            </p>
            
            <button
              onClick={() => handleContinue()}
              className="w-full max-w-xs flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                <>Enter Dashboard <ArrowRight className="w-6 h-6" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
