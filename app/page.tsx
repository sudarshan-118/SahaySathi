'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, Users, Clock, MapPin, Activity, Heart, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setIsLoggedIn(true);
    });
  }, []);

  const primaryLink = isLoggedIn ? "/dashboard" : "/login";

  if (!mounted) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <Activity className="w-12 h-12 text-blue-500 animate-pulse" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col font-sans overflow-x-hidden">
      {/* Navbar */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="sticky top-0 z-50 glass-panel border-b border-slate-700/50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-tight text-white">Sahay<span className="text-blue-500">Sathi</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href={primaryLink} className="hover:text-white transition-colors">{isLoggedIn ? 'Dashboard' : 'Login'}</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href={primaryLink} className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              {isLoggedIn ? 'Go to Dashboard' : 'Get Started'}
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 mb-8 text-sm font-medium"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Live Emergency Coordination
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6"
            >
              Right Help. <br className="md:hidden" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Right Place.</span> <br className="md:hidden" />
              Right Time.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
              className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Hyperlocal Disaster Volunteer Coordination Platform. Connecting victims with nearby volunteers and essential resources in real-time.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <Link href={primaryLink} className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2">
                <Shield className="w-5 h-5" />
                Request Help
              </Link>
              <Link href={primaryLink} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Volunteer Now
              </Link>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8"
            >
              <Link href="/ngo-login" className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4">
                NGO / Admin Login
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-y border-slate-800 bg-slate-900/50 backdrop-blur-sm relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { label: 'Active Volunteers', value: '2,400+' },
                { label: 'People Rescued', value: '15,000+' },
                { label: 'Avg Response Time', value: '< 8 mins' },
                { label: 'Shelters Active', value: '142' },
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="space-y-2"
                >
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powered by AI & Real-time Tech</h2>
              <p className="text-slate-400 max-w-2xl mx-auto">Our platform uses advanced technologies to ensure resources are routed efficiently during crises.</p>
            </motion.div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: <Clock className="w-6 h-6 text-emerald-400" />, title: 'Real-time Coordination', desc: 'Live map updates and instant WebSocket notifications keep everyone synced.' },
                { icon: <Activity className="w-6 h-6 text-blue-400" />, title: 'AI Urgency Analysis', desc: 'Groq AI automatically categorizes and prioritizes requests based on severity.' },
                { icon: <MapPin className="w-6 h-6 text-red-400" />, title: 'Hyperlocal Matching', desc: 'Connects victims with the closest available volunteers automatically.' },
                { icon: <Shield className="w-6 h-6 text-purple-400" />, title: 'Verified NGOs', desc: 'Trusted administrative layer for resource allocation and broad coordination.' },
                { icon: <Heart className="w-6 h-6 text-pink-400" />, title: 'Resource Tracking', desc: 'Live inventory of food, medical supplies, and shelter availability.' },
                { icon: <Users className="w-6 h-6 text-yellow-400" />, title: 'Offline Mode Support', desc: 'Save requests locally when network drops and auto-sync when back online.' },
              ].map((f, i) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -5 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.3 }}
                  key={i} 
                  className="glass-panel p-8 rounded-2xl transition-all group cursor-default shadow-lg hover:shadow-blue-500/10"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center mb-6 border border-slate-700 group-hover:scale-110 transition-transform shadow-inner">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-900/20"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-4 relative z-10 text-center glass-panel p-12 rounded-3xl border-t border-white/10 shadow-2xl"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">Ready to make a difference?</h2>
            <p className="text-xl text-slate-300 mb-10">Join thousands of volunteers already helping their communities.</p>
            <Link href={primaryLink} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all hover:scale-105 shadow-xl">
              {isLoggedIn ? 'Go to Dashboard' : 'Join the Platform'} <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-slate-800 py-12 bg-slate-950 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 font-medium">
          <p>© {new Date().getFullYear()} SahaySathi. Built for emergency response.</p>
        </div>
      </footer>
    </div>
  );
}
