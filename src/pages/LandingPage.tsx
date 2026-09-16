import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, ChevronRight, BarChart3, Map, Zap, MessageSquare } from 'lucide-react';
import { MOCK_INCIDENTS, MOCK_STATS, BUILDING_HEAT_DATA } from '../data/mockIncidents';

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroOpacity = Math.max(0, 1 - scrollY / 800);

  return (
    <div className="min-h-screen bg-cp-bg text-cp-text selection:bg-cp-lime selection:text-cp-dark">
      {/* NAVBAR */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 glass-dark rounded-full px-2 py-2 flex items-center gap-2 border border-white/10 shadow-2xl transition-all duration-300">
        <div className="flex items-center gap-6 px-6 text-sm font-medium text-white/70">
          <a href="#" className="hover:text-white transition-colors">Home</a>
          <a href="#intelligence" className="hover:text-white transition-colors">Intelligence</a>
          <a href="#dashboard" className="hover:text-white transition-colors">Dashboard</a>
          <a href="#heatmap" className="hover:text-white transition-colors">Heatmap</a>
        </div>
        <button className="bg-white text-black px-6 py-2.5 rounded-full text-sm font-semibold hover:scale-105 active:scale-95 transition-all">
          Launch Demo
        </button>
      </nav>

      {/* HERO SECTION */}
      <section className="relative w-full h-[100vh] overflow-hidden bg-[#4a4d44]">
        {/* 3D iframe background */}
        <iframe src="/hero-3d.html" className="absolute inset-0 w-full h-full border-none pointer-events-auto" style={{ opacity: heroOpacity }} />
        
        {/* Hero Content Overlay */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-center pointer-events-none p-6" style={{ opacity: heroOpacity }}>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[4.5rem] md:text-[6rem] font-light text-white leading-tight tracking-tight max-w-5xl"
            style={{ fontFamily: 'Lexend' }}
          >
            See it. Report it. <span className="text-[#C8E64D]">Resolve it.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-lg md:text-xl text-white/70 max-w-2xl font-light"
          >
            CampusPulse transforms everyday campus problems into AI-powered operational intelligence—connecting students, maintenance teams, and administrators through one intelligent workflow.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.4 }}
            className="mt-10 flex gap-4 pointer-events-auto"
          >
            <button className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-[#C8E64D] transition-colors brutal-shadow">
              Report an Issue
            </button>
            <button className="glass px-8 py-4 rounded-full text-lg font-medium text-white hover:bg-white/20 transition-colors">
              Watch Live Demo
            </button>
          </motion.div>
        </div>

        {/* Floating Glass Cards */}
        <motion.div 
          className="absolute bottom-20 left-10 glass-dark p-5 rounded-2xl border border-white/10 w-64 pointer-events-auto shadow-2xl"
          animate={{ y: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-[#C8E64D]" />
            <h3 className="text-white font-medium">AI Triage</h3>
          </div>
          <p className="text-white/60 text-sm">98% structured classification</p>
        </motion.div>

        <motion.div 
          className="absolute top-32 right-12 glass-dark p-5 rounded-2xl border border-white/10 w-64 pointer-events-auto shadow-2xl"
          animate={{ y: [0, 15, 0] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-white font-medium">Live Operations</h3>
          </div>
          <p className="text-white/60 text-sm">27 active incidents</p>
        </motion.div>
      </section>

      {/* SECTION 2: THE PROBLEM (Neo-Brutalism) */}
      <section className="section-padding bg-cp-bg relative z-20 -mt-4 rounded-t-[3rem] border-t border-black/5" id="intelligence">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-bold tracking-widest text-cp-moss uppercase mb-6">The Problem</p>
          <h2 className="text-[3.5rem] md:text-[5rem] font-bold text-cp-dark leading-[1.1] tracking-tight mb-8 max-w-4xl uppercase" style={{ fontFamily: 'Lexend' }}>
            Intelligence is built,<br />not reported.
          </h2>
          <p className="text-xl text-cp-text-secondary max-w-3xl leading-relaxed mb-16">
            Most campus issue trackers collect complaints. CampusPulse builds an operational intelligence layer that understands, prioritizes, and resolves infrastructure problems before they become recurring failures.
          </p>

          <div className="bg-[#DCE8D4] border-4 border-black rounded-[2rem] p-10 md:p-16 brutal-shadow relative overflow-hidden">
            <div className="absolute top-8 right-8 bg-black text-white px-4 py-1.5 rounded-full text-xs font-bold tracking-wider">
              CORE PRINCIPLE
            </div>
            <span className="text-6xl font-bold font-mono-id block mb-6 opacity-30">01</span>
            <h3 className="text-4xl md:text-5xl font-bold uppercase mb-6" style={{ fontFamily: 'Lexend' }}>Build over report.</h3>
            <p className="text-xl md:text-2xl max-w-2xl font-medium leading-snug">
              Students shouldn't fill endless forms. A single photo, a short description, and AI should generate structured operational data automatically.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4: LIVE OPERATIONS DASHBOARD */}
      <section className="section-padding bg-white border-y border-cp-border" id="dashboard">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Lexend' }}>The Campus is Speaking.</h2>
          <p className="text-xl text-cp-text-secondary mb-12">Every report contributes to a live operational map of campus infrastructure.</p>
          
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Open Incidents', val: MOCK_STATS.openIncidents, color: 'text-red-500' },
              { label: 'High Priority', val: MOCK_STATS.highPriority, color: 'text-orange-500' },
              { label: 'Avg Resolution', val: MOCK_STATS.avgResolutionTime, color: 'text-cp-accent' },
              { label: 'Fixed Today', val: MOCK_STATS.fixedToday, color: 'text-green-500' }
            ].map((stat, i) => (
              <div key={i} className="border-2 border-cp-border rounded-2xl p-6 hover:border-black transition-colors bg-cp-bg">
                <div className={`text-5xl font-bold mb-2 ${stat.color}`} style={{ fontFamily: 'Lexend' }}>{stat.val}</div>
                <div className="text-sm font-semibold text-cp-text-secondary uppercase tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Dashboard UI */}
          <div className="flex flex-col lg:flex-row gap-8 bg-cp-bg border-4 border-black rounded-[2rem] p-4 brutal-shadow h-[600px] overflow-hidden">
            {/* Feed */}
            <div className="w-full lg:w-[35%] bg-white border-2 border-black rounded-xl overflow-y-auto p-4 flex flex-col gap-4">
              <h3 className="font-bold text-lg sticky top-0 bg-white z-10 pb-2 border-b-2 border-black mb-2">Live Feed</h3>
              {MOCK_INCIDENTS.slice(0, 5).map(inc => (
                <div key={inc.id} className="border-2 border-black rounded-lg p-4 hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] transition-all cursor-pointer bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-xs font-bold bg-black text-white px-2 py-0.5 rounded">{inc.id}</span>
                    <span className="text-xs font-bold uppercase">{inc.status}</span>
                  </div>
                  <h4 className="font-bold mb-1">{inc.title}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{inc.description}</p>
                  <div className="flex gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${inc.severity === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {inc.severity}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-full uppercase bg-gray-100 text-gray-700">{inc.location}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Analytics / Heatmap Area */}
            <div className="w-full lg:w-[65%] bg-white border-2 border-black rounded-xl p-6 flex flex-col relative overflow-hidden group">
               <div className="absolute top-6 right-6 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                 HOTSPOT DETECTED
               </div>
               <h3 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Lexend' }}>Block B Infrastructure</h3>
               <p className="text-gray-600 mb-6">Multiple linked reports indicate systemic failure.</p>
               
               <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center p-8">
                 <div className="flex justify-between items-end h-40 gap-4">
                   {[
                     { label: 'Plumbing', val: 7, color: 'bg-blue-500' },
                     { label: 'Electrical', val: 2, color: 'bg-yellow-500' },
                     { label: 'WiFi', val: 2, color: 'bg-green-500' }
                   ].map((bar, i) => (
                     <div key={i} className="flex-1 flex flex-col items-center gap-2">
                       <motion.div 
                         initial={{ height: 0 }} whileInView={{ height: `${(bar.val / 7) * 100}%` }}
                         className={`w-full max-w-[80px] rounded-t-lg ${bar.color}`}
                       />
                       <span className="text-sm font-medium">{bar.label}</span>
                     </div>
                   ))}
                 </div>
                 <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
                   <p className="text-red-800 text-sm font-semibold">🚨 AI Insights: Seven plumbing-related incidents have occurred in this block. Preventive inspection recommended immediately.</p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-32 bg-[#DCE8D4] border-t-4 border-black text-center relative overflow-hidden">
        <h2 className="text-5xl md:text-7xl font-bold mb-6 max-w-4xl mx-auto uppercase" style={{ fontFamily: 'Lexend' }}>Build campuses that fix themselves faster.</h2>
        <p className="text-xl mb-12 max-w-2xl mx-auto text-black/70">
          CampusPulse transforms thousands of student observations into actionable operational intelligence.
        </p>
        <button className="bg-black text-white px-10 py-5 rounded-full text-xl font-bold hover:scale-105 transition-transform shadow-2xl">
          Start Your Deployment
        </button>
      </section>

      {/* Floating Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform brutal-shadow border-2 border-white">
          <MessageSquare className="w-7 h-7" />
        </button>
      </div>

    </div>
  );
}
