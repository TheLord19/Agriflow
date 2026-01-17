import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, Play, Database, ShieldCheck, 
  Server, AlertTriangle, Lock, Globe, TrendingUp, Search
} from 'lucide-react';

const slides = [
  // SLIDE 1: TITLE
  {
    id: 1,
    layout: 'center',
    title: "AgriFlow Supply Chain",
    subtitle: "Ensuring Data Integrity from Farm to Fork",
    content: (
      <div className="text-center space-y-6 max-w-2xl mx-auto">
        <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
          <p className="text-lg text-blue-200">
            A Next-Gen Tracking System powered by Blockchain & Shadow Ledger Technology.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm text-slate-400">
          <div className="flex flex-col items-center gap-2">
            <Globe className="text-blue-500" />
            <span>Global Traceability</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Lock className="text-emerald-500" />
            <span>Tamper-Proof</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <TrendingUp className="text-purple-500" />
            <span>Real-time Audit</span>
          </div>
        </div>
      </div>
    )
  },

  // SLIDE 2: THE PROBLEM
  {
    id: 2,
    layout: 'split',
    title: "The Silent Problem",
    subtitle: "Why do supply chains fail?",
    content: (
      <div className="space-y-6">
        <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-xl">
          <h3 className="text-red-400 font-bold flex items-center gap-2 mb-2">
            <AlertTriangle size={20} /> The "Black Box" Issue
          </h3>
          <p className="text-slate-300 text-sm">
            In traditional systems, data is stored in a central database. 
            Admins, hackers, or corrupt officers can change numbers (e.g., changing 50kg to 500kg) 
            <strong>without leaving a trace.</strong>
          </p>
        </div>
        <ul className="space-y-3 text-slate-400 text-sm">
          <li className="flex gap-2">❌ <strong>Ghost Stock:</strong> Warehouses claiming inventory that doesn't exist.</li>
          <li className="flex gap-2">❌ <strong>Adulteration:</strong> Low-quality crops mixed with high-quality batches.</li>
          <li className="flex gap-2">❌ <strong>Financial Fraud:</strong> Loans taken against fake supply records.</li>
        </ul>
      </div>
    )
  },

  // SLIDE 3: THE SOLUTION (CONCEPT)
  {
    id: 3,
    layout: 'split',
    title: "The AgriFlow Solution",
    subtitle: "Trust, but Verify.",
    content: (
      <div className="space-y-6">
        <p className="text-slate-300">
          We don't just "store" data. We <strong>chain</strong> it. 
          Every time a sack of crops moves, we create a digital fingerprint (Hash) of that event.
        </p>
        
        <div className="grid grid-cols-1 gap-3">
          <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-bold text-white">1. Live Recording</h4>
            <p className="text-xs text-slate-400">Data enters the system via Mobile/Web.</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-purple-500">
            <h4 className="font-bold text-white">2. Shadow Copy</h4>
            <p className="text-xs text-slate-400">An invisible, read-only copy is locked instantly.</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg border-l-4 border-emerald-500">
            <h4 className="font-bold text-white">3. Blockchain Seal</h4>
            <p className="text-xs text-slate-400">A cryptographic block is mined. Changing the past becomes impossible.</p>
          </div>
        </div>
      </div>
    )
  },

  // SLIDE 4: TECHNICAL ARCHITECTURE (SIMPLIFIED)
  {
    id: 4,
    layout: 'full',
    title: "Under The Hood",
    subtitle: "The 3-Layer Defense Mechanism",
    content: (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Layer 1 */}
        <div className="bg-blue-900/10 border border-blue-500/30 p-6 rounded-xl flex flex-col items-center text-center">
          <div className="bg-blue-500/20 p-3 rounded-full mb-4">
            <Database size={32} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-bold text-blue-200">1. UI Database</h3>
          <p className="text-xs text-blue-300 mt-2 uppercase tracking-wide">The "Cash Register"</p>
          <p className="text-sm text-slate-400 mt-4">
            Where users enter data. It is <strong>Mutable</strong> (Editable). This is where fraud usually happens.
          </p>
        </div>

        {/* Layer 2 */}
        <div className="bg-purple-900/10 border border-purple-500/30 p-6 rounded-xl flex flex-col items-center text-center relative overflow-hidden">
          <div className="bg-purple-500/20 p-3 rounded-full mb-4 z-10">
            <Server size={32} className="text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-purple-200 z-10">2. Shadow DB</h3>
          <p className="text-xs text-purple-300 mt-2 uppercase tracking-wide z-10">The "Carbon Copy"</p>
          <p className="text-sm text-slate-400 mt-4 z-10">
            A hidden, <strong>Append-Only</strong> log. Even if the Admin changes the UI DB, this copy remains untouched.
          </p>
        </div>

        {/* Layer 3 */}
        <div className="bg-emerald-900/10 border border-emerald-500/30 p-6 rounded-xl flex flex-col items-center text-center">
          <div className="bg-emerald-500/20 p-3 rounded-full mb-4">
            <ShieldCheck size={32} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-emerald-200">3. Ledger Core</h3>
          <p className="text-xs text-emerald-300 mt-2 uppercase tracking-wide">The "Judge"</p>
          <p className="text-sm text-slate-400 mt-4">
            It compares Layer 1 & Layer 2. If the mathematics (Hashes) don't match, it triggers a <strong>System Alarm</strong>.
          </p>
        </div>
      </div>
    )
  },

  // SLIDE 5: DEMO INSTRUCTIONS
  {
    id: 5,
    layout: 'center',
    title: "Live Simulation",
    subtitle: "What you are about to see",
    content: (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
               <Play size={16} /> Normal Flow
             </h4>
             <p className="text-xs text-slate-400">
               Data arrives every 2hrs but the simulation does it in 10  seconds. The system verifies it and turns <span className="text-emerald-400 font-bold">GREEN</span>.
             </p>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <h4 className="text-red-400 font-bold mb-2 flex items-center gap-2">
               <AlertTriangle size={16} /> The Attack
             </h4>
             <p className="text-xs text-slate-400">
               We will force a change (Tamper) in the UI. Watch the system catch it and turn <span className="text-red-400 font-bold">RED</span>.
             </p>
          </div>
        </div>
        <p className="text-slate-500 text-sm animate-pulse">
          Click "Launch Demo" to start the live environment...
        </p>
      </div>
    )
  }
];

const Slideshow = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);

  const next = () => {
    if (current === slides.length - 1) {
      onComplete();
    } else {
      setCurrent(current + 1);
    }
  };

  const prev = () => {
    if (current > 0) setCurrent(current - 1);
  };

  return (
    <div className="min-h-screen bg-[#0c0f14] flex items-center justify-center p-4 md:p-8 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="bg-slate-900/50 border border-slate-800 p-8 md:p-16 rounded-3xl backdrop-blur-xl min-h-[500px] flex flex-col relative overflow-hidden shadow-2xl"
          >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-10" />

            {/* Slide Header */}
            <div className="flex justify-between items-start mb-8">
               <div>
                  <div className="text-xs font-mono text-blue-500 mb-2 tracking-widest">
                    PRESENTATION • {current + 1}/{slides.length}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent mb-3">
                    {slides[current].title}
                  </h1>
                  <h2 className="text-lg md:text-xl text-slate-400 font-light">
                    {slides[current].subtitle}
                  </h2>
               </div>
               {/* Tiny logo or brand mark could go here */}
               <div className="hidden md:block">
                  <Globe className="text-slate-800" size={48} />
               </div>
            </div>

            {/* Content Container */}
            <div className="flex-1 flex flex-col justify-center">
               {slides[current].content}
            </div>

            {/* Navigation Footer */}
            <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-800/50">
              <button 
                onClick={prev} 
                disabled={current === 0}
                className="flex items-center gap-2 text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-lg hover:bg-slate-800/50"
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              <button 
                onClick={next}
                className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-1 ${
                  current === slides.length - 1 
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25' 
                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                }`}
              >
                {current === slides.length - 1 ? (
                  <>Launch Live Demo <Play size={20} fill="currentColor" /></>
                ) : (
                  <>Next Slide <ChevronRight size={20} /></>
                )}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Slideshow;