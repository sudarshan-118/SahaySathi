'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { LayoutDashboard, Map, UserCircle, LogOut, ShieldAlert, Activity, Menu, X, Building, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [role, setRole] = useState<string>('victim');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single();

      if (profile?.role) setRole(profile.role);
      else router.push('/onboarding');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Live Map', href: '/map', icon: Map },
    { name: 'Profile', href: '/profile', icon: UserCircle },
  ];

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-8 h-8 text-blue-500" />
        <span className="text-xl font-bold text-white">Sahay<span className="text-blue-500">Sathi</span></span>
      </div>
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-slate-400 text-sm font-medium animate-pulse">Securing your session...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 flex font-sans">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-950 border-r border-slate-800 shrink-0">
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">Sahay<span className="text-blue-500">Sathi</span></span>
          </Link>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-slate-800/80 rounded-xl border border-slate-700/50">
            {role === 'ngo' ? (
              <><Building className="w-4 h-4 text-purple-400" /><span className="text-xs font-semibold text-slate-300">NGO Portal</span></>
            ) : (
              <><ShieldAlert className="w-4 h-4 text-emerald-400" /><span className="text-xs font-semibold text-slate-300 capitalize">Responder Account</span></>
            )}
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl font-medium transition-all"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-bold text-white">Sahay<span className="text-blue-500">Sathi</span></span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 top-14 bg-slate-950/98 backdrop-blur-lg z-40 flex flex-col"
          >
            <nav className="p-4 space-y-2 flex-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-semibold transition-all ${
                      isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center gap-4 px-5 py-4 w-full text-red-400 font-semibold hover:bg-red-500/10 rounded-2xl transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto pt-14 md:pt-0 pb-16 md:pb-0 custom-scrollbar">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-40 flex justify-around items-center px-2 pb-safe" style={{ height: '60px' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all ${
                isActive ? 'text-blue-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[9px] font-bold uppercase tracking-widest">{item.name}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-blue-400" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
