
// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box
// } from 'lucide-react';

// // --- HELPER: Deterministic Hash ---
// const simpleHash = (data) => {
//   const str = JSON.stringify(data);
//   let hash = 0;
//   for (let i = 0; i < str.length; i++) {
//     const char = str.charCodeAt(i);
//     hash = ((hash << 5) - hash) + char;
//     hash = hash & hash;
//   }
//   return Math.abs(hash).toString(16).padStart(8, '0');
// };

// const SupplyChainDashboard = () => {
//   // --- STATE ---
//   const [blocks, setBlocks] = useState([]); 
//   const [localDB, setLocalDB] = useState({}); 
//   const [ipfsStorage, setIpfsStorage] = useState({});
  
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [pendingBatch, setPendingBatch] = useState(null); 
//   const [activeSackStates, setActiveSackStates] = useState({});
  
//   const [timeLeft, setTimeLeft] = useState(15);
//   const [isAuthority, setIsAuthority] = useState(false);

//   // Modals & Search
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [viewMode, setViewMode] = useState(null);
//   const [hackerMode, setHackerMode] = useState(false);
//   const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
  
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sackHistory, setSackHistory] = useState(null); // Stores results for the verify window

//   const scrollRefUI = useRef(null);

//   // --- CONFIG ---
//   const BATCH_SIZE = 20;
//   const TOTAL_SACKS = 100;
//   const TIMER_DURATION = 15;

//   // --- TOPOLOGY LOGIC ---
//   const getNextPhase = (currentPhase) => {
//     if (!currentPhase) return 'FARMER'; 
//     switch (currentPhase) {
//       case 'FARMER': return 'PPC'; 
//       case 'PPC': return 'CMR';    
//       case 'CMR': return Math.random() > 0.3 ? 'MLS' : 'WH'; 
//       case 'WH': return 'MLS';     
//       case 'MLS': return 'FPS';    
//       case 'FPS': return 'CONSUMED'; 
//       default: return 'PPC';
//     }
//   };

//   // --- BATCH GENERATOR ---
//   const generateBatch = () => {
//     let newTransactions = [];
//     let tempStates = { ...activeSackStates };

//     for (let i = 0; i < BATCH_SIZE; i++) {
//       const sackNum = Math.floor(Math.random() * TOTAL_SACKS) + 1;
//       const sackId = `SK-${sackNum.toString().padStart(3, '0')}`;
//       const currentPhase = tempStates[sackId] || null;
      
//       if (currentPhase === 'CONSUMED') continue; 

//       const nextPhase = getNextPhase(currentPhase);
//       tempStates[sackId] = nextPhase;

//       let evt = "UPDATE";
//       if (nextPhase === 'PPC') evt = "SACK_CREATED";
//       if (nextPhase === 'CMR') evt = "MILLING_START";
//       if (nextPhase === 'WH') evt = "STOCK_IN";
//       if (nextPhase === 'MLS') evt = "ALLOCATION";
//       if (nextPhase === 'FPS') evt = "DISTRIBUTION";

//       newTransactions.push({
//         sack_id: sackId,
//         phase: nextPhase,
//         event: evt,
//         weight_kg: 50.0,
//         quality: 'Grade A',
//         timestamp: new Date().toISOString(),
//         isCorrection: false
//       });
//     }

//     setPendingBatch(newTransactions);
//     setActiveSackStates(tempStates);
//     setIsPlaying(false);
//     setTimeLeft(TIMER_DURATION);
//   };

//   useEffect(() => {
//     let timer;
//     if (pendingBatch && timeLeft > 0) {
//       timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
//     } else if (pendingBatch && timeLeft === 0) {
//       anchorBatch();
//     }
//     return () => clearInterval(timer);
//   }, [pendingBatch, timeLeft]);

//   useEffect(() => {
//     let interval;
//     if (isPlaying && !pendingBatch) {
//       interval = setInterval(generateBatch, 2000); 
//     }
//     return () => clearInterval(interval);
//   }, [isPlaying, pendingBatch]);

//   // --- ACTIONS ---
//   const updatePendingRow = (idx, field, value) => {
//     if (!isAuthority) return;
//     const updated = [...pendingBatch];
//     updated[idx][field] = value;
//     setPendingBatch(updated);
//   };

//   const anchorBatch = () => {
//     if (!pendingBatch) return;

//     const blockIndex = blocks.length;
//     const prevHash = blockIndex > 0 ? blocks[blockIndex - 1].hash : "00000000";
//     const fileContent = JSON.stringify(pendingBatch);
//     const cid = `Qm${simpleHash(fileContent)}x${simpleHash(new Date().toISOString()).substring(0,6)}`;
    
//     setIpfsStorage(prev => ({ ...prev, [cid]: pendingBatch }));
//     setLocalDB(prev => ({ ...prev, [blockIndex]: JSON.parse(JSON.stringify(pendingBatch)) }));

//     const newBlock = {
//       index: blockIndex,
//       timestamp: new Date().toISOString(),
//       prevHash: prevHash,
//       ipfsCid: cid,
//       hash: simpleHash(cid + prevHash), 
//       status: 'VALID'
//     };

//     setBlocks(prev => [...prev, newBlock]);
//     setPendingBatch(null);
//     setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//   };

//   const rectifyMistake = (oldBlock, row) => {
//     if (!isAuthority) return;
//     const correctionEntry = {
//       sack_id: row.sack_id,
//       phase: row.phase,
//       event: `RECTIFY_BATCH_${oldBlock.index}`,
//       weight_kg: 50.0, 
//       quality: 'CORRECTED',
//       timestamp: new Date().toISOString(),
//       isCorrection: true
//     };
//     if (pendingBatch) {
//       setPendingBatch(prev => [correctionEntry, ...prev]);
//     } else {
//       setPendingBatch([correctionEntry]);
//       setTimeLeft(TIMER_DURATION);
//     }
//     setSelectedBlock(null);
//   };

//   const executeAttack = () => {
//     const { blockIdx, rowIdx, val } = hackerTarget;
//     if (!localDB[blockIdx]) return;
//     const corruptedData = [...localDB[blockIdx]];
//     if(corruptedData[rowIdx]) {
//         corruptedData[rowIdx].weight_kg = parseFloat(val); 
//         setLocalDB(prev => ({ ...prev, [blockIdx]: corruptedData }));
//     }
//     setHackerMode(false);
//   };

//   const checkIntegrity = (block) => {
//     const localHash = simpleHash(JSON.stringify(localDB[block.index]));
//     const ipfsHash = simpleHash(JSON.stringify(ipfsStorage[block.ipfsCid]));
//     return localHash === ipfsHash;
//   };

//   // --- PDF GENERATOR ---
//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(18);
//     doc.text("AgriFlow Audit Report", 14, 20);
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
//     doc.text(`Total Blocks Anchored: ${blocks.length}`, 14, 34);

//     let yPos = 40;

//     blocks.forEach((block) => {
//       const dbRows = localDB[block.index] || [];
      
//       // Block Header
//       doc.setFontSize(12);
//       doc.setTextColor(0, 100, 255);
//       doc.text(`Block #${100 + block.index} (Hash: ${block.hash.substring(0, 12)}...)`, 14, yPos);
//       yPos += 8;

//       // Table Data
//       const tableData = dbRows.map(row => [
//         row.sack_id, 
//         row.phase, 
//         row.event, 
//         `${row.weight_kg} kg`,
//         row.timestamp.split('T')[1].split('.')[0]
//       ]);

//       autoTable(doc, {
//         startY: yPos,
//         head: [['Sack ID', 'Phase', 'Event', 'Weight', 'Time']],
//         body: tableData,
//         theme: 'grid',
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [22, 163, 74] }, // Emerald Green
//       });

//       yPos = doc.lastAutoTable.finalY + 15;
      
//       // Page Break Check
//       if (yPos > 270) {
//         doc.addPage();
//         yPos = 20;
//       }
//     });

//     doc.save("AgriFlow_Audit_Report.pdf");
//   };

//   // --- SACK SEARCH (Lifecycle) ---
//   const handleSearch = () => {
//     if (!searchQuery) return;
    
//     const history = [];
    
//     // Scan ALL blocks for this sack ID
//     Object.keys(localDB).forEach(blockIdx => {
//       const rows = localDB[blockIdx];
//       rows.forEach(row => {
//         if (row.sack_id.toLowerCase() === searchQuery.toLowerCase()) {
//           history.push({ ...row, blockIndex: blockIdx });
//         }
//       });
//     });

//     if (history.length > 0) {
//       setSackHistory(history);
//     } else {
//       alert("Sack ID not found in current ledger.");
//     }
//   };

//   const openModal = (block, type) => {
//     setSelectedBlock(block);
//     setViewMode(type);
//   };

//   return (
//     <div className="h-screen bg-[#0c0f14] text-slate-200 p-4 font-sans flex flex-col overflow-hidden">
      
//       {/* HEADER */}
//       <header className="flex justify-between items-center mb-4 px-2 shrink-0 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
//         <div>
//           <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
//             <Server size={24} className="text-blue-500" />
//             AgriFlow Console
//           </h1>
//           <p className="text-xs text-slate-500">100 Sacks • Auto-Anchor (15s) • Rectification</p>
//         </div>

//         <div className="flex items-center gap-3">
           
//            {/* SEARCH BAR */}
//            <div className="flex items-center bg-black border border-slate-700 rounded-lg px-2 py-1.5 focus-within:border-blue-500">
//              <input 
//                className="bg-transparent border-none outline-none text-xs text-white w-24 placeholder-slate-600"
//                placeholder="Check Sack ID"
//                value={searchQuery}
//                onChange={(e) => setSearchQuery(e.target.value)}
//                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
//              />
//              <button onClick={handleSearch} className="text-slate-500 hover:text-white"><Search size={14}/></button>
//            </div>

//            <button onClick={() => setIsAuthority(!isAuthority)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isAuthority ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
//               {isAuthority ? <UserCheck size={14} /> : <User size={14} />}
//               {isAuthority ? "AUTHORITY" : "VIEWER"}
//            </button>

//            <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
//              {!isPlaying && !pendingBatch ? (
//                <button onClick={() => setIsPlaying(true)} className="p-2 hover:bg-emerald-600/20 text-emerald-400 rounded flex items-center gap-2">
//                  <Play size={20} />
//                </button>
//              ) : (
//                <button onClick={() => setIsPlaying(false)} className="p-2 hover:bg-yellow-600/20 text-yellow-400 rounded">
//                  <Pause size={20} />
//                </button>
//              )}
//              <button onClick={() => {setBlocks([]); setLocalDB({}); setIpfsStorage({}); setSackHistory(null);}} className="p-2 hover:bg-slate-600 text-slate-400 rounded border-l border-slate-700 ml-1">
//                <RefreshCw size={20} />
//              </button>
//            </div>
           
//            <button onClick={handleDownloadPDF} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg" title="Download PDF Report">
//              <FileText size={20} />
//            </button>

//            <button onClick={() => setHackerMode(true)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 px-3 py-2 rounded-lg">
//              <Edit3 size={16} />
//            </button>
//         </div>
//       </header>

//       {/* COLUMNS */}
//       <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
//         {/* COL 1: OPERATIONAL CSV */}
//         <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
//            <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//              <Database size={16} className="text-blue-500" />
//              <div className="flex-1">
//                <h2 className="text-sm font-semibold text-slate-200">1. Operational CSV</h2>
//                <p className="text-[10px] text-slate-500 uppercase">Local Mutable Storage</p>
//              </div>
//            </div>
//            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
//               {blocks.map((block) => {
//                 const isValid = checkIntegrity(block);
//                 return (
//                   <div 
//                     key={block.index} 
//                     className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors group mb-3 ${isValid ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500' : 'bg-red-900/20 border-red-500'}`}
//                     onClick={() => openModal(block, 'ui')}
//                   >
//                     <div className="flex justify-between mb-2">
//                       <span className="font-bold text-slate-300">Batch #{block.index + 1}</span>
//                       <span className="font-mono opacity-50">{localDB[block.index]?.length} Rows</span>
//                     </div>
//                     <div className="space-y-1">
//                       {localDB[block.index]?.slice(0, 3).map((row, i) => (
//                          <div key={i} className={`flex justify-between font-mono text-[10px] ${row.isCorrection ? 'text-yellow-400' : 'text-slate-500'}`}>
//                            <span>{row.sack_id} {row.isCorrection && '(CORR)'}</span>
//                            <span className={row.weight_kg !== 50 ? "text-red-400 font-bold" : ""}>{row.weight_kg}kg</span>
//                          </div>
//                       ))}
//                       <div className="text-[10px] text-slate-600 italic mt-1">... +17 more</div>
//                     </div>
//                     {!isValid && <div className="mt-2 text-red-400 font-bold flex items-center gap-1"><AlertTriangle size={12}/> DATA CORRUPTED</div>}
//                   </div>
//                 );
//               })}
//               <div ref={scrollRefUI} />
//            </div>
//         </div>

//         {/* COL 2: IPFS STORAGE */}
//         <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
//            <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//              <HardDrive size={16} className="text-purple-500" />
//              <div className="flex-1">
//                <h2 className="text-sm font-semibold text-slate-200">2. IPFS Network</h2>
//                <p className="text-[10px] text-slate-500 uppercase">Immutable File Snapshots</p>
//              </div>
//            </div>
//            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
//               {blocks.map((block) => (
//                 <div 
//                   key={block.index} 
//                   className="p-4 rounded-lg border bg-slate-950 border-slate-800 cursor-pointer hover:border-purple-500 hover:bg-purple-900/10 transition-all mb-3"
//                   onClick={() => openModal(block, 'ipfs')}
//                 >
//                    <div className="flex items-center justify-between mb-2">
//                      <div className="flex items-center gap-2 text-purple-400">
//                        <FileText size={14} />
//                        <span className="text-xs font-bold">Snapshot_{block.index + 1}.json</span>
//                      </div>
//                      <Lock size={12} className="text-slate-600" />
//                    </div>
//                    <div className="bg-purple-900/20 p-2 rounded border border-purple-500/20">
//                      <div className="text-[9px] text-purple-300 uppercase">CID</div>
//                      <div className="font-mono text-[10px] text-slate-300 break-all">{block.ipfsCid}</div>
//                    </div>
//                 </div>
//               ))}
//            </div>
//         </div>

//         {/* COL 3: BLOCKCHAIN */}
//         <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
//            <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//              <LinkIcon size={16} className="text-emerald-500" />
//              <div className="flex-1">
//                <h2 className="text-sm font-semibold text-slate-200">3. Ledger Anchors</h2>
//                <p className="text-[10px] text-slate-500 uppercase">Proof of Existence</p>
//              </div>
//            </div>
//            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative">
//               <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-800 -z-10" />
//               {blocks.map((block) => {
//                 const isValid = checkIntegrity(block);
//                 return (
//                   <div 
//                     key={block.index} 
//                     className={`ml-5 relative p-4 rounded-lg border cursor-pointer hover:scale-[1.01] transition-all mb-3 ${isValid ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-red-950/20 border-red-500/50'}`}
//                     onClick={() => openModal(block, 'ledger')}
//                   >
//                     <div className={`absolute -left-[25px] top-6 w-3 h-3 rounded-full border-2 z-10 ${isValid ? 'bg-emerald-500 border-emerald-500' : 'bg-red-500 border-red-500'}`} />
//                     <div className="flex justify-between items-center mb-2">
//                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500 text-white'}`}>BLOCK #{100+block.index}</span>
//                     </div>
//                     <div className="space-y-2">
//                        <div>
//                          <div className="text-[9px] text-slate-500">HASH LINK</div>
//                          <div className={`text-[10px] font-mono truncate ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>{block.hash}</div>
//                        </div>
//                     </div>
//                   </div>
//                 );
//               })}
//            </div>
//         </div>
//       </div>

//       {/* --- MODAL: SACK VERIFIER (LIFECYCLE) --- */}
//       <AnimatePresence>
//         {sackHistory && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSackHistory(null)}>
//              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-emerald-500 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
//                 <div className="p-4 bg-emerald-900/20 border-b border-emerald-500/30 flex justify-between items-center">
//                   <div>
//                     <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><CheckCircle2 /> Lifecycle Verification</h2>
//                     <p className="text-xs text-slate-400">Provenance History for {searchQuery}</p>
//                   </div>
//                   <button onClick={() => setSackHistory(null)} className="p-1 hover:text-white text-slate-500"><X /></button>
//                 </div>
//                 <div className="p-6 overflow-y-auto space-y-6">
//                    {sackHistory.map((event, i) => (
//                      <div key={i} className="flex gap-4 relative">
//                         {/* Timeline Line */}
//                         {i !== sackHistory.length - 1 && <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-slate-700" />}
                        
//                         <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 z-10">
//                            {i === 0 ? <Box size={18} className="text-blue-400" /> : <MapPin size={18} className="text-emerald-400" />}
//                         </div>
//                         <div className="flex-1 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
//                            <div className="flex justify-between items-start mb-1">
//                               <span className="text-xs font-bold text-slate-200">{event.phase}</span>
//                               <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Block #{100 + parseInt(event.blockIndex)}</span>
//                            </div>
//                            <div className="text-xs text-slate-400 mb-1">{event.event}</div>
//                            <div className="flex justify-between items-center text-[10px] text-slate-500">
//                              <span>Weight: <span className="text-emerald-400">{event.weight_kg}kg</span></span>
//                              <span>{event.timestamp.split('T')[1].split('.')[0]}</span>
//                            </div>
//                         </div>
//                      </div>
//                    ))}
//                 </div>
//              </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* --- MODAL: OPERATOR TIMER --- */}
//       <AnimatePresence>
//         {pendingBatch && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
//              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
//                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
//                  <div>
//                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer className="animate-pulse" /> Batch Buffer Window</h2>
//                    <p className="text-sm text-slate-400">Time remaining to verify/edit data before Auto-Anchor.</p>
//                  </div>
//                  <div className="text-right">
//                     <div className="text-[10px] text-slate-500 uppercase">AUTO-ANCHOR IN</div>
//                     <div className="text-3xl font-mono text-white">{timeLeft}s</div>
//                  </div>
//                </div>

//                <div className={`flex-1 overflow-y-auto p-6 ${!isAuthority ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
//                  <table className="w-full text-left text-sm">
//                    <thead className="bg-slate-950 text-slate-400 sticky top-0">
//                      <tr><th className="p-3">Sack ID</th><th className="p-3">Event</th><th className="p-3">Weight (Kg)</th><th className="p-3">Quality</th></tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {pendingBatch.map((row, i) => (
//                        <tr key={i} className={`hover:bg-slate-800/50 ${row.isCorrection ? 'bg-yellow-900/10' : ''}`}>
//                          <td className="p-3 font-mono text-blue-300">
//                             {row.sack_id}
//                             {row.isCorrection && <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">CORRECTION</span>}
//                          </td>
//                          <td className="p-3">
//                            <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700 mr-2">{row.phase}</span>
//                            <span className="text-xs text-slate-500">{row.event}</span>
//                          </td>
//                          <td className="p-3">
//                            <input 
//                              type="number" 
//                              value={row.weight_kg} 
//                              onChange={(e) => updatePendingRow(i, 'weight_kg', parseFloat(e.target.value))}
//                              disabled={!isAuthority}
//                              className="bg-black border border-slate-600 rounded px-2 py-1 w-24 text-emerald-400 font-bold focus:border-blue-500 focus:outline-none disabled:opacity-50"
//                            />
//                          </td>
//                          <td className="p-3 text-slate-500">{row.quality}</td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>

//                <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-950 rounded-b-2xl">
//                  <div className="text-xs text-slate-500 italic">
//                    {isAuthority ? "You are logged in. You can edit weights or Anchor immediately." : "Waiting for timer..."}
//                  </div>
//                  <div className="flex gap-4">
//                    <button onClick={() => setPendingBatch(null)} disabled={!isAuthority} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white disabled:opacity-30">Discard</button>
//                    <button onClick={anchorBatch} disabled={!isAuthority} className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/50 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
//                      <UploadCloud size={20}/> ANCHOR NOW
//                    </button>
//                  </div>
//                </div>
//              </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* --- MODAL: INSPECTOR --- */}
//       <AnimatePresence>
//         {selectedBlock && viewMode && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
//              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
//                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
//                  <h2 className="font-bold text-white flex items-center gap-2">
//                    {viewMode === 'ui' && <><Database className="text-blue-500"/> Operational Data</>}
//                    {viewMode === 'ipfs' && <><HardDrive className="text-purple-500"/> IPFS Content</>}
//                  </h2>
//                  <button onClick={() => setSelectedBlock(null)}><X className="text-slate-500 hover:text-white" /></button>
//                </div>
               
//                <div className="p-6 overflow-y-auto font-mono text-xs">
//                  <table className="w-full text-left">
//                    <thead className="bg-slate-800 text-slate-400">
//                      <tr><th className="p-2">ID</th><th className="p-2">Event</th><th className="p-2">Weight</th><th className="p-2">Action</th></tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {(viewMode === 'ui' ? localDB[selectedBlock.index] : ipfsStorage[selectedBlock.ipfsCid])?.map((row, i) => (
//                        <tr key={i} className={row.isCorrection ? "bg-yellow-900/10" : ""}>
//                          <td className="p-2 text-blue-300">{row.sack_id}</td>
//                          <td className="p-2">{row.event}</td>
//                          <td className="p-2">{row.weight_kg}kg</td>
//                          <td className="p-2">
//                            {isAuthority && viewMode === 'ui' && (
//                              <button onClick={() => rectifyMistake(selectedBlock, row)} className="bg-slate-800 hover:bg-slate-700 text-yellow-500 px-2 py-1 rounded text-[10px] flex items-center gap-1">
//                                <History size={10}/> RECTIFY
//                              </button>
//                            )}
//                          </td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>
//              </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* --- MODAL: HACKER --- */}
//       <AnimatePresence>
//         {hackerMode && (
//           <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
//              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
//                <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
//                <div className="space-y-4">
//                  <div>
//                    <label className="text-xs text-slate-500">Target Batch Index (0-{blocks.length-1})</label>
//                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                      value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
//                  </div>
//                  <div>
//                    <label className="text-xs text-slate-500">Row Index (0-19)</label>
//                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                      value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
//                  </div>
//                  <div>
//                    <label className="text-xs text-slate-500">Inject Weight Value</label>
//                    <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
//                      value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
//                  </div>
//                  <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">
//                    EXECUTE INJECTION
//                  </button>
//                  <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
//                </div>
//              </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// };
// export default SupplyChainDashboard;





import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Database, Server, Link as LinkIcon, AlertTriangle, 
  Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
  Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
  User, UserCheck, Timer, History, Search, MapPin, 
  CheckCircle2, Box, Key
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
  // --- STATE ---
  const [blocks, setBlocks] = useState([]); 
  const [localDB, setLocalDB] = useState({}); 
  const [ipfsStorage, setIpfsStorage] = useState({});
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingBatch, setPendingBatch] = useState(null); 
  const [activeSackStates, setActiveSackStates] = useState({});
  
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAuthority, setIsAuthority] = useState(false);

  // Modals & Search
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [viewMode, setViewMode] = useState(null);
  const [hackerMode, setHackerMode] = useState(false);
  const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sackHistory, setSackHistory] = useState(null); 

  // Login Modal State
  const [showLogin, setShowLogin] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [loginError, setLoginError] = useState(false);

  const scrollRefUI = useRef(null);

  // --- CONFIG ---
  const BATCH_SIZE = 20;
  const TOTAL_SACKS = 100;
  const TIMER_DURATION = 15;
  const ACCESS_KEY = "admin"; // <--- THE PASSWORD

  // --- TOPOLOGY LOGIC ---
  const getNextPhase = (currentPhase) => {
    if (!currentPhase) return 'FARMER'; 
    switch (currentPhase) {
      case 'FARMER': return 'PPC'; 
      case 'PPC': return 'CMR';    
      case 'CMR': return Math.random() > 0.3 ? 'MLS' : 'WH'; 
      case 'WH': return 'MLS';     
      case 'MLS': return 'FPS';    
      case 'FPS': return 'CONSUMED'; 
      default: return 'PPC';
    }
  };

  // --- BATCH GENERATOR ---
  const generateBatch = () => {
    let newTransactions = [];
    let tempStates = { ...activeSackStates };

    for (let i = 0; i < BATCH_SIZE; i++) {
      const sackNum = Math.floor(Math.random() * TOTAL_SACKS) + 1;
      const sackId = `SK-${sackNum.toString().padStart(3, '0')}`;
      const currentPhase = tempStates[sackId] || null;
      
      if (currentPhase === 'CONSUMED') continue; 

      const nextPhase = getNextPhase(currentPhase);
      tempStates[sackId] = nextPhase;

      let evt = "UPDATE";
      if (nextPhase === 'PPC') evt = "SACK_CREATED";
      if (nextPhase === 'CMR') evt = "MILLING_START";
      if (nextPhase === 'WH') evt = "STOCK_IN";
      if (nextPhase === 'MLS') evt = "ALLOCATION";
      if (nextPhase === 'FPS') evt = "DISTRIBUTION";

      newTransactions.push({
        sack_id: sackId,
        phase: nextPhase,
        event: evt,
        weight_kg: 50.0,
        quality: 'Grade A',
        timestamp: new Date().toISOString(),
        isCorrection: false
      });
    }

    setPendingBatch(newTransactions);
    setActiveSackStates(tempStates);
    setIsPlaying(false);
    setTimeLeft(TIMER_DURATION);
  };

  useEffect(() => {
    let timer;
    if (pendingBatch && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (pendingBatch && timeLeft === 0) {
      anchorBatch();
    }
    return () => clearInterval(timer);
  }, [pendingBatch, timeLeft]);

  useEffect(() => {
    let interval;
    if (isPlaying && !pendingBatch) {
      interval = setInterval(generateBatch, 2000); 
    }
    return () => clearInterval(interval);
  }, [isPlaying, pendingBatch]);

  // --- ACTIONS ---
  const handleLogin = () => {
    if (isAuthority) {
      // Logout logic
      setIsAuthority(false);
      return;
    }
    // Show Login Modal
    setShowLogin(true);
    setLoginError(false);
    setInputKey('');
  };

  const submitLogin = () => {
    if (inputKey === ACCESS_KEY) {
      setIsAuthority(true);
      setShowLogin(false);
    } else {
      setLoginError(true);
    }
  };

  const updatePendingRow = (idx, field, value) => {
    if (!isAuthority) return;
    const updated = [...pendingBatch];
    updated[idx][field] = value;
    setPendingBatch(updated);
  };

  const anchorBatch = () => {
    if (!pendingBatch) return;

    const blockIndex = blocks.length;
    const prevHash = blockIndex > 0 ? blocks[blockIndex - 1].hash : "00000000";
    const fileContent = JSON.stringify(pendingBatch);
    const cid = `Qm${simpleHash(fileContent)}x${simpleHash(new Date().toISOString()).substring(0,6)}`;
    
    setIpfsStorage(prev => ({ ...prev, [cid]: pendingBatch }));
    setLocalDB(prev => ({ ...prev, [blockIndex]: JSON.parse(JSON.stringify(pendingBatch)) }));

    const newBlock = {
      index: blockIndex,
      timestamp: new Date().toISOString(),
      prevHash: prevHash,
      ipfsCid: cid,
      hash: simpleHash(cid + prevHash), 
      status: 'VALID'
    };

    setBlocks(prev => [...prev, newBlock]);
    setPendingBatch(null);
    setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const rectifyMistake = (oldBlock, row) => {
    if (!isAuthority) return;
    const correctionEntry = {
      sack_id: row.sack_id,
      phase: row.phase,
      event: `RECTIFY_BATCH_${oldBlock.index}`,
      weight_kg: 50.0, 
      quality: 'CORRECTED',
      timestamp: new Date().toISOString(),
      isCorrection: true
    };
    if (pendingBatch) {
      setPendingBatch(prev => [correctionEntry, ...prev]);
    } else {
      setPendingBatch([correctionEntry]);
      setTimeLeft(TIMER_DURATION);
    }
    setSelectedBlock(null);
  };

  const executeAttack = () => {
    const { blockIdx, rowIdx, val } = hackerTarget;
    if (!localDB[blockIdx]) return;
    const corruptedData = [...localDB[blockIdx]];
    if(corruptedData[rowIdx]) {
        corruptedData[rowIdx].weight_kg = parseFloat(val); 
        setLocalDB(prev => ({ ...prev, [blockIdx]: corruptedData }));
    }
    setHackerMode(false);
  };

  const checkIntegrity = (block) => {
    const localHash = simpleHash(JSON.stringify(localDB[block.index]));
    const ipfsHash = simpleHash(JSON.stringify(ipfsStorage[block.ipfsCid]));
    return localHash === ipfsHash;
  };

  // --- PDF GENERATOR ---
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("AgriFlow Audit Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Blocks Anchored: ${blocks.length}`, 14, 34);

    let yPos = 40;

    blocks.forEach((block) => {
      const dbRows = localDB[block.index] || [];
      
      doc.setFontSize(12);
      doc.setTextColor(0, 100, 255);
      doc.text(`Block #${100 + block.index} (Hash: ${block.hash.substring(0, 12)}...)`, 14, yPos);
      yPos += 8;

      const tableData = dbRows.map(row => [
        row.sack_id, 
        row.phase, 
        row.event, 
        `${row.weight_kg} kg`,
        row.timestamp.split('T')[1].split('.')[0]
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Sack ID', 'Phase', 'Event', 'Weight', 'Time']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 163, 74] },
      });

      yPos = doc.lastAutoTable.finalY + 15;
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
    });

    doc.save("AgriFlow_Audit_Report.pdf");
  };

  // --- SACK SEARCH ---
  const handleSearch = () => {
    if (!searchQuery) return;
    
    const history = [];
    Object.keys(localDB).forEach(blockIdx => {
      const rows = localDB[blockIdx];
      rows.forEach(row => {
        if (row.sack_id.toLowerCase() === searchQuery.toLowerCase()) {
          history.push({ ...row, blockIndex: blockIdx });
        }
      });
    });

    if (history.length > 0) {
      setSackHistory(history);
    } else {
      alert("Sack ID not found in current ledger.");
    }
  };

  const openModal = (block, type) => {
    setSelectedBlock(block);
    setViewMode(type);
  };

  return (
    <div className="h-screen bg-[#0c0f14] text-slate-200 p-4 font-sans flex flex-col overflow-hidden">
      
      {/* HEADER */}
      <header className="flex justify-between items-center mb-4 px-2 shrink-0 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent flex items-center gap-2">
            <Server size={24} className="text-blue-500" />
            AgriFlow Console
          </h1>
          <p className="text-xs text-slate-500">100 Sacks • Auto-Anchor (15s) • Rectification</p>
        </div>

        <div className="flex items-center gap-3">
           
           {/* SEARCH BAR */}
           <div className="flex items-center bg-black border border-slate-700 rounded-lg px-2 py-1.5 focus-within:border-blue-500">
             <input 
               className="bg-transparent border-none outline-none text-xs text-white w-24 placeholder-slate-600"
               placeholder="Check Sack ID"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
             />
             <button onClick={handleSearch} className="text-slate-500 hover:text-white"><Search size={14}/></button>
           </div>

           {/* LOGIN BUTTON */}
           <button 
             onClick={handleLogin} 
             className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${isAuthority ? 'bg-purple-600 border-purple-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
           >
              {isAuthority ? <UserCheck size={14} /> : <User size={14} />}
              {isAuthority ? "AUTHORITY" : "VIEWER"}
           </button>

           <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
             {!isPlaying && !pendingBatch ? (
               <button onClick={() => setIsPlaying(true)} className="p-2 hover:bg-emerald-600/20 text-emerald-400 rounded flex items-center gap-2">
                 <Play size={20} />
               </button>
             ) : (
               <button onClick={() => setIsPlaying(false)} className="p-2 hover:bg-yellow-600/20 text-yellow-400 rounded">
                 <Pause size={20} />
               </button>
             )}
             <button onClick={() => {setBlocks([]); setLocalDB({}); setIpfsStorage({}); setSackHistory(null);}} className="p-2 hover:bg-slate-600 text-slate-400 rounded border-l border-slate-700 ml-1">
               <RefreshCw size={20} />
             </button>
           </div>
           
           <button onClick={handleDownloadPDF} className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-2 rounded-lg" title="Download PDF Report">
             <FileText size={20} />
           </button>

           <button onClick={() => setHackerMode(true)} className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-800 px-3 py-2 rounded-lg">
             <Edit3 size={16} />
           </button>
        </div>
      </header>

      {/* COLUMNS */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0 overflow-hidden">
        
        {/* COL 1: OPERATIONAL CSV */}
        <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
           <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
             <Database size={16} className="text-blue-500" />
             <div className="flex-1">
               <h2 className="text-sm font-semibold text-slate-200">1. Operational CSV</h2>
               <p className="text-[10px] text-slate-500 uppercase">Local Mutable Storage</p>
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {blocks.map((block) => {
                const isValid = checkIntegrity(block);
                return (
                  <div 
                    key={block.index} 
                    className={`p-3 rounded-lg border text-xs cursor-pointer transition-colors group mb-3 ${isValid ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500' : 'bg-red-900/20 border-red-500'}`}
                    onClick={() => openModal(block, 'ui')}
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-slate-300">Batch #{block.index + 1}</span>
                      <span className="font-mono opacity-50">{localDB[block.index]?.length} Rows</span>
                    </div>
                    <div className="space-y-1">
                      {localDB[block.index]?.slice(0, 3).map((row, i) => (
                         <div key={i} className={`flex justify-between font-mono text-[10px] ${row.isCorrection ? 'text-yellow-400' : 'text-slate-500'}`}>
                           <span>{row.sack_id} {row.isCorrection && '(CORR)'}</span>
                           <span className={row.weight_kg !== 50 ? "text-red-400 font-bold" : ""}>{row.weight_kg}kg</span>
                         </div>
                      ))}
                      <div className="text-[10px] text-slate-600 italic mt-1">... +17 more</div>
                    </div>
                    {!isValid && <div className="mt-2 text-red-400 font-bold flex items-center gap-1"><AlertTriangle size={12}/> DATA CORRUPTED</div>}
                  </div>
                );
              })}
              <div ref={scrollRefUI} />
           </div>
        </div>

        {/* COL 2: IPFS STORAGE */}
        <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
           <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
             <HardDrive size={16} className="text-purple-500" />
             <div className="flex-1">
               <h2 className="text-sm font-semibold text-slate-200">2. IPFS Network</h2>
               <p className="text-[10px] text-slate-500 uppercase">Immutable File Snapshots</p>
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              {blocks.map((block) => (
                <div 
                  key={block.index} 
                  className="p-4 rounded-lg border bg-slate-950 border-slate-800 cursor-pointer hover:border-purple-500 hover:bg-purple-900/10 transition-all mb-3"
                  onClick={() => openModal(block, 'ipfs')}
                >
                   <div className="flex items-center justify-between mb-2">
                     <div className="flex items-center gap-2 text-purple-400">
                       <FileText size={14} />
                       <span className="text-xs font-bold">Snapshot_{block.index + 1}.json</span>
                     </div>
                     <Lock size={12} className="text-slate-600" />
                   </div>
                   <div className="bg-purple-900/20 p-2 rounded border border-purple-500/20">
                     <div className="text-[9px] text-purple-300 uppercase">CID</div>
                     <div className="font-mono text-[10px] text-slate-300 break-all">{block.ipfsCid}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* COL 3: BLOCKCHAIN */}
        <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-full overflow-hidden">
           <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
             <LinkIcon size={16} className="text-emerald-500" />
             <div className="flex-1">
               <h2 className="text-sm font-semibold text-slate-200">3. Ledger Anchors</h2>
               <p className="text-[10px] text-slate-500 uppercase">Proof of Existence</p>
             </div>
           </div>
           <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-800 -z-10" />
              {blocks.map((block) => {
                const isValid = checkIntegrity(block);
                return (
                  <div 
                    key={block.index} 
                    className={`ml-5 relative p-4 rounded-lg border cursor-pointer hover:scale-[1.01] transition-all mb-3 ${isValid ? 'bg-emerald-950/10 border-emerald-500/30' : 'bg-red-950/20 border-red-500/50'}`}
                    onClick={() => openModal(block, 'ledger')}
                  >
                    <div className={`absolute -left-[25px] top-6 w-3 h-3 rounded-full border-2 z-10 ${isValid ? 'bg-emerald-500 border-emerald-500' : 'bg-red-500 border-red-500'}`} />
                    <div className="flex justify-between items-center mb-2">
                       <span className={`text-xs font-bold px-2 py-0.5 rounded ${isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500 text-white'}`}>BLOCK #{100+block.index}</span>
                    </div>
                    <div className="space-y-2">
                       <div>
                         <div className="text-[9px] text-slate-500">HASH LINK</div>
                         <div className={`text-[10px] font-mono truncate ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>{block.hash}</div>
                       </div>
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>

      {/* --- MODAL: LOGIN --- */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
               <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center">
                 <Key size={32} />
                 <h2 className="text-xl font-bold">Authority Login</h2>
               </div>
               <p className="text-center text-slate-400 text-sm mb-6">Enter Access Key to enable Edit Mode.</p>
               
               <input 
                 type="password" 
                 autoFocus
                 className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white text-center tracking-widest outline-none focus:border-purple-500 transition-colors mb-2`}
                 placeholder="ACCESS KEY"
                 value={inputKey}
                 onChange={(e) => setInputKey(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
               />
               {loginError && <p className="text-red-500 text-xs text-center mb-4">Invalid Access Key. Try 'admin'.</p>}

               <div className="flex gap-2 mt-4">
                 <button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button>
                 <button onClick={submitLogin} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">Authenticate</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: SACK VERIFIER --- */}
      <AnimatePresence>
        {sackHistory && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSackHistory(null)}>
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-emerald-500 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-emerald-900/20 border-b border-emerald-500/30 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-bold text-emerald-400 flex items-center gap-2"><CheckCircle2 /> Lifecycle Verification</h2>
                    <p className="text-xs text-slate-400">Provenance History for {searchQuery}</p>
                  </div>
                  <button onClick={() => setSackHistory(null)} className="p-1 hover:text-white text-slate-500"><X /></button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                   {sackHistory.map((event, i) => (
                     <div key={i} className="flex gap-4 relative">
                        {i !== sackHistory.length - 1 && <div className="absolute left-[19px] top-8 bottom-[-24px] w-0.5 bg-slate-700" />}
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center shrink-0 z-10">
                           {i === 0 ? <Box size={18} className="text-blue-400" /> : <MapPin size={18} className="text-emerald-400" />}
                        </div>
                        <div className="flex-1 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                           <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-bold text-slate-200">{event.phase}</span>
                              <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">Block #{100 + parseInt(event.blockIndex)}</span>
                           </div>
                           <div className="text-xs text-slate-400 mb-1">{event.event}</div>
                           <div className="flex justify-between items-center text-[10px] text-slate-500">
                             <span>Weight: <span className="text-emerald-400">{event.weight_kg}kg</span></span>
                             <span>{event.timestamp.split('T')[1].split('.')[0]}</span>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: OPERATOR TIMER --- */}
      <AnimatePresence>
        {pendingBatch && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
                 <div>
                   <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer className="animate-pulse" /> Batch Buffer Window</h2>
                   <p className="text-sm text-slate-400">Time remaining to verify/edit data before Auto-Anchor.</p>
                 </div>
                 <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase">AUTO-ANCHOR IN</div>
                    <div className="text-3xl font-mono text-white">{timeLeft}s</div>
                 </div>
               </div>

               <div className={`flex-1 overflow-y-auto p-6 ${!isAuthority ? 'opacity-70 pointer-events-none grayscale-[0.5]' : ''}`}>
                 <table className="w-full text-left text-sm">
                   <thead className="bg-slate-950 text-slate-400 sticky top-0">
                     <tr><th className="p-3">Sack ID</th><th className="p-3">Event</th><th className="p-3">Weight (Kg)</th><th className="p-3">Quality</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800 text-slate-300">
                     {pendingBatch.map((row, i) => (
                       <tr key={i} className={`hover:bg-slate-800/50 ${row.isCorrection ? 'bg-yellow-900/10' : ''}`}>
                         <td className="p-3 font-mono text-blue-300">
                            {row.sack_id}
                            {row.isCorrection && <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">CORRECTION</span>}
                         </td>
                         <td className="p-3">
                           <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700 mr-2">{row.phase}</span>
                           <span className="text-xs text-slate-500">{row.event}</span>
                         </td>
                         <td className="p-3">
                           <input 
                             type="number" 
                             value={row.weight_kg} 
                             onChange={(e) => updatePendingRow(i, 'weight_kg', parseFloat(e.target.value))}
                             disabled={!isAuthority}
                             className="bg-black border border-slate-600 rounded px-2 py-1 w-24 text-emerald-400 font-bold focus:border-blue-500 focus:outline-none disabled:opacity-50"
                           />
                         </td>
                         <td className="p-3 text-slate-500">{row.quality}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-950 rounded-b-2xl">
                 <div className="text-xs text-slate-500 italic">
                   {isAuthority ? "You are logged in. You can edit weights or Anchor immediately." : "Waiting for timer..."}
                 </div>
                 <div className="flex gap-4">
                   <button onClick={() => setPendingBatch(null)} disabled={!isAuthority} className="px-6 py-3 rounded-lg text-slate-400 hover:text-white disabled:opacity-30">Discard</button>
                   <button onClick={anchorBatch} disabled={!isAuthority} className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/50 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
                     <UploadCloud size={20}/> ANCHOR NOW
                   </button>
                 </div>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: INSPECTOR --- */}
      <AnimatePresence>
        {selectedBlock && viewMode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
             <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                 <h2 className="font-bold text-white flex items-center gap-2">
                   {viewMode === 'ui' && <><Database className="text-blue-500"/> Operational Data</>}
                   {viewMode === 'ipfs' && <><HardDrive className="text-purple-500"/> IPFS Content</>}
                 </h2>
                 <button onClick={() => setSelectedBlock(null)}><X className="text-slate-500 hover:text-white" /></button>
               </div>
               
               <div className="p-6 overflow-y-auto font-mono text-xs">
                 <table className="w-full text-left">
                   <thead className="bg-slate-800 text-slate-400">
                     <tr><th className="p-2">ID</th><th className="p-2">Event</th><th className="p-2">Weight</th><th className="p-2">Action</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800 text-slate-300">
                     {(viewMode === 'ui' ? localDB[selectedBlock.index] : ipfsStorage[selectedBlock.ipfsCid])?.map((row, i) => (
                       <tr key={i} className={row.isCorrection ? "bg-yellow-900/10" : ""}>
                         <td className="p-2 text-blue-300">{row.sack_id}</td>
                         <td className="p-2">{row.event}</td>
                         <td className="p-2">{row.weight_kg}kg</td>
                         <td className="p-2">
                           {isAuthority && viewMode === 'ui' && (
                             <button onClick={() => rectifyMistake(selectedBlock, row)} className="bg-slate-800 hover:bg-slate-700 text-yellow-500 px-2 py-1 rounded text-[10px] flex items-center gap-1">
                               <History size={10}/> RECTIFY
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: HACKER --- */}
      <AnimatePresence>
        {hackerMode && (
          <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
               <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
               <div className="space-y-4">
                 <div>
                   <label className="text-xs text-slate-500">Target Batch Index (0-{blocks.length-1})</label>
                   <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                     value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
                 </div>
                 <div>
                   <label className="text-xs text-slate-500">Row Index (0-19)</label>
                   <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                     value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
                 </div>
                 <div>
                   <label className="text-xs text-slate-500">Inject Weight Value</label>
                   <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
                     value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
                 </div>
                 <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">
                   EXECUTE INJECTION
                 </button>
                 <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
               </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
export default SupplyChainDashboard;