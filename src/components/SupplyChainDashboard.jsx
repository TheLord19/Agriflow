// import React, { useState } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { 
//   Database, ShieldCheck, ShieldAlert, Activity, FileClock, 
//   Workflow, Server, AlertTriangle
// } from 'lucide-react';

// const SupplyChainDashboard = () => {
//   const [activeTab, setActiveTab] = useState('ledger');
//   const [isTampered, setIsTampered] = useState(false);

//   const flowSteps = [
//     { id: 1, label: 'Farmer', status: 'completed' },
//     { id: 2, label: 'PPC (Procurement)', status: 'completed' },
//     { id: 3, label: 'Mill', status: 'completed' },
//     { id: 4, label: 'Warehouse', status: 'completed' },
//     { id: 5, label: 'MLS (Inventory)', status: 'active' },
//     { id: 6, label: 'FPS (Dist)', status: 'pending' },
//   ];

//   return (
//     <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30 pb-20">
//       <div className="max-w-4xl mx-auto space-y-6">
        
//         {/* Header */}
//         <header className="flex flex-col md:flex-row justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl gap-4">
//           <div className="flex items-center gap-3 w-full md:w-auto">
//             <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
//               <Database className="text-white h-5 w-5" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
//                 Supply Chain Ledger
//               </h1>
//               <p className="text-xs text-slate-500 font-mono">SYSTEM TESTNET • v2.4.0</p>
//             </div>
//           </div>
          
//           <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${isTampered ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
//             <div className={`w-2 h-2 rounded-full ${isTampered ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
//             {isTampered ? 'INTEGRITY COMPROMISED' : 'STRUCTURAL COMPLETE'}
//           </div>
//         </header>

//         {/* Navigation Tabs */}
//         <nav className="flex gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 overflow-x-auto">
//           {[
//             { id: 'ledger', icon: Server, label: 'Ledger' },
//             { id: 'shadow', icon: Database, label: 'Shadow DB' },
//             { id: 'snapshots', icon: FileClock, label: 'Snapshots' },
//             { id: 'verify', icon: ShieldCheck, label: 'Verification' },
//             { id: 'flow', icon: Workflow, label: 'Flow' },
//           ].map((tab) => (
//             <button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
//                 activeTab === tab.id 
//                   ? 'text-white bg-slate-800 shadow-sm' 
//                   : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
//               }`}
//             >
//               <tab.icon size={16} />
//               {tab.label}
//               {activeTab === tab.id && (
//                 <motion.div
//                   layoutId="activeTab"
//                   className="absolute inset-0 bg-slate-800 rounded-lg -z-10"
//                   transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
//                 />
//               )}
//             </button>
//           ))}
//         </nav>

//         {/* Main Content Area */}
//         <div className="relative min-h-[400px]">
//           <AnimatePresence mode="wait">
            
//             {/* LEDGER TAB */}
//             {activeTab === 'ledger' && (
//               <motion.div
//                 key="ledger"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 className="grid grid-cols-1 md:grid-cols-2 gap-4"
//               >
//                 <Card title="Asset Details">
//                   <DetailRow label="Asset ID" value="SACK-001" />
//                   <DetailRow label="Current Phase" value="MLS (Inventory)" highlight />
//                   <DetailRow label="Origin" value="Nashik, MH" />
//                 </Card>

//                 <Card title="Blockchain State">
//                   <DetailRow label="Block Hash" value="0xa9f3...2e12" mono />
//                   <DetailRow label="Validator" value="Node-Alpha-7" />
//                   <DetailRow label="Gas Used" value="21004 Gwei" />
//                 </Card>

//                 <div className="col-span-1 md:col-span-2 mt-4 p-6 rounded-xl border border-slate-800 bg-slate-900/30 flex justify-between items-center">
//                   <div>
//                     <h3 className="text-sm font-medium text-slate-300">Simulation Controls</h3>
//                     <p className="text-xs text-slate-500 mt-1">Force state changes for testing validators.</p>
//                   </div>
//                   <button 
//                     onClick={() => setIsTampered(true)}
//                     disabled={isTampered}
//                     className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                   >
//                     <AlertTriangle size={16} />
//                     Simulate Tampering
//                   </button>
//                 </div>
//               </motion.div>
//             )}

//             {/* SHADOW DB TAB */}
//             {activeTab === 'shadow' && (
//               <motion.div
//                 key="shadow"
//                 initial={{ opacity: 0, y: 10 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 exit={{ opacity: 0, y: -10 }}
//                 className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden"
//               >
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-sm text-left">
//                     <thead className="bg-slate-950/50 text-slate-400 font-medium">
//                         <tr>
//                         <th className="px-6 py-4">Table Name</th>
//                         <th className="px-6 py-4">Rows</th>
//                         <th className="px-6 py-4">Constraint Rule</th>
//                         <th className="px-6 py-4">Status</th>
//                         </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-800">
//                         {[
//                         { name: 'PPC__procurement', rows: 124, rule: 'INSERT ONLY' },
//                         { name: 'CMR__milling', rows: 97, rule: 'INSERT ONLY' },
//                         { name: 'MLS__inventory', rows: 211, rule: 'INSERT ONLY' },
//                         { name: 'FPS__distribution', rows: 62, rule: 'INSERT ONLY' },
//                         ].map((row) => (
//                         <tr key={row.name} className="hover:bg-slate-800/30 transition-colors">
//                             <td className="px-6 py-4 font-mono text-blue-400">{row.name}</td>
//                             <td className="px-6 py-4 text-slate-300">{row.rows}</td>
//                             <td className="px-6 py-4">
//                             <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400">{row.rule}</span>
//                             </td>
//                             <td className="px-6 py-4 text-emerald-500 flex items-center gap-2">
//                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synced
//                             </td>
//                         </tr>
//                         ))}
//                     </tbody>
//                     </table>
//                 </div>
//               </motion.div>
//             )}

//             {/* VERIFICATION TAB */}
//             {activeTab === 'verify' && (
//               <motion.div
//                 key="verify"
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 exit={{ opacity: 0, scale: 0.95 }}
//                 className="flex flex-col items-center justify-center py-12"
//               >
//                 <div className={`relative p-8 rounded-full mb-6 ${isTampered ? 'bg-red-500/10' : 'bg-emerald-500/10'}`}>
//                    {isTampered ? (
//                      <ShieldAlert size={64} className="text-red-500 animate-pulse" />
//                    ) : (
//                      <ShieldCheck size={64} className="text-emerald-500" />
//                    )}
//                    <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${isTampered ? 'bg-red-500' : 'bg-emerald-500'}`} />
//                 </div>
                
//                 <h2 className="text-2xl font-bold mb-2">
//                   {isTampered ? 'Verification Failed' : 'Cryptographic Proof Valid'}
//                 </h2>
//                 <p className="text-slate-400 text-center max-w-md">
//                   {isTampered 
//                     ? 'Hash mismatch detected in block #a9f3. The on-chain fingerprint does not match the local state.' 
//                     : 'Merkle root matches on-chain state. No tampering detected in the supply chain lineage.'}
//                 </p>

//                 {isTampered && (
//                   <button 
//                     onClick={() => setIsTampered(false)}
//                     className="mt-8 text-sm text-slate-500 hover:text-white underline decoration-slate-700 underline-offset-4"
//                   >
//                     Reset System State
//                   </button>
//                 )}
//               </motion.div>
//             )}

//             {/* FLOW TAB */}
//             {activeTab === 'flow' && (
//               <motion.div
//                 key="flow"
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 exit={{ opacity: 0, x: -20 }}
//                 className="bg-slate-900/50 border border-slate-800 rounded-xl p-8"
//               >
//                 <div className="relative">
//                   <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800" />
                  
//                   <div className="space-y-8">
//                     {flowSteps.map((step) => (
//                       <div key={step.id} className="relative pl-14 group">
//                         <div className={`absolute left-[19px] top-1.5 w-3 h-3 rounded-full border-2 transition-colors z-10 ${
//                           step.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
//                           step.status === 'active' ? 'bg-blue-500 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' :
//                           'bg-slate-900 border-slate-600'
//                         }`} />
                        
//                         <div className="flex flex-col">
//                           <span className={`text-sm font-medium ${
//                             step.status === 'active' ? 'text-blue-400' : 
//                             step.status === 'completed' ? 'text-emerald-400' : 'text-slate-500'
//                           }`}>
//                             {step.label}
//                           </span>
//                           <span className="text-xs text-slate-600 mt-1">
//                             {step.status === 'completed' ? 'Verified & Locked' : 
//                              step.status === 'active' ? 'Processing...' : 'Awaiting Input'}
//                           </span>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               </motion.div>
//             )}

//             {/* SNAPSHOTS */}
//             {activeTab === 'snapshots' && (
//                <motion.div
//                key="snapshots"
//                initial={{ opacity: 0 }}
//                animate={{ opacity: 1 }}
//                exit={{ opacity: 0 }}
//                className="grid gap-4"
//              >
//                <Card title="IPFS Snapshots">
//                   <div className="space-y-3">
//                     <div className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between items-center group cursor-pointer hover:border-blue-500/50 transition-colors">
//                        <div className="flex items-center gap-3">
//                           <FileClock size={16} className="text-blue-500" />
//                           <div>
//                             <div className="text-sm text-slate-300">Latest Snapshot</div>
//                             <div className="text-xs text-slate-500 font-mono">CID-bafy9x23demo</div>
//                           </div>
//                        </div>
//                        <Activity size={14} className="text-emerald-500" />
//                     </div>
//                     <div className="p-3 bg-slate-950 rounded border border-slate-800 flex justify-between items-center opacity-75">
//                        <div className="flex items-center gap-3">
//                           <FileClock size={16} className="text-slate-600" />
//                           <div>
//                             <div className="text-sm text-slate-400">Previous Snapshot</div>
//                             <div className="text-xs text-slate-600 font-mono">CID-bafy8p11demo</div>
//                           </div>
//                        </div>
//                     </div>
//                   </div>
//                </Card>
//              </motion.div>
//             )}

//           </AnimatePresence>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Card = ({ title, children }) => (
//   <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors">
//     <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">{title}</h3>
//     <div className="space-y-4">{children}</div>
//   </div>
// );

// const DetailRow = ({ label, value, highlight, mono }) => (
//   <div>
//     <div className="text-xs text-slate-500 mb-1">{label}</div>
//     <div className={`text-sm font-medium ${highlight ? 'text-emerald-400' : 'text-slate-200'} ${mono ? 'font-mono' : ''}`}>
//       {value}
//     </div>
//   </div>
// );

// export default SupplyChainDashboard;



// import React, { useState, useEffect, useRef } from 'react';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Server, Link as LinkIcon, AlertTriangle, 
  Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
  MapPin, Package, X, Download, HardDrive, Edit3
} from 'lucide-react';

// --- HELPER: Deterministic Hash ---
const simpleHash = (data) => {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

const SupplyChainDashboard = () => {
  const [blocks, setBlocks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tamperedBlockIndex, setTamperedBlockIndex] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null); // For Inspection Modal
  const [interceptorOpen, setInterceptorOpen] = useState(false); // For Hacker Mode
  
  // Refs
  const bottomRef = useRef(null);

  // --- CONFIG ---
  const BLOCK_INTERVAL_MS = 10000; // 10 Seconds per block

  // --- NARRATIVE DATA ---
  const phases = [
    { name: 'Harvest', location: 'Nashik Farm', actor: 'Farmer_Ramesh', device: 'IoT_Scale_01' },
    { name: 'Procurement', location: 'PPC Centre #4', actor: 'Officer_Patil', device: 'Web_Portal_v2' },
    { name: 'Milling', location: 'Sai Rice Mill', actor: 'Miller_Singh', device: 'ERP_System_Auto' },
    { name: 'Warehousing', location: 'State WH #12', actor: 'Keeper_Yadav', device: 'Handheld_Scanner' },
    { name: 'MLS Inventory', location: 'Dist. Database', actor: 'System_Auto', device: 'Oracle_DB_Sync' },
    { name: 'FPS Distribution', location: 'Shop #99', actor: 'Dealer_Kumar', device: 'POS_Terminal' }
  ];

  const sackBatch = [
    { id: 'SK-801', weight: 50.0, quality: 'Grade-A' },
    { id: 'SK-802', weight: 50.0, quality: 'Grade-A' },
    { id: 'SK-803', weight: 50.0, quality: 'Grade-A' },
  ];

  // --- LOOP LOGIC ---
  useEffect(() => {
    let interval;
    if (isPlaying && !tamperedBlockIndex && blocks.length < phases.length) {
      interval = setInterval(() => {
        setBlocks(prev => {
          const phaseIndex = prev.length;
          const currentPhase = phases[phaseIndex];
          
          const transactions = sackBatch.map(s => ({
            ...s,
            timestamp: new Date().toISOString(),
            phase: currentPhase.name,
            operator: currentPhase.actor
          }));

          const prevHash = prev.length > 0 ? prev[prev.length - 1].hash : "00000000";
          // Simulate IPFS CID (Content Identifier)
          const fakeIpfsCid = `Qm${simpleHash(transactions)}zR${phaseIndex}x`; 
          const blockHash = simpleHash(JSON.stringify(transactions) + prevHash);
          
          return [...prev, {
            index: prev.length,
            phaseInfo: currentPhase,
            transactions: transactions,
            prevHash: prevHash,
            hash: blockHash,
            ipfsCid: fakeIpfsCid
          }];
        });
      }, BLOCK_INTERVAL_MS);
    }
    return () => clearInterval(interval);
  }, [isPlaying, tamperedBlockIndex, blocks]);

  useEffect(() => {
    if(isPlaying) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [blocks, isPlaying]);

  // --- ACTIONS ---
  const handleDownload = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(blocks, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "blockchain_ledger_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const applyTheft = (blockIdx, sackIdx, newValue) => {
    setTamperedBlockIndex(blockIdx);
    setInterceptorOpen(false);
    // Note: The UI logic below automatically renders the "tampered" state 
    // based on `tamperedBlockIndex`
  };

  const handleReset = () => {
    setBlocks([]);
    setTamperedBlockIndex(null);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#0c0f14] text-slate-200 p-4 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 px-2 shrink-0 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
            <Server size={24} className="text-blue-500" />
            Live Batch Tracker
          </h1>
          <p className="text-xs text-slate-500">Interval: 10s • Click blocks to inspect • Local Storage Enabled</p>
        </div>

        <div className="flex items-center gap-3">
           {/* Status */}
           <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-bold transition-colors ${
             tamperedBlockIndex !== null 
               ? 'bg-red-500/10 border-red-500/50 text-red-500' 
               : 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500'
           }`}>
             {tamperedBlockIndex !== null ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
             {tamperedBlockIndex !== null ? 'CHAIN INVALID' : 'SYSTEM SECURE'}
           </div>

           {/* Playback Controls */}
           <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
             {!isPlaying && blocks.length < phases.length ? (
               <button onClick={() => setIsPlaying(true)} disabled={tamperedBlockIndex !== null} className="p-2 hover:bg-emerald-600/20 text-emerald-400 rounded disabled:opacity-30">
                 <Play size={20} />
               </button>
             ) : (
               <button onClick={() => setIsPlaying(false)} className="p-2 hover:bg-yellow-600/20 text-yellow-400 rounded">
                 <Pause size={20} />
               </button>
             )}
             <button onClick={handleReset} className="p-2 hover:bg-slate-600 text-slate-400 rounded border-l border-slate-700 ml-1">
               <RefreshCw size={20} />
             </button>
           </div>
           
           {/* Action Buttons */}
           <button 
             onClick={handleDownload}
             className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg transition-colors"
             title="Download to PC"
           >
             <HardDrive size={20} />
           </button>

           <button 
             onClick={() => { setIsPlaying(false); setInterceptorOpen(true); }}
             disabled={blocks.length === 0 || tamperedBlockIndex !== null}
             className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             <AlertTriangle size={16} />
             Hacker Console
           </button>
        </div>
      </header>

      {/* COLUMNS */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
        {/* COL 1: UI DB */}
        <div className="col-span-3 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col">
           <PanelHeader title="1. Operational View" subtitle="Mutable Input Feed" icon={Database} color="blue" />
           <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              <AnimatePresence>
                {blocks.map((block, i) => {
                  const isTamperedRow = tamperedBlockIndex !== null && i === tamperedBlockIndex;
                  return (
                    <motion.div 
                      key={`ui-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer hover:border-blue-500/50 transition-colors ${isTamperedRow ? 'bg-red-500/10 border-red-500 text-red-100' : 'bg-slate-800/50 border-slate-700'}`}
                      onClick={() => setSelectedBlock(block)}
                    >
                      <div className="flex justify-between font-bold mb-2">
                         <span>{block.phaseInfo.name}</span>
                         <span className="font-mono opacity-50">#{block.index}</span>
                      </div>
                      <div className="space-y-1">
                        {block.transactions.map((tx, idx) => (
                           <div key={idx} className="flex justify-between font-mono">
                             <span>{tx.id}</span>
                             {isTamperedRow && idx === 1 ? (
                               <span className="text-red-400 font-bold">45.0kg</span> // Hardcoded simulation result
                             ) : (
                               <span className="text-emerald-400">{tx.weight}kg</span>
                             )}
                           </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={bottomRef} />
           </div>
        </div>

        {/* COL 2: SHADOW DB */}
        <div className="col-span-3 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col">
           <PanelHeader title="2. Shadow Log" subtitle="Append-Only Mirror" icon={Server} color="purple" />
           <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {blocks.map((block, i) => (
                <div key={`shadow-${i}`} className="p-3 rounded-lg border bg-slate-900 border-slate-800 grayscale opacity-60">
                   <div className="flex justify-between text-xs font-bold mb-2">
                     <span>{block.phaseInfo.name}</span>
                   </div>
                   {block.transactions.map((tx, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-mono text-slate-500">
                        <span>{tx.id}</span>
                        <span>{tx.weight}kg</span>
                      </div>
                   ))}
                </div>
              ))}
           </div>
        </div>

        {/* COL 3: LEDGER */}
        <div className="col-span-6 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col">
           <PanelHeader title="3. Distributed Ledger" subtitle="Verified Blocks (Click to Inspect)" icon={LinkIcon} color="emerald" />
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar relative">
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800 -z-10" />
              {blocks.map((block, i) => {
                const isTampered = tamperedBlockIndex !== null && i === tamperedBlockIndex;
                const isInvalid = tamperedBlockIndex !== null && i >= tamperedBlockIndex;

                return (
                  <motion.div 
                    key={`block-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelectedBlock(block)}
                    className={`ml-6 relative p-4 rounded-xl border cursor-pointer hover:scale-[1.01] transition-all duration-300 ${
                      isInvalid ? 'bg-red-950/30 border-red-500/50' : 'bg-emerald-950/10 border-emerald-500/30 hover:border-emerald-400/50'
                    }`}
                  >
                    <div className={`absolute -left-[29px] top-6 w-3 h-3 rounded-full border-2 z-10 ${isInvalid ? 'bg-red-500 border-red-500' : 'bg-emerald-500 border-emerald-500'}`} />
                    
                    <div className="flex justify-between items-start mb-2">
                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${isInvalid ? 'bg-red-500 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>BLOCK #{100+i}</span>
                       <span className="text-[10px] text-slate-500 font-mono">IPFS: {block.ipfsCid.substring(0,8)}...</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 bg-black/20 p-2 rounded mb-2">
                       <div><div className="text-[9px] text-slate-500">PREV HASH</div><div className="text-[10px] font-mono text-slate-400 truncate">{block.prevHash}</div></div>
                       <div><div className="text-[9px] text-slate-500">CURR HASH</div><div className={`text-[10px] font-mono truncate ${isInvalid ? 'text-red-400' : 'text-emerald-400'}`}>{block.hash}</div></div>
                    </div>
                    
                    {isTampered && <div className="text-xs text-red-400 font-bold flex items-center gap-2"><AlertTriangle size={12}/> DATA MISMATCH DETECTED</div>}
                  </motion.div>
                );
              })}
           </div>
        </div>

      </div>

      {/* --- INSPECTION MODAL (When clicking a block) --- */}
      <AnimatePresence>
        {selectedBlock && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="text-blue-500"/> Block Details #{100 + selectedBlock.index}</h2>
                  <p className="text-sm text-slate-500">Stored on IPFS Node: {selectedBlock.ipfsCid}</p>
                </div>
                <button onClick={() => setSelectedBlock(null)} className="p-2 hover:bg-slate-800 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 space-y-4">
                <div className="bg-black/30 p-4 rounded-lg border border-slate-800">
                  <h3 className="text-slate-500 mb-2 uppercase font-bold">Raw JSON Data</h3>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(selectedBlock.transactions, null, 2)}</pre>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-900/10 p-3 rounded border border-emerald-500/20">
                    <div className="text-slate-500 mb-1">Validator Signature</div>
                    <div className="truncate text-emerald-400">0x7d3a...91b2</div>
                  </div>
                  <div className="bg-blue-900/10 p-3 rounded border border-blue-500/20">
                    <div className="text-slate-500 mb-1">Timestamp</div>
                    <div className="text-blue-300">{selectedBlock.transactions[0].timestamp}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- HACKER CONSOLE (Theft Simulator) --- */}
      <AnimatePresence>
        {interceptorOpen && (
           <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
               className="bg-black border border-red-600 rounded-xl w-full max-w-lg p-6 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
             >
               <h2 className="text-2xl font-bold text-red-500 mb-2 flex items-center gap-2"><Edit3/> Interceptor Console</h2>
               <p className="text-slate-400 text-sm mb-6">Manually override database values. This simulates a "Man-in-the-Middle" or "DB Admin" attack.</p>
               
               <div className="space-y-4">
                 <div className="bg-slate-900 p-3 rounded border border-slate-700">
                   <label className="text-xs text-slate-500 uppercase">Target Block</label>
                   <select className="w-full bg-black text-white p-2 rounded border border-slate-700 mt-1">
                     <option>Block #102 (Milling Phase)</option>
                   </select>
                 </div>
                 
                 <div className="bg-slate-900 p-3 rounded border border-slate-700">
                   <label className="text-xs text-slate-500 uppercase">Target Asset</label>
                   <div className="flex justify-between items-center mt-1 p-2 bg-black rounded border border-slate-700">
                     <span>SK-802</span>
                     <span className="text-emerald-500">50.0kg</span>
                   </div>
                 </div>

                 <div className="bg-slate-900 p-3 rounded border border-red-900/50">
                   <label className="text-xs text-red-400 uppercase font-bold">New Value (Inject)</label>
                   <input type="text" value="45.0" className="w-full bg-red-950/30 text-white p-2 rounded border border-red-500 mt-1 font-bold" readOnly />
                   <p className="text-[10px] text-red-400 mt-1">Warning: This will break the SHA-256 chain linkage.</p>
                 </div>
               </div>

               <div className="flex gap-3 mt-8">
                 <button onClick={() => setInterceptorOpen(false)} className="flex-1 py-3 rounded bg-slate-800 hover:bg-slate-700 text-white">Cancel</button>
                 <button onClick={() => applyTheft(2, 1, 45.0)} className="flex-1 py-3 rounded bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/40">EXECUTE ATTACK</button>
               </div>
             </motion.div>
           </div>
        )}
      </AnimatePresence>

    </div>
  );
};

const PanelHeader = ({ title, subtitle, icon: Icon, color }) => (
  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
    <Icon size={16} className={`text-${color}-500`} />
    <div>
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{subtitle}</p>
    </div>
  </div>
);

export default SupplyChainDashboard;