
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Play, Database, ShieldCheck, QrCode,
  Server, Lock, FileText, Cpu, Network, ScanLine, Key, Link,
  ArrowRight, FileJson, Globe, CheckCircle2, HardDrive
} from 'lucide-react';

const slides = [
  {
    id: 1,
    title: "Hybrid Ledger Protocol",
    subtitle: "The Truth-Machine for Agriculture",
    color: "from-blue-500/20 to-indigo-900/20",
    content: (
      <div className="flex flex-col items-center justify-center h-full space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full"></div>
          <ShieldCheck size={120} className="text-blue-400 relative z-10" />
        </div>
        <p className="text-center text-xl text-slate-300 max-w-2xl">
          We bridge the trust gap between Farmers and Consumers. Using a <span className="text-blue-400 font-bold">Hybrid Architecture</span> (SQL + Blockchain), we create an immutable digital twin for every physical sack of produce.
        </p>
      </div>
    )
  },
  {
    id: 2,
    title: "The 3 Pillars of Truth",
    subtitle: "System Topology",
    color: "from-purple-500/20 to-fuchsia-900/20",
    content: (
      <div className="grid grid-cols-3 gap-6 mt-10 w-full">
        {/* Pillar 1 */}
        <div className="flex flex-col items-center text-center space-y-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg hover:border-blue-500 transition-colors">
          <div className="p-4 bg-blue-500/20 rounded-full"><Database size={40} className="text-blue-400" /></div>
          <div>
            <h3 className="font-bold text-white text-lg">1. Operational DB</h3>
            <p className="text-xs text-blue-300 mt-2 font-mono">MUTABLE INPUT</p>
            <p className="text-xs text-slate-400 mt-2">Real-time SQL Speed</p>
          </div>
        </div>
        {/* Pillar 2 */}
        <div className="flex flex-col items-center text-center space-y-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg hover:border-purple-500 transition-colors">
          <div className="p-4 bg-purple-500/20 rounded-full"><HardDrive size={40} className="text-purple-400" /></div>
          <div>
            <h3 className="font-bold text-white text-lg">2. IPFS Cluster</h3>
            <p className="text-xs text-purple-300 mt-2 font-mono">IMMUTABLE STORAGE</p>
            <p className="text-xs text-slate-400 mt-2">Heavy Data Snapshots</p>
          </div>
        </div>
        {/* Pillar 3 */}
        <div className="flex flex-col items-center text-center space-y-4 p-6 bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg hover:border-emerald-500 transition-colors">
          <div className="p-4 bg-emerald-500/20 rounded-full"><Link size={40} className="text-emerald-400" /></div>
          <div>
            <h3 className="font-bold text-white text-lg">3. Polygon Ledger</h3>
            <p className="text-xs text-emerald-300 mt-2 font-mono">THE SEAL</p>
            <p className="text-xs text-slate-400 mt-2">Cryptographic Proof</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 3,
    title: "Step 1: Ingestion & Buffering",
    subtitle: "The Operational Layer",
    color: "from-emerald-500/20 to-green-900/20",
    content: (
      <div className="flex flex-col items-center w-full mt-8">
        <div className="flex items-center gap-4 mb-8 w-full justify-center">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 text-center w-32 flex flex-col items-center shadow-lg">
            <QrCode size={32} className="text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-300">QR Code</span>
          </div>
          <ArrowRight className="text-emerald-500 animate-pulse" />
          <div className="bg-emerald-900/20 p-6 rounded-xl border border-emerald-500 text-center w-40 flex flex-col items-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <Database size={40} className="text-emerald-400 mb-2" />
            <span className="text-xs font-bold text-white">Local Buffer</span>
            <span className="text-[10px] text-emerald-300 mt-1">High Throughput</span>
          </div>
          <ArrowRight className="text-emerald-500 animate-pulse" />
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 text-center w-32 flex flex-col items-center shadow-lg">
            <FileJson size={32} className="text-slate-400 mb-2" />
            <span className="text-xs font-bold text-slate-300">JSON Batch</span>
          </div>
        </div>
        <p className="text-center text-slate-300 text-sm max-w-xl bg-slate-900/50 p-4 rounded-lg border border-slate-700">
          Data enters a local buffer first. This allows for instant UI updates and error correction before the expensive blockchain commitment.
        </p>
      </div>
    )
  },
  {
    id: 4,
    title: "Step 2: Merkle Tree Snapshot",
    subtitle: "Content Addressing (IPFS)",
    color: "from-orange-500/20 to-red-900/20",
    content: (
      <div className="flex flex-col items-center w-full mt-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-orange-500/30 w-full max-w-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 bg-orange-500/10 rounded-bl-xl text-xs text-orange-400 font-mono">HASHING ENGINE</div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-center bg-slate-800 p-3 rounded-lg border border-slate-700">
              <FileJson size={32} className="text-slate-300 mx-auto mb-2" />
              <span className="text-xs text-slate-400">Raw Data</span>
            </div>
            <ArrowRight size={24} className="text-orange-500" />
            <div className="text-center bg-orange-900/20 p-3 rounded-lg border border-orange-500/50">
              <HardDrive size={32} className="text-orange-400 mx-auto mb-2" />
              <span className="text-xs text-orange-300">IPFS Node</span>
            </div>
          </div>
          <div className="bg-black p-3 rounded border border-slate-700 font-mono text-xs text-orange-300 text-center shadow-inner">
            CID: QmXy7...9zA
          </div>
        </div>
        <p className="text-center text-slate-300 text-sm max-w-lg">
          The system converts the JSON data into a Merkle DAG. It generates a <strong>Content Identifier (CID)</strong>—a unique hash fingerprint that changes if even one bit is altered.
        </p>
      </div>
    )
  },
  {
    id: 99,
    title: "Step 3: Blockchain Transformation",
    subtitle: "The Consensus Layer",
    color: "from-indigo-500/20 to-violet-900/20",
    content: (
      <div className="flex flex-col items-center w-full mt-4">
        <div className="bg-slate-900 p-8 rounded-2xl border border-indigo-500/30 w-full max-w-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 bg-indigo-500/10 rounded-bl-xl text-xs text-indigo-400 font-mono">CONSENSUS ENGINE</div>
          <div className="flex justify-between items-center mb-6">
            <div className="text-center bg-slate-800 p-3 rounded-lg border border-slate-700">
              <Globe size={32} className="text-slate-300 mx-auto mb-2" />
              <span className="text-xs text-slate-400">Network</span>
            </div>
            <ArrowRight size={24} className="text-indigo-500" />
            <div className="text-center bg-indigo-900/20 p-3 rounded-lg border border-indigo-500/50">
              <Link size={32} className="text-indigo-400 mx-auto mb-2" />
              <span className="text-xs text-indigo-300">Block Hash</span>
            </div>
          </div>
          <div className="bg-black p-3 rounded border border-slate-700 font-mono text-xs text-indigo-300 text-center shadow-inner">
            Block #143092 Validated
          </div>
        </div>
        <p className="text-center text-slate-300 text-sm max-w-lg">
          Similar to IPFS, the network nodes validate the transaction. The data is hashed and added to a <strong>Block</strong>, creating an immutable record on the ledger.
        </p>
      </div>
    )
  },
  {
    id: 5,
    title: "Step 4: The Operator Protocol",
    subtitle: "Human-in-the-Loop Consensus",
    color: "from-yellow-500/20 to-amber-900/20",
    content: (
      <div className="flex justify-center items-center gap-12 mt-8 w-full">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full border-4 border-yellow-500 flex items-center justify-center text-4xl font-bold text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.3)] bg-slate-900">
            15s
          </div>
          <span className="mt-4 font-bold text-yellow-500 text-sm uppercase tracking-wider">Buffer Window</span>
        </div>
        <div className="h-32 w-px bg-slate-700"></div>
        <div className="flex flex-col gap-4">
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex items-center gap-3 w-64">
            <ShieldCheck className="text-green-500" size={20} /> <span className="text-sm text-slate-300">Allow Corrections</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex items-center gap-3 w-64">
            <Lock className="text-red-500" size={20} /> <span className="text-sm text-slate-300">Auto-Lock at 0s</span>
          </div>
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-600 flex items-center gap-3 w-64">
            <Globe className="text-blue-500" size={20} /> <span className="text-sm text-slate-300">Broadcast to Network</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 6,
    title: "Step 5: Blockchain Anchoring",
    subtitle: "The Immutable Seal",
    color: "from-cyan-500/20 to-sky-900/20",
    content: (
      <div className="flex flex-col items-center w-full mt-6">
        <div className="flex items-center gap-4 mb-8 w-full justify-center">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 text-center w-36 shadow-lg">
            <div className="text-[10px] text-slate-500 mb-2 uppercase font-bold">PAYLOAD (CID)</div>
            <div className="font-mono text-xs text-cyan-400 bg-slate-900 p-2 rounded truncate">QmXy...9z</div>
          </div>
          <div className="h-1 w-12 bg-cyan-500/50"></div>
          <div className="bg-cyan-900/20 p-6 rounded-xl border border-cyan-500 text-center w-48 relative shadow-[0_0_40px_rgba(6,182,212,0.2)]">
            <div className="absolute -top-3 -right-3 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">MINED</div>
            <Link size={40} className="mx-auto text-cyan-400 mb-2" />
            <div className="text-sm font-bold text-white">Smart Contract</div>
            <div className="text-[10px] text-cyan-300 mt-1">Block #143092</div>
          </div>
        </div>
        <p className="text-center text-slate-300 text-sm max-w-xl">
          The IPFS CID is pushed to the <strong>Polygon Network</strong>. We store only the 'Proof of Existence' (the Hash), creating a permanent, timestamped audit trail efficiently.
        </p>
      </div>
    )
  },
  {
    id: 7,
    title: "Mechanism: Triangulation",
    subtitle: "Double-Lock Verification",
    color: "from-rose-500/20 to-pink-900/20",
    content: (
      <div className="relative w-full max-w-lg mt-10 h-56 mx-auto">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <div className="bg-slate-900 p-3 rounded-xl border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Database className="text-blue-500" size={32} />
          </div>
          <span className="text-xs mt-2 font-bold text-blue-400">Local DB</span>
        </div>
        <div className="absolute bottom-0 left-0 flex flex-col items-center">
          <div className="bg-slate-900 p-3 rounded-xl border border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <FileText className="text-purple-500" size={32} />
          </div>
          <span className="text-xs mt-2 font-bold text-purple-400">IPFS File</span>
        </div>
        <div className="absolute bottom-0 right-0 flex flex-col items-center">
          <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Link className="text-emerald-500" size={32} />
          </div>
          <span className="text-xs mt-2 font-bold text-emerald-400">Ledger</span>
        </div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none -z-10">
          <line x1="50%" y1="25%" x2="15%" y2="75%" stroke="#475569" strokeWidth="2" strokeDasharray="4" />
          <line x1="50%" y1="25%" x2="85%" y2="75%" stroke="#475569" strokeWidth="2" strokeDasharray="4" />
          <line x1="20%" y1="80%" x2="80%" y2="80%" stroke="#10b981" strokeWidth="3" />
        </svg>
        <div className="absolute bottom-[-30px] w-full text-center">
          <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs border border-slate-600">
            If Hash(DB) == Hash(IPFS) == Chain, Data is Valid.
          </span>
        </div>
      </div>
    )
  },
  {
    id: 8,
    title: "Output: Dynamic Certificates",
    subtitle: "Trustless Generation",
    color: "from-teal-500/20 to-emerald-900/20",
    content: (
      <div className="flex items-center justify-center gap-8 mt-6">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 w-32 opacity-50 scale-90 flex flex-col gap-2">
          <div className="h-2 w-12 bg-slate-600 rounded"></div>
          <div className="h-2 w-20 bg-slate-700 rounded"></div>
          <div className="h-2 w-16 bg-slate-700 rounded"></div>
        </div>
        <ArrowRight className="text-teal-500" />
        <div className="bg-white text-slate-900 p-6 rounded-xl shadow-2xl w-56 relative transform hover:scale-105 transition-transform duration-300">
          <div className="absolute -top-3 -right-3 bg-teal-500 text-white p-2 rounded-full shadow-lg"><CheckCircle2 size={20} /></div>
          <div className="border-4 border-double border-slate-200 h-full p-3 flex flex-col items-center text-center">
            <ShieldCheck size={32} className="text-teal-600 mb-3" />
            <div className="font-serif font-bold text-sm uppercase tracking-wider text-slate-800">Quality Cert</div>
            <div className="text-[10px] text-slate-500 mt-1 mb-4">Verified via Hybrid Ledger</div>
            <div className="w-16 h-16 bg-slate-900 flex items-center justify-center text-white text-[8px]">QR CODE</div>
          </div>
        </div>
      </div>
    )
  }
];

const Slideshow = ({ onComplete }) => {
  const [current, setCurrent] = useState(0);
  const next = () => current === slides.length - 1 ? onComplete() : setCurrent(current + 1);
  const prev = () => current > 0 && setCurrent(current - 1);

  return (
    <div className="min-h-screen bg-[#0c0f14] flex items-center justify-center p-4 md:p-8 text-slate-200 font-sans selection:bg-blue-500/30">
      <div className="max-w-5xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`bg-slate-900/50 border border-slate-800 p-12 rounded-3xl backdrop-blur-xl h-[600px] flex flex-col relative overflow-hidden shadow-2xl`}
          >
            {/* Background Gradients */}
            <div className={`absolute inset-0 bg-gradient-to-br ${slides[current].color} opacity-20 -z-10`} />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-10" />

            {/* Header */}
            <div className="flex justify-between items-start mb-6 shrink-0">
              <div>
                <div className="text-xs font-mono text-white/50 mb-2 tracking-widest">ARCH-PHASE {current + 1} OF {slides.length}</div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">{slides[current].title}</h1>
                <h2 className="text-xl text-slate-300 font-light">{slides[current].subtitle}</h2>
              </div>
            </div>

            {/* Content (The Visuals) */}
            <div className="flex-1 flex items-center justify-center w-full">
              {slides[current].content}
            </div>

            {/* Fixed Controls - Absolute Positioning */}
            <div className="absolute bottom-8 right-8 flex gap-4 z-20">
              <button onClick={prev} disabled={current === 0} className="p-4 rounded-full bg-slate-950 hover:bg-slate-800 text-white border border-slate-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                <ChevronLeft size={24} />
              </button>
              <button onClick={next} className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold transition-all ${current === slides.length - 1 ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-900 hover:bg-slate-200'}`}>
                {current === slides.length - 1 ? <>Launch Console <Play size={20} /></> : <>Next <ChevronRight size={20} /></>}</button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-8 left-8 flex gap-2 z-20">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-12 bg-white' : 'w-2 bg-white/20'}`} />
              ))}
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
export default Slideshow;
