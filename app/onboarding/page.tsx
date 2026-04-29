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
    if (!selectedRole) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.info('Please log in first to set your role.');
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          role: selectedRole,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success('Profile setup complete!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">How do you want to use SahaySathi?</h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Select your primary role. This helps us tailor your dashboard and connect you with the right people.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {ROLES.map((role) => {
            const Icon = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative flex items-start gap-4 p-6 rounded-2xl text-left transition-all duration-200 border-2 ${
                  isSelected 
                    ? `${role.activeBorder} bg-slate-800 scale-[1.02] shadow-xl` 
                    : `${role.border} bg-slate-800/50 hover:bg-slate-800 hover:scale-[1.01]`
                }`}
              >
                <div className={`p-4 rounded-xl ${role.bg} ${role.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{role.title}</h3>
                  <p className="text-slate-400">{role.description}</p>
                </div>
                {isSelected && (
                  <div className={`absolute top-6 right-6 ${role.color}`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-6">
          <button
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className={`w-full max-w-md flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              !selectedRole 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
            }`}
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>Complete Setup <ArrowRight className="w-6 h-6" /></>
            )}
          </button>
          <Link href="/dashboard" className="text-slate-500 hover:text-slate-400 transition-colors">
            Skip for now
          </Link>
        </div>
      </div>
    </div>
  );
}
