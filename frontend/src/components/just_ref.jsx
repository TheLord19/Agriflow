// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable'; // Ensure this is imported
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box, Key, Truck, Factory, Sprout,
//   Activity, FileBadge, Layout, ShoppingCart, Microscope,
//   Menu, ArrowRightLeft, LogIn, LogOut
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
//   const [ipfsStorage, setIpfsStorage] = useState({});
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [pendingBatch, setPendingBatch] = useState(null); 
//   const [activeSackStates, setActiveSackStates] = useState({});
//   const [timeLeft, setTimeLeft] = useState(15);
//   const [isAuthority, setIsAuthority] = useState(false);

//   // --- LOCAL DB STATE ---
//   const [localTables, setLocalTables] = useState({
//     farmer: [],
//     ppc: [],
//     cmr: [],
//     warehouse: [],
//     fps: []
//   });

//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   // Modals & Search
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [viewMode, setViewMode] = useState(null); 
//   const [hackerMode, setHackerMode] = useState(false);
//   const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });

//   const [activePhaseWindow, setActivePhaseWindow] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState(null); 

//   // --- CERTIFICATE STATE ---
//   const [ipfsModalData, setIpfsModalData] = useState(null);
//   const [certRetrievalStep, setCertRetrievalStep] = useState(0); 
//   const [showCertDisplay, setShowCertDisplay] = useState(false);

//   // Login
//   const [showLogin, setShowLogin] = useState(false);
//   const [inputKey, setInputKey] = useState('');
//   const [loginError, setLoginError] = useState(false);

//   // Counter
//   const [sackCounter, setSackCounter] = useState(1000); 

//   const scrollRefUI = useRef(null);

//   // --- CONFIG ---
//   const BATCH_SIZE = 12;
//   const TIMER_DURATION = 15;
//   const ACCESS_KEY = "admin"; 

//   // --- TOPOLOGY LOGIC ---
//   const getNextPhase = (currentPhase) => {
//     // Round-Robin distribution for demo to ensure all tables get data
//     if (!currentPhase) return 'FARMER';
//     const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
//     const idx = phases.indexOf(currentPhase);
//     return phases[(idx + 1) % phases.length];
//   };

//   // --- SUB-STATUS UPDATER ---
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setLocalTables(prev => {
//         const next = { ...prev };
//         // Simulate CMR Work
//         next.cmr = next.cmr.map(row => {
//             if (row.status === 'IN_HOPPER' && Math.random() > 0.7) return { ...row, status: 'MILLING' };
//             if (row.status === 'MILLING' && Math.random() > 0.6) return { ...row, status: 'QC_PASSED' };
//             return row;
//         });
//         return next;
//       });
//     }, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   // --- BATCH GENERATOR (Distributes to ALL tables for demo visibility) ---
//   const generateBatch = () => {
//     let newTransactions = [];
//     let tempStates = { ...activeSackStates };
//     let tempDB = { ...localTables };
//     let currentCount = sackCounter;

//     const millNames = ["Sri Laxmi Rice Mill", "Balaji Agro", "Venkateshwara Tech", "Jyothi Industries"];
//     const farmerNames = ["Ramesh Kumar", "Suresh Reddy", "Mallesh Yadav", "K. Venkat"];
//     const truckPrefixes = ["TS07", "AP29", "MH04", "KA01"];

//     for (let i = 0; i < BATCH_SIZE; i++) {
//       currentCount++;
//       const sackId = `SK-${currentCount}`; 
//       const tokenNo = `TKN-2026-${Math.floor(Math.random() * 8999) + 1000}`;

//       // Determine Phase (Weighted random for realism + ensuring spread)
//       const r = Math.random();
//       let nextPhase = 'FARMER';
//       if (r > 0.2) nextPhase = 'PPC';
//       if (r > 0.4) nextPhase = 'CMR';
//       if (r > 0.6) nextPhase = 'WH';
//       if (r > 0.8) nextPhase = 'FPS';

//       tempStates[sackId] = nextPhase;

//       let evt = "UPDATE";
//       let status = "PENDING";
//       let entity = "Admin";
//       let truck = "N/A";

//       // Populate DBs
//       if (nextPhase === 'FARMER') {
//           evt = "HARVEST_LOG";
//           entity = farmerNames[Math.floor(Math.random() * farmerNames.length)];
//           tempDB.farmer.push({ sack_id: sackId, farmer: entity, crop: "Paddy - Grade A", date: new Date().toISOString().split('T')[0], status: "HARVESTED" });
//       }
//       else if (nextPhase === 'PPC') { 
//           evt = "SACK_CREATED"; 
//           status = "WEIGHING"; 
//           entity = "PPC Centre 04";
//           tempDB.ppc.push({ token_no: tokenNo, sack_id: sackId, status: "WEIGHING", weight: (50 + Math.random()).toFixed(2), entity_name: entity, truck_no: truck });
//       }
//       else if (nextPhase === 'CMR') { 
//           evt = "MILLING_START"; 
//           status = "IN_HOPPER"; 
//           entity = millNames[Math.floor(Math.random() * millNames.length)];
//           truck = `${truckPrefixes[Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 9999)}`;
//           tempDB.cmr.push({ batch: tokenNo, mill: entity, truck: truck, status: "IN_HOPPER", sack_id: sackId });
//       }
//       else if (nextPhase === 'WH') { 
//           evt = "STOCK_IN"; 
//           status = "STORED"; 
//           entity = "Central Warehouse";
//           tempDB.warehouse.push({ slot: `SLOT-${Math.floor(Math.random()*100)}`, sack_id: sackId, status: "STORED", token_no: tokenNo });
//       }
//       else if (nextPhase === 'FPS') { 
//           evt = "DISTRIBUTION"; 
//           status = "ACTIVE"; 
//           entity = "FPS Shop #102";
//           tempDB.fps.push({ shop_id: "FPS-102", sack_id: sackId, status: "AVAILABLE", token_no: tokenNo });
//       }

//       newTransactions.push({
//         sack_id: sackId,        
//         token_no: tokenNo,      
//         phase: nextPhase,
//         event: evt,
//         weight_kg: 50.0,
//         quality: 'Grade A',
//         timestamp: new Date().toISOString(),
//         isCorrection: false,
//         entity_name: entity,
//         truck_no: truck,
//         status: status,
//         ipfsRef: `Qm${simpleHash(sackId + evt).substring(0, 16)}...`
//       });
//     }

//     setSackCounter(currentCount); 
//     setPendingBatch(newTransactions);
//     setActiveSackStates(tempStates);
//     setLocalTables(tempDB); 
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
//   const handleLoginToggle = () => {
//     if (isAuthority) {
//       setIsAuthority(false);
//     } else {
//       setShowLogin(true);
//       setLoginError(false);
//       setInputKey('');
//     }
//   };

//   const submitLogin = () => {
//     if (inputKey === ACCESS_KEY) {
//       setIsAuthority(true);
//       setShowLogin(false);
//     } else {
//       setLoginError(true);
//     }
//   };

//   const updatePendingRow = (idx, field, value) => {
//     if (!isAuthority) return; 
//     const u = [...pendingBatch];
//     u[idx][field] = value;
//     setPendingBatch(u);
//   };

//   const anchorBatch = () => {
//     if (!pendingBatch) return;
//     const blockIndex = blocks.length;
//     const prevHash = blockIndex > 0 ? blocks[blockIndex - 1].hash : "00000000";
//     const cid = `Qm${simpleHash(JSON.stringify(pendingBatch))}x${simpleHash(new Date().toISOString()).substring(0,6)}`;

//     setIpfsStorage(prev => ({ ...prev, [cid]: pendingBatch }));
//     const newBlock = { index: blockIndex, timestamp: new Date().toISOString(), prevHash, ipfsCid: cid, hash: simpleHash(cid + prevHash), status: 'VALID' };
//     setBlocks(prev => [...prev, newBlock]);
//     setPendingBatch(null);
//     setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//   };

//   const rectifyMistake = (oldBlock, row) => {
//     if (!isAuthority) {
//         alert("ACCESS DENIED: Only Authorized Personnel can Rectify data.");
//         return;
//     }
//     alert("Correction Proposal Submitted to Consensus Layer.");
//   };

//   const executeAttack = () => {
//     const { blockIdx, rowIdx, val } = hackerTarget;
//     if (blocks[blockIdx]) {
//         alert("INJECTION ATTACK SIMULATED: Data in local memory corrupted.");
//         setHackerMode(false);
//     }
//   };

//   const checkIntegrity = (block) => true; 

//   // --- PDF DOWNLOAD (Functional) ---
//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(18);
//     doc.text("AgriFlow - Hybrid Ledger Audit Report", 14, 20);
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

//     let yPos = 40;
//     blocks.forEach((block) => {
//         doc.setFontSize(12);
//         doc.setTextColor(0, 50, 200);
//         doc.text(`Block #${100 + block.index} (Hash: ${block.hash.substring(0,10)}...)`, 14, yPos);

//         const rows = ipfsStorage[block.ipfsCid] || [];
//         const tableData = rows.map(r => [r.sack_id, r.phase, r.event, r.weight_kg]);

//         autoTable(doc, {
//             startY: yPos + 5,
//             head: [['Sack ID', 'Phase', 'Event', 'Weight']],
//             body: tableData,
//             theme: 'grid'
//         });
//         yPos = doc.lastAutoTable.finalY + 15;
//     });

//     doc.save("Audit_Report.pdf");
//   };

//   const handleIntegrityCheck = () => {
//     if (!searchQuery) return;
//     const history = [];
//     blocks.forEach(block => {
//         const batchData = ipfsStorage[block.ipfsCid];
//         if (batchData) {
//             batchData.forEach(tx => {
//                 if (tx.sack_id && tx.sack_id.toLowerCase() === searchQuery.toLowerCase()) {
//                     history.push({ ...tx, blockIdx: block.index });
//                 }
//             });
//         }
//     });
//     if (history.length > 0) setSearchResult(history);
//     else alert(`Sack ${searchQuery} not found in Immutable Ledger.`);
//   };

//   const handleRetrieveCert = () => {
//     setCertRetrievalStep(1); 
//     setTimeout(() => setCertRetrievalStep(2), 1500); 
//     setTimeout(() => setCertRetrievalStep(3), 3000); 
//     setTimeout(() => { setCertRetrievalStep(0); setShowCertDisplay(true); }, 4500);
//   };

//   const openModal = (block, type) => { setSelectedBlock(block); setViewMode(type); };

//   // --- SIDEBAR COMPONENT ---
//   const SidebarItem = ({ icon, label, onClick, count }) => (
//     <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
//         {icon}
//         {sidebarOpen && (
//             <div className="flex-1 flex justify-between items-center text-sm font-medium">
//                 <span>{label}</span>
//                 {count !== undefined && <span className="bg-slate-800 border border-slate-700 text-xs px-2 py-0.5 rounded-full">{count}</span>}
//             </div>
//         )}
//     </div>
//   );

//   return (
//     <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden">

//       {/* 1. SIDEBAR */}
//       <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
//         <div className="flex justify-between items-center mb-6 px-1">
//             {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500"/> HYBRID LEDGER</span>}
//             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18}/></button>
//         </div>
//         <div className="space-y-6 flex-1 overflow-y-auto">
//             <div>
//                 {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">Operations</div>}
//                 <SidebarItem icon={<Sprout size={20} className="text-green-500"/>} label="Farmer Harvests" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-orange-500"/>} label="PPC Procurement" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-blue-500"/>} label="Rice Mills (CMR)" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
//                 <SidebarItem icon={<Box size={20} className="text-cyan-500"/>} label="Central Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
//                 <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500"/>} label="FPS Distribution" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
//             </div>
//             <div>
//                 {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">System</div>}
//                 <SidebarItem icon={<Database size={20}/>} label="Operational DB" onClick={() => alert("Active DB Connection: Healthy")} />
//                 <SidebarItem icon={<HardDrive size={20}/>} label="IPFS Nodes" onClick={() => alert("IPFS Swarm: 45 Peers Connected")} />
//             </div>
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* 2. HEADER */}
//         <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
//             <h2 className="text-lg font-bold text-white flex items-center gap-2">
//                 {!sidebarOpen && <Server size={20} className="text-blue-500" />} 
//                 Dashboard Console
//             </h2>

//             <div className="flex items-center gap-4">
//                 <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
//                     <ShieldCheck size={14} className="text-emerald-500 mr-2"/>
//                     <input 
//                         className="bg-transparent border-none outline-none text-xs text-white w-48 placeholder-slate-600 font-mono"
//                         placeholder="Verify Sack ID (e.g. SK-1005)"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         onKeyDown={(e) => e.key === 'Enter' && handleIntegrityCheck()}
//                     />
//                     <button onClick={handleIntegrityCheck} className="text-slate-500 hover:text-white"><Search size={14}/></button>
//                 </div>

//                 <div className="h-6 w-px bg-slate-700"></div>

//                 <div className="flex gap-2">
//                     <button 
//                         onClick={handleLoginToggle} 
//                         className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${
//                             isAuthority 
//                             ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50' 
//                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
//                         }`}
//                     >
//                         {isAuthority ? <><UserCheck size={14} /> AUTHORITY ACCESS</> : <><LogIn size={14}/> VIEWER LOGIN</>}
//                     </button>

//                     {!isPlaying && !pendingBatch ? 
//                         <button onClick={() => setIsPlaying(true)} className="p-1.5 text-emerald-400 bg-emerald-900/20 border border-emerald-900 rounded hover:bg-emerald-900/40"><Play size={16}/></button> :
//                         <button onClick={() => setIsPlaying(false)} className="p-1.5 text-yellow-400 bg-yellow-900/20 border border-yellow-900 rounded hover:bg-yellow-900/40"><Pause size={16}/></button>
//                     }

//                     <button onClick={() => setHackerMode(true)} className="p-1.5 text-red-400 bg-red-900/20 border border-red-900 rounded hover:bg-red-900/40"><Edit3 size={16}/></button>

//                     {/* DOWNLOAD PDF BUTTON */}
//                     <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="Download Audit Report">
//                         <FileText size={16}/>
//                     </button>
//                 </div>
//             </div>
//         </header>

//         {/* 3. MAIN GRID */}
//         <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">

//              {/* Col 1: Operational CSV */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <Database size={16} className="text-blue-500" /> <span className="text-sm font-semibold">Operational CSV</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ui')} className="p-3 rounded border border-slate-800 bg-slate-900/50 hover:border-blue-500 cursor-pointer">
//                              <div className="flex justify-between text-xs font-bold text-slate-300"><span>Batch #{block.index + 1}</span> <span>{ipfsStorage[block.ipfsCid]?.length || 0} Rows</span></div>
//                          </div>
//                      ))}
//                      <div ref={scrollRefUI} />
//                  </div>
//              </div>

//              {/* Col 2: IPFS Storage */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <HardDrive size={16} className="text-purple-500" /> <span className="text-sm font-semibold">IPFS Network</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ipfs')} className="p-3 rounded border border-slate-800 bg-slate-900/50 hover:border-purple-500 cursor-pointer flex justify-between items-center">
//                              <div className="flex items-center gap-2 text-xs text-purple-400"><FileText size={14}/> <span>Snapshot_{block.index}.json</span></div>
//                              <Lock size={12} className="text-slate-600"/>
//                          </div>
//                      ))}
//                  </div>
//              </div>

//              {/* Col 3: Ledger Anchors */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <LinkIcon size={16} className="text-emerald-500" /> <span className="text-sm font-semibold">Ledger Anchors</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative">
//                      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ledger')} className="ml-4 relative p-3 rounded border border-slate-800 bg-emerald-900/10 hover:border-emerald-500 cursor-pointer">
//                              <div className="absolute -left-[21px] top-4 w-2 h-2 rounded-full bg-emerald-500"></div>
//                              <div className="text-[10px] text-emerald-400 font-mono">HASH: {block.hash.substring(0,20)}...</div>
//                          </div>
//                      ))}
//                  </div>
//              </div>
//         </div>
//       </div>

//       {/* ================= MODALS ================= */}

//       {/* 1. PHASE MONITOR WINDOW */}
//       <AnimatePresence>
//         {activePhaseWindow && (
//             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10" onClick={() => setActivePhaseWindow(null)}>
//                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                     <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
//                         <div className="flex items-center gap-3">
//                             <Activity className="text-blue-400 animate-pulse"/>
//                             <h2 className="text-lg font-bold text-white">Live Phase Monitor: <span className="text-blue-400">{activePhaseWindow}</span></h2>
//                         </div>
//                         <button onClick={() => setActivePhaseWindow(null)}><X className="text-slate-400 hover:text-white"/></button>
//                     </div>
//                     <div className="flex-1 overflow-auto p-4">
//                         <table className="w-full text-left text-xs text-slate-300">
//                             <thead className="bg-slate-950 text-slate-500 uppercase">
//                                 <tr>
//                                     <th className="p-3">Ref ID</th>
//                                     <th className="p-3">Entity</th>
//                                     <th className="p-3">Status</th>
//                                     <th className="p-3">Timestamp</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-800">
//                                 {/* Query the Local Table for this Phase */}
//                                 {(localTables[activePhaseWindow.toLowerCase()] || []).map((row, i) => (
//                                     <tr key={i} className="hover:bg-slate-800">
//                                         <td className="p-3 font-mono text-blue-300">{row.sack_id || row.batch || row.token_no}</td>
//                                         <td className="p-3">{row.mill || row.farmer || row.shop_id || "Facility"}</td>
//                                         <td className="p-3">
//                                             <span className={`px-2 py-1 rounded font-bold text-[10px] ${
//                                                 row.status?.includes('PASSED') ? 'bg-green-900 text-green-400' : 
//                                                 row.status?.includes('MILLING') ? 'bg-blue-900 text-blue-400' : 
//                                                 'bg-yellow-900 text-yellow-400'
//                                             }`}>
//                                                 {row.status}
//                                             </span>
//                                         </td>
//                                         <td className="p-3 text-slate-500">{new Date().toLocaleTimeString()}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         {localTables[activePhaseWindow.toLowerCase()]?.length === 0 && (
//                             <div className="text-center p-10 text-slate-500 italic">No active assets in this phase.</div>
//                         )}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 2. INSPECTOR MODAL */}
//       <AnimatePresence>
//         {selectedBlock && viewMode && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
//              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
//                   <h2 className="font-bold text-white flex items-center gap-2"><Database className="text-blue-500"/> Block Inspector</h2>
//                   <button onClick={() => setSelectedBlock(null)}><X className="text-slate-500"/></button>
//                </div>
//                <div className="p-6 overflow-y-auto font-mono text-xs">
//                  <table className="w-full text-left">
//                    <thead className="bg-slate-800 text-slate-400">
//                      <tr>
//                         <th className="p-3">Sack ID</th>
//                         <th className="p-3">Token Ref</th>
//                         <th className="p-3">Entity (Mill/Farmer)</th>
//                         <th className="p-3">Truck No</th>
//                         <th className="p-3">Status</th>
//                         <th className="p-3">Weight</th>
//                         <th className="p-3">Docs</th>
//                      </tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {/* FIX: Ensure we read the correct data array based on viewMode */}
//                      {(ipfsStorage[selectedBlock.ipfsCid])?.slice(0, 50).map((row, i) => (
//                        <tr key={i} className={row.isCorrection ? "bg-yellow-900/10" : ""}>
//                          <td className="p-3 text-emerald-400 font-bold text-sm">{row.sack_id}</td>
//                          <td className="p-3 text-slate-500">{row.token_no}</td>
//                          <td className="p-3 flex items-center gap-2"><Factory size={12} className="text-orange-400"/> {row.entity_name}</td>
//                          <td className="p-3 text-slate-400"><Truck size={12} className="inline mr-1"/> {row.truck_no}</td>
//                          <td className="p-3"><span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{row.status}</span></td>
//                          <td className="p-3 flex items-center gap-2">
//                             {row.weight_kg}kg
//                             {isAuthority && viewMode === 'ui' && (
//                                 <button onClick={() => rectifyMistake(selectedBlock, row)} className="bg-yellow-900/40 text-yellow-500 px-1 rounded hover:bg-yellow-900 border border-yellow-700">FIX</button>
//                             )}
//                          </td>
//                          <td className="p-3">
//                              <button onClick={() => setIpfsModalData(row)} className="text-indigo-400 border border-indigo-900 bg-indigo-500/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-500/20">
//                                  <FileBadge size={12} /> Cert
//                              </button>
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

//       {/* 3. INTEGRITY CHECK RESULT MODAL */}
//       <AnimatePresence>
//         {searchResult && (
//             <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSearchResult(null)}>
//                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-emerald-500 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl p-6" onClick={e => e.stopPropagation()}>
//                     <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
//                         <div>
//                             <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><ShieldCheck/> Integrity Verification</h2>
//                             <p className="text-sm text-slate-400">Provenance History for {searchQuery}</p>
//                         </div>
//                         <button onClick={() => setSearchResult(null)}><X className="text-slate-500 hover:text-white"/></button>
//                     </div>
//                     <div className="space-y-4 overflow-y-auto">
//                         {searchResult.map((tx, i) => (
//                             <div key={i} className="flex gap-4 relative">
//                                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center text-emerald-400 z-10 font-bold">{i+1}</div>
//                                 {i !== searchResult.length - 1 && <div className="absolute left-5 top-10 bottom-[-16px] w-px bg-slate-700"/>}
//                                 <div className="flex-1 bg-slate-800/50 p-3 rounded border border-slate-700">
//                                     <div className="flex justify-between">
//                                         <span className="font-bold text-white text-sm">{tx.phase}</span>
//                                         <span className="text-[10px] text-slate-500">{tx.timestamp}</span>
//                                     </div>
//                                     <div className="text-xs text-slate-400 mt-1">{tx.event}</div>
//                                     <div className="text-xs text-blue-400 mt-1 font-mono">Block #{100 + tx.blockIdx}</div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 4. IPFS POPUP */}
//       <AnimatePresence>
//         {ipfsModalData && (
//           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
//             <div className="absolute inset-0 pointer-events-auto" onClick={() => {if(certRetrievalStep === 0) setIpfsModalData(null)}}></div>
//             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-indigo-500 shadow-2xl rounded-xl w-80 p-5 pointer-events-auto relative overflow-hidden">
//                {certRetrievalStep > 0 && (
//                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10 space-y-3">
//                        <RefreshCw className="animate-spin text-indigo-500" size={32} />
//                        <div className="text-xs font-mono text-indigo-300">
//                            {certRetrievalStep === 1 && "Finding Peers..."}
//                            {certRetrievalStep === 2 && "Downloading Chunks..."}
//                            {certRetrievalStep === 3 && "Decrypting Content..."}
//                        </div>
//                    </div>
//                )}
//                <div className="flex items-center gap-3 mb-4">
//                   <div className="bg-indigo-500/20 p-2 rounded text-indigo-400"><HardDrive size={20}/></div>
//                   <div><h3 className="font-bold text-white text-sm">IPFS Metadata</h3><p className="text-[10px] text-slate-400">Decentralized Storage</p></div>
//                </div>
//                <div className="space-y-3 text-xs">
//                   <div className="bg-black p-3 rounded border border-slate-800">
//                      <div className="flex justify-between mb-1"><span className="text-slate-500">Target:</span> <span className="text-blue-400 font-mono">{ipfsModalData.sack_id}</span></div>
//                      <div className="flex justify-between"><span className="text-slate-500">File:</span> <span className="text-slate-300">Quality_Cert.pdf</span></div>
//                   </div>
//                   <div className="font-mono text-[10px] text-indigo-300 break-all bg-indigo-900/10 p-2 rounded border border-indigo-500/20">CID: {ipfsModalData.ipfsRef}</div>
//                   <button onClick={handleRetrieveCert} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 mt-2">
//                      <UploadCloud size={14}/> Retrieve File
//                   </button>
//                </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 5. DIGITAL CERTIFICATE */}
//       <AnimatePresence>
//           {showCertDisplay && ipfsModalData && (
//               <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setShowCertDisplay(false)}>
//                   <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
//                       <button onClick={() => setShowCertDisplay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
//                       <div className="border-4 border-double border-slate-300 p-6 text-center">
//                           <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600"/></div>
//                           <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">QUALITY CERTIFICATE</h1>
//                           <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Blockchain Ledger</p>
//                           <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded">
//                               <p><strong>This certifies that the produce:</strong></p>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Item ID:</span> <b>{ipfsModalData.sack_id}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Ref Batch:</span> <b>{ipfsModalData.token_no}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Origin Entity:</span> <b>{ipfsModalData.entity_name}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Quality Grade:</span> <b className="text-emerald-600">GRADE A (Premium)</b></div>
//                           </div>
//                           <div className="mt-8 flex justify-between items-end">
//                               <div className="text-center">
//                                   <div className="font-dancing-script text-xl text-blue-600 mb-1">BlockchainAuth</div>
//                                   <div className="border-t border-slate-400 w-32 text-[10px] text-slate-500">Digital Signature</div>
//                               </div>
//                               <div className="w-16 h-16 bg-black p-1"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ipfsModalData.ipfsRef}`} alt="QR" /></div>
//                           </div>
//                       </div>
//                   </motion.div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 6. LOGIN MODAL */}
//       <AnimatePresence>
//         {showLogin && (
//           <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
//                <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Authority Login</h2></div>
//                <p className="text-center text-slate-400 text-sm mb-6">Enter Access Key to enable Edit Mode.</p>
//                <input 
//                  type="password" 
//                  autoFocus
//                  className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white text-center tracking-widest outline-none focus:border-purple-500 transition-colors mb-2`}
//                  placeholder="ACCESS KEY"
//                  value={inputKey}
//                  onChange={(e) => setInputKey(e.target.value)}
//                  onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
//                />
//                {loginError && <p className="text-red-500 text-xs text-center mb-4">Invalid Access Key. Try 'admin'.</p>}
//                <div className="flex gap-2 mt-4">
//                  <button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button>
//                  <button onClick={submitLogin} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">Authenticate</button>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 7. PENDING BATCH MODAL */}
//       <AnimatePresence>
//         {pendingBatch && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
//                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
//                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer className="animate-pulse" /> Batch Buffer Window</h2>
//                  <div className="text-right"><div className="text-[10px] text-slate-500 uppercase">AUTO-ANCHOR IN</div><div className="text-3xl font-mono text-white">{timeLeft}s</div></div>
//                </div>
//                <div className="flex-1 overflow-y-auto p-6">
//                  {!isAuthority && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-2 mb-4 text-xs text-center rounded">READ-ONLY MODE: Log in as Authority to edit weights.</div>}
//                  <table className="w-full text-left text-sm text-slate-300">
//                    <thead className="bg-slate-950 text-slate-500 sticky top-0">
//                      <tr><th className="p-3">Sack ID</th><th className="p-3">Event</th><th className="p-3">Weight (Kg)</th><th className="p-3">Quality</th></tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {pendingBatch.map((row, i) => (
//                        <tr key={i} className={`hover:bg-slate-800/50 ${row.isCorrection ? 'bg-yellow-900/10' : ''}`}>
//                          <td className="p-3 font-mono text-blue-300">
//                            {row.sack_id}
//                            {row.isCorrection && <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">CORRECTION</span>}
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
//                              className={`w-20 p-1 border rounded ${!isAuthority ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-black border-slate-600 text-white'}`}
//                            />
//                          </td>
//                          <td className="p-3 text-slate-500">{row.quality}</td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>
//                <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-950 rounded-b-2xl">
//                  <button onClick={() => setPendingBatch(null)} disabled={!isAuthority} className="px-6 py-3 text-slate-400 disabled:opacity-50">Discard</button>
//                  <button onClick={anchorBatch} disabled={!isAuthority} className="px-8 py-3 bg-blue-600 text-white rounded-lg flex gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"><UploadCloud/> ANCHOR</button>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 8. HACKER MODAL */}
//       <AnimatePresence>
//         {hackerMode && (
//           <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
//               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
//                 <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="text-xs text-slate-500">Target Batch Index (0-{blocks.length-1})</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Row Index (0-19)</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Inject Weight Value</label>
//                     <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
//                       value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
//                   </div>
//                   <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">
//                     EXECUTE INJECTION
//                   </button>
//                   <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
//                 </div>
//               </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// };
// export default SupplyChainDashboard;


















// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import axios from 'axios';
// import io from 'socket.io-client';
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box, Key, Truck, Factory, Sprout,
//   Activity, FileBadge, Layout, ShoppingCart, Microscope,
//   Menu, ArrowRightLeft, LogIn, LogOut, Minus,
//   FileJson, Code, Layers, AlertOctagon
// } from 'lucide-react';

// // --- DYNAMIC SOCKET CONNECTION ---
// const socket = io(`http://${window.location.hostname}:4001`, {
//     transports: ['websocket'],
//     reconnection: true
// });

// const handleManualAnchor = async () => {
//       if (!isAuthority) return;
//       try {
//           await axios.post('/api/mine');
//       } catch (e) {
//           console.error("Mining failed", e);
//       }
//   };

// const SupplyChainDashboard = () => {
//   // --- STATE ---
//   const [blocks, setBlocks] = useState([]); 
//   const [ipfsStorage, setIpfsStorage] = useState({});
//   const [pendingBatch, setPendingBatch] = useState([]); 

//   // SERVER SYNCED TIMER (Default 15s)
//   const [timeLeft, setTimeLeft] = useState(15);
//   const [isPlaying, setIsPlaying] = useState(false);

//   // Auth State
//   const [isAuthority, setIsAuthority] = useStxate(false);
//   const [showLogin, setShowLogin] = useState(false);
//   const [inputKey, setInputKey] = useState('');
//   const [loginError, setLoginError] = useState(false);

//   const [isChainBroken, setIsChainBroken] = useState(false);
//   const [isConnected, setIsConnected] = useState(socket.connected);

//   // Data Tables
//   const [localTables, setLocalTables] = useState({
//     farmer: [], ppc: [], cmr: [], warehouse: [], fps: []
//   });

//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isBatchMinimized, setIsBatchMinimized] = useState(false);

//   // Modals
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [viewMode, setViewMode] = useState(null); 
//   const [hackerMode, setHackerMode] = useState(false);
//   const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
//   const [activePhaseWindow, setActivePhaseWindow] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState(null);

//   // Certificate
//   const [ipfsModalData, setIpfsModalData] = useState(null);
//   const [certRetrievalStep, setCertRetrievalStep] = useState(0); 
//   const [showCertDisplay, setShowCertDisplay] = useState(false);

//   const scrollRefUI = useRef(null);
//   const ACCESS_KEY = "admin"; 

//   // --- 1. REAL-TIME LISTENERS ---
//   useEffect(() => {
//     // Initial Check
//     if (socket.connected) setIsConnected(true);

//     const onConnect = () => setIsConnected(true);
//     const onDisconnect = () => setIsConnected(false);

//     // 1. SYNC TIMER (Controlled by Server)
//     const onTimerTick = (serverTime) => {
//         setTimeLeft(serverTime);
//     };

//     // 2. NEW DATA (Opens the Pending Window)
//     const onNewData = (row) => {
//         setPendingBatch(prev => {
//              // Avoid duplicates
//              if(prev.find(r => (r.id === row.id && r.id) || (r.sack_id === row.sack_id && r.sack_id))) return prev;
//              return [row, ...prev];
//         });

//         // Update Local Tables
//         setLocalTables(prev => {
//             const table = row.phase.toLowerCase();
//             const target = table === 'wh' ? 'warehouse' : table;
//             if (prev[target] || target === 'warehouse') {
//                 const currentList = prev[target] || [];
//                 return { ...prev, [target]: [...currentList, row] };
//             }
//             return prev;
//         });
//     };

//     // 3. BLOCK MINED (Closes Pending Window)
//     const onBlockMined = (block) => {
//         setBlocks(prev => [block, ...prev]);
//         setIpfsStorage(prev => ({ ...prev, [block.ipfsCid]: block.data }));

//         // CLEAR PENDING BATCH (Window Disappears)
//         setPendingBatch([]); 
//         setIsBatchMinimized(false);

//         setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//     };

//     socket.on('connect', onConnect);
//     socket.on('disconnect', onDisconnect);
//     socket.on('timer_tick', onTimerTick);
//     socket.on('new_data', onNewData);
//     socket.on('block_mined', onBlockMined);

//     return () => { 
//         socket.off('connect', onConnect);
//         socket.off('disconnect', onDisconnect);
//         socket.off('timer_tick', onTimerTick); 
//         socket.off('new_data', onNewData); 
//         socket.off('block_mined', onBlockMined); 
//     };
//   }, []);

//   // --- 2. DATA GENERATOR ---
//   const generateBatch = async () => {
//     if (isChainBroken) return;
//     if (!socket.connected) return;

//     const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
//     const phase = phases[Math.floor(Math.random() * phases.length)];

//     let payload = {};

//     // Generate Random Data
//     if (phase === 'FARMER') {
//         payload = { id: `TX-${Math.floor(Math.random()*9000)+1000}`, entity: ["Ramesh Kumar", "Suresh Reddy"][Math.floor(Math.random()*2)], quality: "Grade A", weight: (Math.random()*5000).toFixed(2), status: "HARVESTED" };
//     } else if (phase === 'PPC') {
//         payload = { sack_id: `SK-${Math.floor(Math.random()*90000)+10000}`, entity: "PPC Centre 04", weight: 50.00, status: "WEIGHED" };
//     } else if (phase === 'CMR') {
//          payload = { sack_id: `SK-${Math.floor(Math.random()*90000)+10000}`, entity: "Sri Laxmi Mills", status: "MILLED" };
//     } else if (phase === 'WH') {
//          payload = { sack_id: `SK-${Math.floor(Math.random()*90000)+10000}`, entity: "Central Zone Warehouse", status: "STORED" };
//     } else if (phase === 'FPS') {
//          payload = { entity: "FPS-102 (Ration Shop)", token_no: `ALLOC-${Math.floor(Math.random()*500)}`, status: "DISTRIBUTED" };
//     }

//     try { 
//         await axios.post('/api/ingest', { phase, data: payload });
//     } catch (e) { console.error("Backend Error:", e); }
//   };

//   useEffect(() => {
//     let interval;
//     if (isPlaying && !isChainBroken) interval = setInterval(generateBatch, 2500); // Slightly slower generation
//     return () => clearInterval(interval);
//   }, [isPlaying, isChainBroken]);

//   // --- ACTIONS ---
//   const handleLoginToggle = () => { 
//       if (isAuthority) setIsAuthority(false); 
//       else { setShowLogin(true); setLoginError(false); setInputKey(''); } 
//   };

//   const submitLogin = () => { 
//       if (inputKey === ACCESS_KEY) { setIsAuthority(true); setShowLogin(false); } 
//       else { setLoginError(true); } 
//   };

//   const executeAttack = () => { 
//       const targetBlock = blocks.find(b => b.index === hackerTarget.blockIdx);
//       if(!targetBlock) { alert("Block not found!"); return; }
//       const cid = targetBlock.ipfsCid;
//       const originalData = ipfsStorage[cid];
//       if(!originalData) return;
//       const corruptedData = JSON.parse(JSON.stringify(originalData));

//       if(corruptedData[hackerTarget.rowIdx]) {
//           corruptedData[hackerTarget.rowIdx].weight = parseFloat(hackerTarget.val);
//           corruptedData[hackerTarget.rowIdx].isTampered = true;
//       }
//       setIpfsStorage(prev => ({...prev, [cid]: corruptedData}));
//       setIsChainBroken(true); setIsPlaying(false); setHackerMode(false); 
//   };

//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     doc.text("AgriFlow Supply Chain - Audit Report", 14, 20);

//     let yPos = 40;
//     blocks.forEach(block => {
//         doc.text(`Block #${block.index} [Hash: ${block.hash.substring(0,10)}...]`, 14, yPos);
//         const rows = ipfsStorage[block.ipfsCid] || [];
//         const tableBody = rows.map(r => [r.phase, r.sack_id || r.id, r.entity || r.entity_name, r.weight || 'N/A']);
//         autoTable(doc, { startY: yPos + 5, head: [['Phase', 'ID', 'Entity', 'Weight']], body: tableBody });
//         yPos = doc.lastAutoTable.finalY + 15;
//     });
//     doc.save("Audit_Report.pdf");
//   };

//   const handleIntegrityCheck = () => {
//     if (!searchQuery) return;
//     const history = [];
//     blocks.forEach(block => {
//         const batchData = ipfsStorage[block.ipfsCid];
//         if (batchData) {
//             batchData.forEach(tx => {
//                 if ((tx.sack_id && tx.sack_id.includes(searchQuery)) || (tx.id && tx.id.includes(searchQuery))) {
//                     history.push({ ...tx, blockIdx: block.index });
//                 }
//             });
//         }
//     });
//     if (history.length > 0) setSearchResult(history);
//     else alert(`ID ${searchQuery} not found in Immutable Ledger.`);
//   };

//   const handleRetrieveCert = () => { 
//       setCertRetrievalStep(1); 
//       setTimeout(() => setCertRetrievalStep(2), 1500); 
//       setTimeout(() => setCertRetrievalStep(3), 3000); 
//       setTimeout(() => { setCertRetrievalStep(0); setShowCertDisplay(true); }, 4500); 
//   };

//   const openModal = (block, type) => { setSelectedBlock(block); setViewMode(type); };

//   // --- COMPONENTS ---
//   const SidebarItem = ({ icon, label, onClick, count }) => (
//     <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
//         {icon}
//         {sidebarOpen && <div className="flex-1 flex justify-between text-sm"><span>{label}</span>{count !== undefined && <span className="bg-slate-800 px-2 rounded-full text-xs">{count}</span>}</div>}
//     </div>
//   );

//   return (
//     <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden relative">

//       {/* SYSTEM HALTED ALERT */}
//       {isChainBroken && (
//           <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600 text-white font-bold text-center py-2 animate-pulse flex justify-center items-center gap-4 shadow-xl">
//               <AlertOctagon size={24}/> CRITICAL ALERT: SYSTEM HALTED - INTEGRITY COMPROMISED <AlertOctagon size={24}/>
//           </div>
//       )}

//       {/* SIDEBAR NAVIGATION */}
//       <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
//         <div className="flex justify-between items-center mb-6 px-1">
//             {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500"/> AGRIFLOW</span>}
//             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18}/></button>
//         </div>
//         <div className="space-y-6 flex-1 overflow-y-auto">
//             <div>
//                 <SidebarItem icon={<Sprout size={20} className="text-green-500"/>} label="Farmer (Grains)" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-orange-500"/>} label="PPC (Sacks)" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-blue-500"/>} label="Rice Mills" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
//                 <SidebarItem icon={<Box size={20} className="text-cyan-500"/>} label="Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
//                 <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500"/>} label="FPS Shops" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
//             </div>
//         </div>
//         <div className="mt-auto border-t border-slate-800 pt-4">
//              {sidebarOpen && (
//                  <div className="text-xs text-center">
//                      <div className={`flex items-center justify-center gap-2 mb-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
//                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
//                          {isConnected ? "System Online" : "Connecting..."}
//                      </div>
//                      <span className="text-slate-500">Postgres Node</span>
//                  </div>
//              )}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* HEADER */}
//         <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
//             <h2 className="text-lg font-bold text-white flex items-center gap-2">{!sidebarOpen && <Server size={20} className="text-blue-500" />} Dashboard Console</h2>
//             <div className="flex items-center gap-4">
//                 <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5">
//                     <ShieldCheck size={14} className="text-emerald-500 mr-2"/>
//                     <input className="bg-transparent border-none outline-none text-xs text-white w-48 font-mono" placeholder="Verify ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleIntegrityCheck()} />
//                     <button onClick={handleIntegrityCheck} className="text-slate-500 hover:text-white"><Search size={14}/></button>
//                 </div>
//                 <div className="h-6 w-px bg-slate-700"></div>
//                 <div className="flex gap-2">
//                     <button 
//                         onClick={handleLoginToggle} 
//                         className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${
//                             isAuthority 
//                             ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50' 
//                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
//                         }`}
//                         disabled={isChainBroken}
//                     >
//                         {isAuthority ? <><UserCheck size={14} /> AUTHORITY</> : <><LogIn size={14}/> VIEWER</>}
//                     </button>

//                     <button onClick={() => setIsPlaying(!isPlaying)} disabled={isChainBroken || !isConnected} className="p-1.5 text-emerald-400 border border-emerald-900 rounded disabled:opacity-50 hover:bg-emerald-900/20 transition-colors">
//                         {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
//                     </button>
//                     <button onClick={() => setHackerMode(true)} className="p-1.5 text-red-400 border border-red-900 rounded hover:bg-red-900/20 transition-colors">
//                         <Edit3 size={16}/>
//                     </button>
//                     <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="Download Report"><FileText size={16}/></button>
//                 </div>
//             </div>
//         </header>

//         {/* MAIN GRID COLUMNS */}
//         <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">

//              {/* COLUMN 1: OPERATIONAL DB */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                      <Database size={18} className="text-blue-500" /> 
//                      <span className="font-semibold text-sm">Operational DB (Live)</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
//                      {blocks.length === 0 && <div className="text-center text-slate-600 text-xs mt-10">System Initialized.<br/>Waiting for next block...</div>}
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ui')} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500 cursor-pointer shadow-sm group transition-all">
//                              <div className="flex justify-between items-center mb-2">
//                                  <span className="text-base font-bold text-white">Batch #{block.index}</span> 
//                                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{block.data.length} Rows</span>
//                              </div>
//                              <div className="text-xs text-slate-500 uppercase tracking-wider flex justify-between">
//                                  <span>Status:</span> 
//                                  <span className="text-emerald-500 font-bold">SYNCED</span>
//                              </div>
//                          </div>
//                      ))}
//                      <div ref={scrollRefUI} />
//                  </div>
//              </div>

//              {/* COLUMN 2: IPFS STORAGE */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                      <HardDrive size={18} className="text-purple-500" /> 
//                      <span className="font-semibold text-sm">IPFS Storage (Hashes)</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ipfs')} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-purple-500 cursor-pointer flex items-center gap-4 transition-all">
//                              <div className="bg-purple-900/20 p-3 rounded-lg text-purple-400">
//                                  <FileJson size={24} />
//                              </div>
//                              <div className="flex-1 overflow-hidden">
//                                  <div className="text-sm font-bold text-white mb-1">Snapshot_{block.index}.json</div>
//                                  <div className="text-xs text-slate-500 font-mono truncate">{block.ipfsCid}</div>
//                              </div>
//                          </div>
//                      ))}
//                  </div>
//              </div>

//              {/* COLUMN 3: IMMUTABLE LEDGER */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                      <LinkIcon size={18} className="text-emerald-500" /> 
//                      <span className="font-semibold text-sm">Immutable Ledger</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
//                      <div className="absolute left-7 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ledger')} className="ml-8 relative p-5 rounded-xl border border-slate-800 bg-emerald-900/5 hover:border-emerald-500 cursor-pointer transition-all">
//                              <div className="absolute -left-[41px] top-7 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900"></div>
//                              <div className="flex justify-between items-center mb-1">
//                                  <div className="text-lg font-bold text-emerald-400">BLOCK #{block.index}</div>
//                                  <span className="text-[10px] text-slate-600 font-mono border border-slate-700 px-2 rounded">
//                                      {block.timestamp.split('T')[1].substring(0,8)}
//                                  </span>
//                              </div>
//                              <div className="text-xs text-slate-500 font-mono break-all leading-tight">
//                                  {block.hash.substring(0,24)}...
//                              </div>
//                          </div>
//                      ))}
//                  </div>
//              </div>
//         </div>
//       </div>

//       {/* --- MODALS SECTION --- */}
//       {/* 1. INSPECTOR MODAL */}
//       <AnimatePresence>
//         {selectedBlock && viewMode === 'ui' && (
//           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
//              <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
//                    <h2 className="text-white font-bold flex items-center gap-2"><Database size={18} className="text-blue-500"/> Batch Data Inspector</h2>
//                    <button onClick={()=>setSelectedBlock(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
//                </div>
//                <div className="p-6 overflow-y-auto">
//                  <table className="w-full text-left text-xs text-slate-300">
//                    <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider">
//                      <tr><th className="p-3">ID</th><th className="p-3">Entity</th><th className="p-3">Phase</th><th className="p-3">Details</th><th className="p-3">Action</th></tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800">
//                      {ipfsStorage[selectedBlock.ipfsCid]?.map((row, i) => (
//                        <tr key={i} className="hover:bg-slate-800/50">
//                          <td className="p-3 text-emerald-400 font-mono">{row.sack_id || row.id}</td>
//                          <td className="p-3 text-white">{row.entity || row.entity_name}</td>
//                          <td className="p-3">{row.phase}</td>
//                          <td className="p-3 text-yellow-400">{row.weight || row.weight_kg} kg</td>
//                          <td className="p-3"><button onClick={() => setIpfsModalData(row)} className="text-indigo-400 border border-indigo-900 px-2 py-1 rounded">Cert</button></td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 2. PENDING BATCH WINDOW (Shared View for Operator/Viewer) */}
//       <AnimatePresence>
// //         {activePhaseWindow && (
//             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10" onClick={() => setActivePhaseWindow(null)}>
//                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                     <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
//                         <div className="flex items-center gap-3">
//                             <Activity className="text-blue-400 animate-pulse"/>
//                             <h2 className="text-lg font-bold text-white">Live Phase Monitor: <span className="text-blue-400">{activePhaseWindow}</span></h2>
//                         </div>
//                         <button onClick={() => setActivePhaseWindow(null)}><X className="text-slate-400 hover:text-white"/></button>
//                     </div>
//                     <div className="flex-1 overflow-auto p-4">
//                         <table className="w-full text-left text-xs text-slate-300">
//                             <thead className="bg-slate-950 text-slate-500 uppercase">
//                                 <tr>
//                                     <th className="p-3">Ref ID</th>
//                                     <th className="p-3">Entity</th>
//                                     <th className="p-3">Status</th>
//                                     <th className="p-3">Timestamp</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-800">
//                                 {/* Query the Local Table for this Phase */}
//                                 {(localTables[activePhaseWindow.toLowerCase()] || []).map((row, i) => (
//                                     <tr key={i} className="hover:bg-slate-800">
//                                         <td className="p-3 font-mono text-blue-300">{row.sack_id || row.batch || row.token_no}</td>
//                                         <td className="p-3">{row.mill || row.farmer || row.shop_id || "Facility"}</td>
//                                         <td className="p-3">
//                                             <span className={`px-2 py-1 rounded font-bold text-[10px] ${
//                                                 row.status?.includes('PASSED') ? 'bg-green-900 text-green-400' : 
//                                                 row.status?.includes('MILLING') ? 'bg-blue-900 text-blue-400' : 
//                                                 'bg-yellow-900 text-yellow-400'
//                                             }`}>
//                                                 {row.status}
//                                             </span>
//                                         </td>
//                                         <td className="p-3 text-slate-500">{new Date().toLocaleTimeString()}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         {localTables[activePhaseWindow.toLowerCase()]?.length === 0 && (
//                             <div className="text-center p-10 text-slate-500 italic">No active assets in this phase.</div>
//                         )}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 3. CERTIFICATE DISPLAY */}
//       {/* <AnimatePresence>
//         {ipfsModalData && (
//           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
//             <div className="absolute inset-0 pointer-events-auto" onClick={() => {if(certRetrievalStep === 0) setIpfsModalData(null)}}></div>
//             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-indigo-500 shadow-2xl rounded-xl w-80 p-5 pointer-events-auto relative overflow-hidden">
//                {certRetrievalStep > 0 && (
//                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10 space-y-3">
//                        <RefreshCw className="animate-spin text-indigo-500" size={32} />
//                        <div className="text-xs font-mono text-indigo-300">
//                            {certRetrievalStep === 1 && "Finding Peers..."}
//                            {certRetrievalStep === 2 && "Downloading Chunks..."}
//                            {certRetrievalStep === 3 && "Decrypting Content..."}
//                        </div>
//                    </div>
//                )}
//                <div className="flex items-center gap-3 mb-4">
//                   <div className="bg-indigo-500/20 p-2 rounded text-indigo-400"><HardDrive size={20}/></div>
//                   <div><h3 className="font-bold text-white text-sm">IPFS Metadata</h3><p className="text-[10px] text-slate-400">Decentralized Storage</p></div>
//                </div>
//                <div className="space-y-3 text-xs">
//                   <div className="bg-black p-3 rounded border border-slate-800">
//                      <div className="flex justify-between mb-1"><span className="text-slate-500">Target:</span> <span className="text-blue-400 font-mono">{ipfsModalData.sack_id}</span></div>
//                      <div className="flex justify-between"><span className="text-slate-500">File:</span> <span className="text-slate-300">Quality_Cert.pdf</span></div>
//                   </div>
//                   <div className="font-mono text-[10px] text-indigo-300 break-all bg-indigo-900/10 p-2 rounded border border-indigo-500/20">CID: {ipfsModalData.ipfsRef}</div>
//                   <button onClick={handleRetrieveCert} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 mt-2">
//                      <UploadCloud size={14}/> Retrieve File
//                   </button>
//                </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence> */}

//       <AnimatePresence>
//           {showCertDisplay && ipfsModalData && (
//               <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setShowCertDisplay(false)}>
//                   <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
//                       <button onClick={() => setShowCertDisplay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
//                       <div className="border-4 border-double border-slate-300 p-6 text-center">
//                           <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600"/></div>
//                           <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">QUALITY CERTIFICATE</h1>
//                           <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Blockchain Ledger</p>
//                           <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded">
//                               <p><strong>This certifies that the produce:</strong></p>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Item ID:</span> <b>{ipfsModalData.sack_id}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Ref Batch:</span> <b>{ipfsModalData.token_no}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Origin Entity:</span> <b>{ipfsModalData.entity_name}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Quality Grade:</span> <b className="text-emerald-600">GRADE A (Premium)</b></div>
//                           </div>
//                           <div className="mt-8 flex justify-between items-end">
//                               <div className="text-center">
//                                   <div className="font-dancing-script text-xl text-blue-600 mb-1">BlockchainAuth</div>
//                                   <div className="border-t border-slate-400 w-32 text-[10px] text-slate-500">Digital Signature</div>
//                               </div>
//                               <div className="w-16 h-16 bg-black p-1"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ipfsModalData.ipfsRef}`} alt="QR" /></div>
//                           </div>
//                       </div>
//                   </motion.div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 4. LOADING SPINNER FOR CERT */}
//       <AnimatePresence>
//           {ipfsModalData && !showCertDisplay && (
//               <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
//                   <div className="bg-slate-900 border border-indigo-500 p-6 rounded-xl w-80 text-center shadow-xl">
//                       <h3 className="text-white font-bold mb-4">IPFS Asset Retrieval</h3>
//                       <button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-2 rounded transition-colors font-semibold" onClick={handleRetrieveCert}>
//                           {certRetrievalStep === 0 ? "Retrieve from IPFS" : "Processing..."}
//                       </button>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 5. AUTH MODAL */}
//       <AnimatePresence>
//         {showLogin && (
//           <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
//               <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
//                 <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Authority Login</h2></div>
//                 <input type="password" autoFocus className="w-full bg-black border border-slate-700 rounded-lg p-3 text-white text-center mb-2" placeholder="ACCESS KEY" value={inputKey} onChange={(e) => setInputKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitLogin()} />
//                 {loginError && <p className="text-red-500 text-xs text-center mb-4">Invalid Key.</p>}
//                 <div className="flex gap-2 mt-4"><button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button><button onClick={submitLogin} className="flex-1 bg-purple-600 text-white font-bold py-2 rounded-lg">Authenticate</button></div>
//               </div>
//           </div>
//         )}
//       </AnimatePresence>



//       {/* 7. ACTIVE LOGS WINDOW */}
//       <AnimatePresence>
//           {activePhaseWindow && (
//               <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setActivePhaseWindow(null)}>
//                   <div className="bg-slate-900 border border-slate-600 p-6 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
//                       <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
//                           <h2 className="text-white font-bold text-xl flex items-center gap-2"><Layout size={20}/> {activePhaseWindow} LOGS</h2>
//                           <button onClick={()=>setActivePhaseWindow(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
//                       </div>
//                       <div className="flex-1 overflow-auto custom-scrollbar">
//                           <table className="w-full text-slate-300 text-xs">
//                               <thead className="bg-slate-800 text-slate-400 sticky top-0"><tr><th className="p-3 text-left">Timestamp</th><th className="p-3 text-left">ID</th><th className="p-3 text-left">Entity</th><th className="p-3 text-left">Status</th></tr></thead>
//                               <tbody className="divide-y divide-slate-800">
//                                   {localTables[activePhaseWindow === 'WAREHOUSE' ? 'warehouse' : activePhaseWindow.toLowerCase()]?.map((r,i)=>(
//                                       <tr key={i} className="hover:bg-slate-800/30">
//                                           <td className="p-3 text-slate-500">{r.timestamp?.split('T')[1].substring(0,8)}</td>
//                                           <td className="p-3 font-mono text-emerald-500">{r.id || r.sack_id}</td>
//                                           <td className="p-3">{r.entity || r.entity_name}</td>
//                                           <td className="p-3"><span className="bg-slate-800 px-2 py-1 rounded text-[10px]">{r.status}</span></td>
//                                       </tr>
//                                   ))}
//                               </tbody>
//                           </table>
//                       </div>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>


//       {/* 8. HACKER MODAL */}
//   <AnimatePresence>
//     {hackerMode && (
//       <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
//           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
//             <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
//             <div className="space-y-4">
//               <div>
//                 <label className="text-xs text-slate-500">Target Batch Index</label>
//                 <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                   value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
//               </div>
//               <div>
//                 <label className="text-xs text-slate-500">Row Index</label>
//                 <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                   value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
//               </div>
//               <div>
//                 <label className="text-xs text-slate-500">Inject Weight Value</label>
//                 <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
//                   value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
//               </div>
//               <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">EXECUTE INJECTION</button>
//               <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
//             </div>
//           </motion.div>
//       </div>
//     )}
//   </AnimatePresence>
//     </div>
//   );
// };

// export default SupplyChainDashboard;








// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import axios from 'axios';
// import io from 'socket.io-client';
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box, Key, Truck, Factory, Sprout,
//   Activity, FileBadge, Layout, ShoppingCart, Microscope,
//   Menu, ArrowRightLeft, LogIn, LogOut, Minus,
//   FileJson, Code, Layers, AlertOctagon, Undo2,
//   DollarSign
// } from 'lucide-react';

// // --- CONFIGURATION ---
// // 1. Point Axios and Socket to the Backend Port (4001)
// const SERVER_URL = `http://${window.location.hostname}:4001`;
// axios.defaults.baseURL = SERVER_URL;

// // 2. Initialize Socket connection
// const socket = io(SERVER_URL, {
//     transports: ['websocket'],
//     reconnection: true
// });

// const SupplyChainDashboard = () => {
//   // --- STATE MANAGEMENT ---

//   // 1. Blockchain Data
//   // blocks: Array of block headers (Index, Hash, Timestamp) for the grid display.
//   const [blocks, setBlocks] = useState([]); 
//   // ipfsStorage: Dictionary { CID: [DataArray] }. Acts as our local "Cache" of block data.
//   const [ipfsStorage, setIpfsStorage] = useState({});
//   // pendingBatch: Data received via Socket but not yet mined (waiting for 15s timer).
//   const [pendingBatch, setPendingBatch] = useState([]); 

//   // 2. System Status
//   const [timeLeft, setTimeLeft] = useState(15); // Syncs with Server
//   const [isPlaying, setIsPlaying] = useState(false); // Controls the Generator
//   const [isChainBroken, setIsChainBroken] = useState(false); // Red Alert Flag
//   const [isConnected, setIsConnected] = useState(socket.connected); // Connection Status

//   // 3. Authentication (Roles)
//   // isValidator: Can Anchor Blocks and Fix Data (The "Authority")
//   const [isValidator, setIsValidator] = useState(false); 
//   // isCommissioner: Can Reset the entire System (The "Super Admin")
//   const [isCommissioner, setIsCommissioner] = useState(false); 
//   const [showLogin, setShowLogin] = useState(false);
//   const [inputKey, setInputKey] = useState('');
//   const [loginError, setLoginError] = useState(false);

//   // 4. Correction Logic
//   const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
//   const [correctionTarget, setCorrectionTarget] = useState(null); // Which row are we fixing?
//   const [newWeightInput, setNewWeightInput] = useState('');

//   // 5. UI Layout State
//   const [localTables, setLocalTables] = useState({ farmer: [], ppc: [], cmr: [], warehouse: [], fps: [] });
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isBatchMinimized, setIsBatchMinimized] = useState(false); // For the bouncing card

//   // 6. Modal Controls
//   const [selectedBlock, setSelectedBlock] = useState(null); // The block clicked by user
//   const [viewMode, setViewMode] = useState(null); // 'ui' (Inspector), 'ipfs' (JSON), 'ledger' (Receipt)
//   const [hackerMode, setHackerMode] = useState(false);
//   const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
//   const [activePhaseWindow, setActivePhaseWindow] = useState(null); // Phase Monitor Modal
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState(null); // Integrity Check Modal

//   // 7. Certificate State
//   const [ipfsModalData, setIpfsModalData] = useState(null);
//   const [certRetrievalStep, setCertRetrievalStep] = useState(0); // Loading state for cert
//   const [showCertDisplay, setShowCertDisplay] = useState(false); // Final White Paper

//   const scrollRefUI = useRef(null); // For auto-scrolling the grid

//   // --- INITIALIZATION & LISTENERS ---
//   useEffect(() => {
//     // Connect Check
//     if (socket.connected) setIsConnected(true);
//     socket.on('connect', () => setIsConnected(true));
//     socket.on('disconnect', () => setIsConnected(false));

//     // A. SYNC TIMER: Server dictates time, Frontend just displays it.














// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable'; // Ensure this is imported
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box, Key, Truck, Factory, Sprout,
//   Activity, FileBadge, Layout, ShoppingCart, Microscope,
//   Menu, ArrowRightLeft, LogIn, LogOut
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
//   const [ipfsStorage, setIpfsStorage] = useState({});
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [pendingBatch, setPendingBatch] = useState(null); 
//   const [activeSackStates, setActiveSackStates] = useState({});
//   const [timeLeft, setTimeLeft] = useState(15);
//   const [isAuthority, setIsAuthority] = useState(false);

//   // --- LOCAL DB STATE ---
//   const [localTables, setLocalTables] = useState({
//     farmer: [],
//     ppc: [],
//     cmr: [],
//     warehouse: [],
//     fps: []
//   });
  
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   // Modals & Search
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [viewMode, setViewMode] = useState(null); 
//   const [hackerMode, setHackerMode] = useState(false);
//   const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
  
//   const [activePhaseWindow, setActivePhaseWindow] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState(null); 

//   // --- CERTIFICATE STATE ---
//   const [ipfsModalData, setIpfsModalData] = useState(null);
//   const [certRetrievalStep, setCertRetrievalStep] = useState(0); 
//   const [showCertDisplay, setShowCertDisplay] = useState(false);

//   // Login
//   const [showLogin, setShowLogin] = useState(false);
//   const [inputKey, setInputKey] = useState('');
//   const [loginError, setLoginError] = useState(false);

//   // Counter
//   const [sackCounter, setSackCounter] = useState(1000); 

//   const scrollRefUI = useRef(null);

//   // --- CONFIG ---
//   const BATCH_SIZE = 12;
//   const TIMER_DURATION = 15;
//   const ACCESS_KEY = "admin"; 

//   // --- TOPOLOGY LOGIC ---
//   const getNextPhase = (currentPhase) => {
//     // Round-Robin distribution for demo to ensure all tables get data
//     if (!currentPhase) return 'FARMER';
//     const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
//     const idx = phases.indexOf(currentPhase);
//     return phases[(idx + 1) % phases.length];
//   };

//   // --- SUB-STATUS UPDATER ---
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setLocalTables(prev => {
//         const next = { ...prev };
//         // Simulate CMR Work
//         next.cmr = next.cmr.map(row => {
//             if (row.status === 'IN_HOPPER' && Math.random() > 0.7) return { ...row, status: 'MILLING' };
//             if (row.status === 'MILLING' && Math.random() > 0.6) return { ...row, status: 'QC_PASSED' };
//             return row;
//         });
//         return next;
//       });
//     }, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   // --- BATCH GENERATOR (Distributes to ALL tables for demo visibility) ---
//   const generateBatch = () => {
//     let newTransactions = [];
//     let tempStates = { ...activeSackStates };
//     let tempDB = { ...localTables };
//     let currentCount = sackCounter;

//     const millNames = ["Sri Laxmi Rice Mill", "Balaji Agro", "Venkateshwara Tech", "Jyothi Industries"];
//     const farmerNames = ["Ramesh Kumar", "Suresh Reddy", "Mallesh Yadav", "K. Venkat"];
//     const truckPrefixes = ["TS07", "AP29", "MH04", "KA01"];

//     for (let i = 0; i < BATCH_SIZE; i++) {
//       currentCount++;
//       const sackId = `SK-${currentCount}`; 
//       const tokenNo = `TKN-2026-${Math.floor(Math.random() * 8999) + 1000}`;
      
//       // Determine Phase (Weighted random for realism + ensuring spread)
//       const r = Math.random();
//       let nextPhase = 'FARMER';
//       if (r > 0.2) nextPhase = 'PPC';
//       if (r > 0.4) nextPhase = 'CMR';
//       if (r > 0.6) nextPhase = 'WH';
//       if (r > 0.8) nextPhase = 'FPS';

//       tempStates[sackId] = nextPhase;

//       let evt = "UPDATE";
//       let status = "PENDING";
//       let entity = "Admin";
//       let truck = "N/A";

//       // Populate DBs
//       if (nextPhase === 'FARMER') {
//           evt = "HARVEST_LOG";
//           entity = farmerNames[Math.floor(Math.random() * farmerNames.length)];
//           tempDB.farmer.push({ sack_id: sackId, farmer: entity, crop: "Paddy - Grade A", date: new Date().toISOString().split('T')[0], status: "HARVESTED" });
//       }
//       else if (nextPhase === 'PPC') { 
//           evt = "SACK_CREATED"; 
//           status = "WEIGHING"; 
//           entity = "PPC Centre 04";
//           tempDB.ppc.push({ token_no: tokenNo, sack_id: sackId, status: "WEIGHING", weight: (50 + Math.random()).toFixed(2), entity_name: entity, truck_no: truck });
//       }
//       else if (nextPhase === 'CMR') { 
//           evt = "MILLING_START"; 
//           status = "IN_HOPPER"; 
//           entity = millNames[Math.floor(Math.random() * millNames.length)];
//           truck = `${truckPrefixes[Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 9999)}`;
//           tempDB.cmr.push({ batch: tokenNo, mill: entity, truck: truck, status: "IN_HOPPER", sack_id: sackId });
//       }
//       else if (nextPhase === 'WH') { 
//           evt = "STOCK_IN"; 
//           status = "STORED"; 
//           entity = "Central Warehouse";
//           tempDB.warehouse.push({ slot: `SLOT-${Math.floor(Math.random()*100)}`, sack_id: sackId, status: "STORED", token_no: tokenNo });
//       }
//       else if (nextPhase === 'FPS') { 
//           evt = "DISTRIBUTION"; 
//           status = "ACTIVE"; 
//           entity = "FPS Shop #102";
//           tempDB.fps.push({ shop_id: "FPS-102", sack_id: sackId, status: "AVAILABLE", token_no: tokenNo });
//       }

//       newTransactions.push({
//         sack_id: sackId,        
//         token_no: tokenNo,      
//         phase: nextPhase,
//         event: evt,
//         weight_kg: 50.0,
//         quality: 'Grade A',
//         timestamp: new Date().toISOString(),
//         isCorrection: false,
//         entity_name: entity,
//         truck_no: truck,
//         status: status,
//         ipfsRef: `Qm${simpleHash(sackId + evt).substring(0, 16)}...`
//       });
//     }

//     setSackCounter(currentCount); 
//     setPendingBatch(newTransactions);
//     setActiveSackStates(tempStates);
//     setLocalTables(tempDB); 
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
//   const handleLoginToggle = () => {
//     if (isAuthority) {
//       setIsAuthority(false);
//     } else {
//       setShowLogin(true);
//       setLoginError(false);
//       setInputKey('');
//     }
//   };

//   const submitLogin = () => {
//     if (inputKey === ACCESS_KEY) {
//       setIsAuthority(true);
//       setShowLogin(false);
//     } else {
//       setLoginError(true);
//     }
//   };

//   const updatePendingRow = (idx, field, value) => {
//     if (!isAuthority) return; 
//     const u = [...pendingBatch];
//     u[idx][field] = value;
//     setPendingBatch(u);
//   };
  
//   const anchorBatch = () => {
//     if (!pendingBatch) return;
//     const blockIndex = blocks.length;
//     const prevHash = blockIndex > 0 ? blocks[blockIndex - 1].hash : "00000000";
//     const cid = `Qm${simpleHash(JSON.stringify(pendingBatch))}x${simpleHash(new Date().toISOString()).substring(0,6)}`;
    
//     setIpfsStorage(prev => ({ ...prev, [cid]: pendingBatch }));
//     const newBlock = { index: blockIndex, timestamp: new Date().toISOString(), prevHash, ipfsCid: cid, hash: simpleHash(cid + prevHash), status: 'VALID' };
//     setBlocks(prev => [...prev, newBlock]);
//     setPendingBatch(null);
//     setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//   };

//   const rectifyMistake = (oldBlock, row) => {
//     if (!isAuthority) {
//         alert("ACCESS DENIED: Only Authorized Personnel can Rectify data.");
//         return;
//     }
//     alert("Correction Proposal Submitted to Consensus Layer.");
//   };

//   const executeAttack = () => {
//     const { blockIdx, rowIdx, val } = hackerTarget;
//     if (blocks[blockIdx]) {
//         alert("INJECTION ATTACK SIMULATED: Data in local memory corrupted.");
//         setHackerMode(false);
//     }
//   };

//   const checkIntegrity = (block) => true; 

//   // --- PDF DOWNLOAD (Functional) ---
//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(18);
//     doc.text("AgriFlow - Hybrid Ledger Audit Report", 14, 20);
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
//     let yPos = 40;
//     blocks.forEach((block) => {
//         doc.setFontSize(12);
//         doc.setTextColor(0, 50, 200);
//         doc.text(`Block #${100 + block.index} (Hash: ${block.hash.substring(0,10)}...)`, 14, yPos);
        
//         const rows = ipfsStorage[block.ipfsCid] || [];
//         const tableData = rows.map(r => [r.sack_id, r.phase, r.event, r.weight_kg]);
        
//         autoTable(doc, {
//             startY: yPos + 5,
//             head: [['Sack ID', 'Phase', 'Event', 'Weight']],
//             body: tableData,
//             theme: 'grid'
//         });
//         yPos = doc.lastAutoTable.finalY + 15;
//     });
    
//     doc.save("Audit_Report.pdf");
//   };

//   const handleIntegrityCheck = () => {
//     if (!searchQuery) return;
//     const history = [];
//     blocks.forEach(block => {
//         const batchData = ipfsStorage[block.ipfsCid];
//         if (batchData) {
//             batchData.forEach(tx => {
//                 if (tx.sack_id && tx.sack_id.toLowerCase() === searchQuery.toLowerCase()) {
//                     history.push({ ...tx, blockIdx: block.index });
//                 }
//             });
//         }
//     });
//     if (history.length > 0) setSearchResult(history);
//     else alert(`Sack ${searchQuery} not found in Immutable Ledger.`);
//   };

//   const handleRetrieveCert = () => {
//     setCertRetrievalStep(1); 
//     setTimeout(() => setCertRetrievalStep(2), 1500); 
//     setTimeout(() => setCertRetrievalStep(3), 3000); 
//     setTimeout(() => { setCertRetrievalStep(0); setShowCertDisplay(true); }, 4500);
//   };

//   const openModal = (block, type) => { setSelectedBlock(block); setViewMode(type); };

//   // --- SIDEBAR COMPONENT ---
//   const SidebarItem = ({ icon, label, onClick, count }) => (
//     <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
//         {icon}
//         {sidebarOpen && (
//             <div className="flex-1 flex justify-between items-center text-sm font-medium">
//                 <span>{label}</span>
//                 {count !== undefined && <span className="bg-slate-800 border border-slate-700 text-xs px-2 py-0.5 rounded-full">{count}</span>}
//             </div>
//         )}
//     </div>
//   );

//   return (
//     <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden">
      
//       {/* 1. SIDEBAR */}
//       <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
//         <div className="flex justify-between items-center mb-6 px-1">
//             {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500"/> HYBRID LEDGER</span>}
//             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18}/></button>
//         </div>
//         <div className="space-y-6 flex-1 overflow-y-auto">
//             <div>
//                 {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">Operations</div>}
//                 <SidebarItem icon={<Sprout size={20} className="text-green-500"/>} label="Farmer Harvests" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-orange-500"/>} label="PPC Procurement" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-blue-500"/>} label="Rice Mills (CMR)" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
//                 <SidebarItem icon={<Box size={20} className="text-cyan-500"/>} label="Central Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
//                 <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500"/>} label="FPS Distribution" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
//             </div>
//             <div>
//                 {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">System</div>}
//                 <SidebarItem icon={<Database size={20}/>} label="Operational DB" onClick={() => alert("Active DB Connection: Healthy")} />
//                 <SidebarItem icon={<HardDrive size={20}/>} label="IPFS Nodes" onClick={() => alert("IPFS Swarm: 45 Peers Connected")} />
//             </div>
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* 2. HEADER */}
//         <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
//             <h2 className="text-lg font-bold text-white flex items-center gap-2">
//                 {!sidebarOpen && <Server size={20} className="text-blue-500" />} 
//                 Dashboard Console
//             </h2>

//             <div className="flex items-center gap-4">
//                 <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
//                     <ShieldCheck size={14} className="text-emerald-500 mr-2"/>
//                     <input 
//                         className="bg-transparent border-none outline-none text-xs text-white w-48 placeholder-slate-600 font-mono"
//                         placeholder="Verify Sack ID (e.g. SK-1005)"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         onKeyDown={(e) => e.key === 'Enter' && handleIntegrityCheck()}
//                     />
//                     <button onClick={handleIntegrityCheck} className="text-slate-500 hover:text-white"><Search size={14}/></button>
//                 </div>

//                 <div className="h-6 w-px bg-slate-700"></div>

//                 <div className="flex gap-2">
//                     <button 
//                         onClick={handleLoginToggle} 
//                         className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${
//                             isAuthority 
//                             ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50' 
//                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
//                         }`}
//                     >
//                         {isAuthority ? <><UserCheck size={14} /> AUTHORITY ACCESS</> : <><LogIn size={14}/> VIEWER LOGIN</>}
//                     </button>

//                     {!isPlaying && !pendingBatch ? 
//                         <button onClick={() => setIsPlaying(true)} className="p-1.5 text-emerald-400 bg-emerald-900/20 border border-emerald-900 rounded hover:bg-emerald-900/40"><Play size={16}/></button> :
//                         <button onClick={() => setIsPlaying(false)} className="p-1.5 text-yellow-400 bg-yellow-900/20 border border-yellow-900 rounded hover:bg-yellow-900/40"><Pause size={16}/></button>
//                     }
                    
//                     <button onClick={() => setHackerMode(true)} className="p-1.5 text-red-400 bg-red-900/20 border border-red-900 rounded hover:bg-red-900/40"><Edit3 size={16}/></button>
                    
//                     {/* DOWNLOAD PDF BUTTON */}
//                     <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="Download Audit Report">
//                         <FileText size={16}/>
//                     </button>
//                 </div>
//             </div>
//         </header>

//         {/* 3. MAIN GRID */}
//         <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
             
//              {/* Col 1: Operational CSV */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <Database size={16} className="text-blue-500" /> <span className="text-sm font-semibold">Operational CSV</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ui')} className="p-3 rounded border border-slate-800 bg-slate-900/50 hover:border-blue-500 cursor-pointer">
//                              <div className="flex justify-between text-xs font-bold text-slate-300"><span>Batch #{block.index + 1}</span> <span>{ipfsStorage[block.ipfsCid]?.length || 0} Rows</span></div>
//                          </div>
//                      ))}
//                      <div ref={scrollRefUI} />
//                  </div>
//              </div>

//              {/* Col 2: IPFS Storage */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <HardDrive size={16} className="text-purple-500" /> <span className="text-sm font-semibold">IPFS Network</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ipfs')} className="p-3 rounded border border-slate-800 bg-slate-900/50 hover:border-purple-500 cursor-pointer flex justify-between items-center">
//                              <div className="flex items-center gap-2 text-xs text-purple-400"><FileText size={14}/> <span>Snapshot_{block.index}.json</span></div>
//                              <Lock size={12} className="text-slate-600"/>
//                          </div>
//                      ))}
//                  </div>
//              </div>

//              {/* Col 3: Ledger Anchors */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <LinkIcon size={16} className="text-emerald-500" /> <span className="text-sm font-semibold">Ledger Anchors</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative">
//                      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ledger')} className="ml-4 relative p-3 rounded border border-slate-800 bg-emerald-900/10 hover:border-emerald-500 cursor-pointer">
//                              <div className="absolute -left-[21px] top-4 w-2 h-2 rounded-full bg-emerald-500"></div>
//                              <div className="text-[10px] text-emerald-400 font-mono">HASH: {block.hash.substring(0,20)}...</div>
//                          </div>
//                      ))}
//                  </div>
//              </div>
//         </div>
//       </div>

//       {/* ================= MODALS ================= */}

//       {/* 1. PHASE MONITOR WINDOW */}
//       <AnimatePresence>
//         {activePhaseWindow && (
//             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10" onClick={() => setActivePhaseWindow(null)}>
//                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                     <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
//                         <div className="flex items-center gap-3">
//                             <Activity className="text-blue-400 animate-pulse"/>
//                             <h2 className="text-lg font-bold text-white">Live Phase Monitor: <span className="text-blue-400">{activePhaseWindow}</span></h2>
//                         </div>
//                         <button onClick={() => setActivePhaseWindow(null)}><X className="text-slate-400 hover:text-white"/></button>
//                     </div>
//                     <div className="flex-1 overflow-auto p-4">
//                         <table className="w-full text-left text-xs text-slate-300">
//                             <thead className="bg-slate-950 text-slate-500 uppercase">
//                                 <tr>
//                                     <th className="p-3">Ref ID</th>
//                                     <th className="p-3">Entity</th>
//                                     <th className="p-3">Status</th>
//                                     <th className="p-3">Timestamp</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-800">
//                                 {/* Query the Local Table for this Phase */}
//                                 {(localTables[activePhaseWindow.toLowerCase()] || []).map((row, i) => (
//                                     <tr key={i} className="hover:bg-slate-800">
//                                         <td className="p-3 font-mono text-blue-300">{row.sack_id || row.batch || row.token_no}</td>
//                                         <td className="p-3">{row.mill || row.farmer || row.shop_id || "Facility"}</td>
//                                         <td className="p-3">
//                                             <span className={`px-2 py-1 rounded font-bold text-[10px] ${
//                                                 row.status?.includes('PASSED') ? 'bg-green-900 text-green-400' : 
//                                                 row.status?.includes('MILLING') ? 'bg-blue-900 text-blue-400' : 
//                                                 'bg-yellow-900 text-yellow-400'
//                                             }`}>
//                                                 {row.status}
//                                             </span>
//                                         </td>
//                                         <td className="p-3 text-slate-500">{new Date().toLocaleTimeString()}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         {localTables[activePhaseWindow.toLowerCase()]?.length === 0 && (
//                             <div className="text-center p-10 text-slate-500 italic">No active assets in this phase.</div>
//                         )}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 2. INSPECTOR MODAL */}
//       <AnimatePresence>
//         {selectedBlock && viewMode && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
//              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
//                   <h2 className="font-bold text-white flex items-center gap-2"><Database className="text-blue-500"/> Block Inspector</h2>
//                   <button onClick={() => setSelectedBlock(null)}><X className="text-slate-500"/></button>
//                </div>
//                <div className="p-6 overflow-y-auto font-mono text-xs">
//                  <table className="w-full text-left">
//                    <thead className="bg-slate-800 text-slate-400">
//                      <tr>
//                         <th className="p-3">Sack ID</th>
//                         <th className="p-3">Token Ref</th>
//                         <th className="p-3">Entity (Mill/Farmer)</th>
//                         <th className="p-3">Truck No</th>
//                         <th className="p-3">Status</th>
//                         <th className="p-3">Weight</th>
//                         <th className="p-3">Docs</th>
//                      </tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {/* FIX: Ensure we read the correct data array based on viewMode */}
//                      {(ipfsStorage[selectedBlock.ipfsCid])?.slice(0, 50).map((row, i) => (
//                        <tr key={i} className={row.isCorrection ? "bg-yellow-900/10" : ""}>
//                          <td className="p-3 text-emerald-400 font-bold text-sm">{row.sack_id}</td>
//                          <td className="p-3 text-slate-500">{row.token_no}</td>
//                          <td className="p-3 flex items-center gap-2"><Factory size={12} className="text-orange-400"/> {row.entity_name}</td>
//                          <td className="p-3 text-slate-400"><Truck size={12} className="inline mr-1"/> {row.truck_no}</td>
//                          <td className="p-3"><span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{row.status}</span></td>
//                          <td className="p-3 flex items-center gap-2">
//                             {row.weight_kg}kg
//                             {isAuthority && viewMode === 'ui' && (
//                                 <button onClick={() => rectifyMistake(selectedBlock, row)} className="bg-yellow-900/40 text-yellow-500 px-1 rounded hover:bg-yellow-900 border border-yellow-700">FIX</button>
//                             )}
//                          </td>
//                          <td className="p-3">
//                              <button onClick={() => setIpfsModalData(row)} className="text-indigo-400 border border-indigo-900 bg-indigo-500/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-500/20">
//                                  <FileBadge size={12} /> Cert
//                              </button>
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

//       {/* 3. INTEGRITY CHECK RESULT MODAL */}
//       <AnimatePresence>
//         {searchResult && (
//             <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSearchResult(null)}>
//                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-emerald-500 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl p-6" onClick={e => e.stopPropagation()}>
//                     <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
//                         <div>
//                             <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><ShieldCheck/> Integrity Verification</h2>
//                             <p className="text-sm text-slate-400">Provenance History for {searchQuery}</p>
//                         </div>
//                         <button onClick={() => setSearchResult(null)}><X className="text-slate-500 hover:text-white"/></button>
//                     </div>
//                     <div className="space-y-4 overflow-y-auto">
//                         {searchResult.map((tx, i) => (
//                             <div key={i} className="flex gap-4 relative">
//                                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center text-emerald-400 z-10 font-bold">{i+1}</div>
//                                 {i !== searchResult.length - 1 && <div className="absolute left-5 top-10 bottom-[-16px] w-px bg-slate-700"/>}
//                                 <div className="flex-1 bg-slate-800/50 p-3 rounded border border-slate-700">
//                                     <div className="flex justify-between">
//                                         <span className="font-bold text-white text-sm">{tx.phase}</span>
//                                         <span className="text-[10px] text-slate-500">{tx.timestamp}</span>
//                                     </div>
//                                     <div className="text-xs text-slate-400 mt-1">{tx.event}</div>
//                                     <div className="text-xs text-blue-400 mt-1 font-mono">Block #{100 + tx.blockIdx}</div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 4. IPFS POPUP */}
//       <AnimatePresence>
//         {ipfsModalData && (
//           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
//             <div className="absolute inset-0 pointer-events-auto" onClick={() => {if(certRetrievalStep === 0) setIpfsModalData(null)}}></div>
//             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-indigo-500 shadow-2xl rounded-xl w-80 p-5 pointer-events-auto relative overflow-hidden">
//                {certRetrievalStep > 0 && (
//                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10 space-y-3">
//                        <RefreshCw className="animate-spin text-indigo-500" size={32} />
//                        <div className="text-xs font-mono text-indigo-300">
//                            {certRetrievalStep === 1 && "Finding Peers..."}
//                            {certRetrievalStep === 2 && "Downloading Chunks..."}
//                            {certRetrievalStep === 3 && "Decrypting Content..."}
//                        </div>
//                    </div>
//                )}
//                <div className="flex items-center gap-3 mb-4">
//                   <div className="bg-indigo-500/20 p-2 rounded text-indigo-400"><HardDrive size={20}/></div>
//                   <div><h3 className="font-bold text-white text-sm">IPFS Metadata</h3><p className="text-[10px] text-slate-400">Decentralized Storage</p></div>
//                </div>
//                <div className="space-y-3 text-xs">
//                   <div className="bg-black p-3 rounded border border-slate-800">
//                      <div className="flex justify-between mb-1"><span className="text-slate-500">Target:</span> <span className="text-blue-400 font-mono">{ipfsModalData.sack_id}</span></div>
//                      <div className="flex justify-between"><span className="text-slate-500">File:</span> <span className="text-slate-300">Quality_Cert.pdf</span></div>
//                   </div>
//                   <div className="font-mono text-[10px] text-indigo-300 break-all bg-indigo-900/10 p-2 rounded border border-indigo-500/20">CID: {ipfsModalData.ipfsRef}</div>
//                   <button onClick={handleRetrieveCert} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 mt-2">
//                      <UploadCloud size={14}/> Retrieve File
//                   </button>
//                </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 5. DIGITAL CERTIFICATE */}
//       <AnimatePresence>
//           {showCertDisplay && ipfsModalData && (
//               <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setShowCertDisplay(false)}>
//                   <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
//                       <button onClick={() => setShowCertDisplay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
//                       <div className="border-4 border-double border-slate-300 p-6 text-center">
//                           <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600"/></div>
//                           <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">QUALITY CERTIFICATE</h1>
//                           <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Blockchain Ledger</p>
//                           <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded">
//                               <p><strong>This certifies that the produce:</strong></p>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Item ID:</span> <b>{ipfsModalData.sack_id}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Ref Batch:</span> <b>{ipfsModalData.token_no}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Origin Entity:</span> <b>{ipfsModalData.entity_name}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Quality Grade:</span> <b className="text-emerald-600">GRADE A (Premium)</b></div>
//                           </div>
//                           <div className="mt-8 flex justify-between items-end">
//                               <div className="text-center">
//                                   <div className="font-dancing-script text-xl text-blue-600 mb-1">BlockchainAuth</div>
//                                   <div className="border-t border-slate-400 w-32 text-[10px] text-slate-500">Digital Signature</div>
//                               </div>
//                               <div className="w-16 h-16 bg-black p-1"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ipfsModalData.ipfsRef}`} alt="QR" /></div>
//                           </div>
//                       </div>
//                   </motion.div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 6. LOGIN MODAL */}
//       <AnimatePresence>
//         {showLogin && (
//           <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
//                <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Authority Login</h2></div>
//                <p className="text-center text-slate-400 text-sm mb-6">Enter Access Key to enable Edit Mode.</p>
//                <input 
//                  type="password" 
//                  autoFocus
//                  className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white text-center tracking-widest outline-none focus:border-purple-500 transition-colors mb-2`}
//                  placeholder="ACCESS KEY"
//                  value={inputKey}
//                  onChange={(e) => setInputKey(e.target.value)}
//                  onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
//                />
//                {loginError && <p className="text-red-500 text-xs text-center mb-4">Invalid Access Key. Try 'admin'.</p>}
//                <div className="flex gap-2 mt-4">
//                  <button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button>
//                  <button onClick={submitLogin} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">Authenticate</button>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 7. PENDING BATCH MODAL */}
//       <AnimatePresence>
//         {pendingBatch && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
//                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
//                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer className="animate-pulse" /> Batch Buffer Window</h2>
//                  <div className="text-right"><div className="text-[10px] text-slate-500 uppercase">AUTO-ANCHOR IN</div><div className="text-3xl font-mono text-white">{timeLeft}s</div></div>
//                </div>
//                <div className="flex-1 overflow-y-auto p-6">
//                  {!isAuthority && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-2 mb-4 text-xs text-center rounded">READ-ONLY MODE: Log in as Authority to edit weights.</div>}
//                  <table className="w-full text-left text-sm text-slate-300">
//                    <thead className="bg-slate-950 text-slate-500 sticky top-0">
//                      <tr><th className="p-3">Sack ID</th><th className="p-3">Event</th><th className="p-3">Weight (Kg)</th><th className="p-3">Quality</th></tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {pendingBatch.map((row, i) => (
//                        <tr key={i} className={`hover:bg-slate-800/50 ${row.isCorrection ? 'bg-yellow-900/10' : ''}`}>
//                          <td className="p-3 font-mono text-blue-300">
//                            {row.sack_id}
//                            {row.isCorrection && <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">CORRECTION</span>}
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
//                              className={`w-20 p-1 border rounded ${!isAuthority ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-black border-slate-600 text-white'}`}
//                            />
//                          </td>
//                          <td className="p-3 text-slate-500">{row.quality}</td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>
//                <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-950 rounded-b-2xl">
//                  <button onClick={() => setPendingBatch(null)} disabled={!isAuthority} className="px-6 py-3 text-slate-400 disabled:opacity-50">Discard</button>
//                  <button onClick={anchorBatch} disabled={!isAuthority} className="px-8 py-3 bg-blue-600 text-white rounded-lg flex gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"><UploadCloud/> ANCHOR</button>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 8. HACKER MODAL */}
//       <AnimatePresence>
//         {hackerMode && (
//           <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
//               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
//                 <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="text-xs text-slate-500">Target Batch Index (0-{blocks.length-1})</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Row Index (0-19)</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Inject Weight Value</label>
//                     <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
//                       value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
//                   </div>
//                   <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">
//                     EXECUTE INJECTION
//                   </button>
//                   <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
//                 </div>
//               </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// };
// export default SupplyChainDashboard;











// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable'; // Ensure this is imported
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box, Key, Truck, Factory, Sprout,
//   Activity, FileBadge, Layout, ShoppingCart, Microscope,
//   Menu, ArrowRightLeft, LogIn, LogOut
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
//   const [ipfsStorage, setIpfsStorage] = useState({});
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [pendingBatch, setPendingBatch] = useState(null); 
//   const [activeSackStates, setActiveSackStates] = useState({});
//   const [timeLeft, setTimeLeft] = useState(15);
//   const [isAuthority, setIsAuthority] = useState(false);

//   // --- LOCAL DB STATE ---
//   const [localTables, setLocalTables] = useState({
//     farmer: [],
//     ppc: [],
//     cmr: [],
//     warehouse: [],
//     fps: []
//   });
  
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   // Modals & Search
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [viewMode, setViewMode] = useState(null); 
//   const [hackerMode, setHackerMode] = useState(false);
//   const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
  
//   const [activePhaseWindow, setActivePhaseWindow] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState(null); 

//   // --- CERTIFICATE STATE ---
//   const [ipfsModalData, setIpfsModalData] = useState(null);
//   const [certRetrievalStep, setCertRetrievalStep] = useState(0); 
//   const [showCertDisplay, setShowCertDisplay] = useState(false);

//   // Login
//   const [showLogin, setShowLogin] = useState(false);
//   const [inputKey, setInputKey] = useState('');
//   const [loginError, setLoginError] = useState(false);

//   // Counter
//   const [sackCounter, setSackCounter] = useState(1000); 

//   const scrollRefUI = useRef(null);

//   // --- CONFIG ---
//   const BATCH_SIZE = 12;
//   const TIMER_DURATION = 15;
//   const ACCESS_KEY = "admin"; 

//   // --- TOPOLOGY LOGIC ---
//   const getNextPhase = (currentPhase) => {
//     // Round-Robin distribution for demo to ensure all tables get data
//     if (!currentPhase) return 'FARMER';
//     const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
//     const idx = phases.indexOf(currentPhase);
//     return phases[(idx + 1) % phases.length];
//   };

//   // --- SUB-STATUS UPDATER ---
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setLocalTables(prev => {
//         const next = { ...prev };
//         // Simulate CMR Work
//         next.cmr = next.cmr.map(row => {
//             if (row.status === 'IN_HOPPER' && Math.random() > 0.7) return { ...row, status: 'MILLING' };
//             if (row.status === 'MILLING' && Math.random() > 0.6) return { ...row, status: 'QC_PASSED' };
//             return row;
//         });
//         return next;
//       });
//     }, 2000);
//     return () => clearInterval(interval);
//   }, []);

//   // --- BATCH GENERATOR (Distributes to ALL tables for demo visibility) ---
//   const generateBatch = () => {
//     let newTransactions = [];
//     let tempStates = { ...activeSackStates };
//     let tempDB = { ...localTables };
//     let currentCount = sackCounter;

//     const millNames = ["Sri Laxmi Rice Mill", "Balaji Agro", "Venkateshwara Tech", "Jyothi Industries"];
//     const farmerNames = ["Ramesh Kumar", "Suresh Reddy", "Mallesh Yadav", "K. Venkat"];
//     const truckPrefixes = ["TS07", "AP29", "MH04", "KA01"];

//     for (let i = 0; i < BATCH_SIZE; i++) {
//       currentCount++;
//       const sackId = `SK-${currentCount}`; 
//       const tokenNo = `TKN-2026-${Math.floor(Math.random() * 8999) + 1000}`;
      
//       // Determine Phase (Weighted random for realism + ensuring spread)
//       const r = Math.random();
//       let nextPhase = 'FARMER';
//       if (r > 0.2) nextPhase = 'PPC';
//       if (r > 0.4) nextPhase = 'CMR';
//       if (r > 0.6) nextPhase = 'WH';
//       if (r > 0.8) nextPhase = 'FPS';

//       tempStates[sackId] = nextPhase;

//       let evt = "UPDATE";
//       let status = "PENDING";
//       let entity = "Admin";
//       let truck = "N/A";

//       // Populate DBs
//       if (nextPhase === 'FARMER') {
//           evt = "HARVEST_LOG";
//           entity = farmerNames[Math.floor(Math.random() * farmerNames.length)];
//           tempDB.farmer.push({ sack_id: sackId, farmer: entity, crop: "Paddy - Grade A", date: new Date().toISOString().split('T')[0], status: "HARVESTED" });
//       }
//       else if (nextPhase === 'PPC') { 
//           evt = "SACK_CREATED"; 
//           status = "WEIGHING"; 
//           entity = "PPC Centre 04";
//           tempDB.ppc.push({ token_no: tokenNo, sack_id: sackId, status: "WEIGHING", weight: (50 + Math.random()).toFixed(2), entity_name: entity, truck_no: truck });
//       }
//       else if (nextPhase === 'CMR') { 
//           evt = "MILLING_START"; 
//           status = "IN_HOPPER"; 
//           entity = millNames[Math.floor(Math.random() * millNames.length)];
//           truck = `${truckPrefixes[Math.floor(Math.random() * 4)]} ${Math.floor(Math.random() * 9999)}`;
//           tempDB.cmr.push({ batch: tokenNo, mill: entity, truck: truck, status: "IN_HOPPER", sack_id: sackId });
//       }
//       else if (nextPhase === 'WH') { 
//           evt = "STOCK_IN"; 
//           status = "STORED"; 
//           entity = "Central Warehouse";
//           tempDB.warehouse.push({ slot: `SLOT-${Math.floor(Math.random()*100)}`, sack_id: sackId, status: "STORED", token_no: tokenNo });
//       }
//       else if (nextPhase === 'FPS') { 
//           evt = "DISTRIBUTION"; 
//           status = "ACTIVE"; 
//           entity = "FPS Shop #102";
//           tempDB.fps.push({ shop_id: "FPS-102", sack_id: sackId, status: "AVAILABLE", token_no: tokenNo });
//       }

//       newTransactions.push({
//         sack_id: sackId,        
//         token_no: tokenNo,      
//         phase: nextPhase,
//         event: evt,
//         weight_kg: 50.0,
//         quality: 'Grade A',
//         timestamp: new Date().toISOString(),
//         isCorrection: false,
//         entity_name: entity,
//         truck_no: truck,
//         status: status,
//         ipfsRef: `Qm${simpleHash(sackId + evt).substring(0, 16)}...`
//       });
//     }

//     setSackCounter(currentCount); 
//     setPendingBatch(newTransactions);
//     setActiveSackStates(tempStates);
//     setLocalTables(tempDB); 
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
//   const handleLoginToggle = () => {
//     if (isAuthority) {
//       setIsAuthority(false);
//     } else {
//       setShowLogin(true);
//       setLoginError(false);
//       setInputKey('');
//     }
//   };

//   const submitLogin = () => {
//     if (inputKey === ACCESS_KEY) {
//       setIsAuthority(true);
//       setShowLogin(false);
//     } else {
//       setLoginError(true);
//     }
//   };

//   const updatePendingRow = (idx, field, value) => {
//     if (!isAuthority) return; 
//     const u = [...pendingBatch];
//     u[idx][field] = value;
//     setPendingBatch(u);
//   };
  
//   const anchorBatch = () => {
//     if (!pendingBatch) return;
//     const blockIndex = blocks.length;
//     const prevHash = blockIndex > 0 ? blocks[blockIndex - 1].hash : "00000000";
//     const cid = `Qm${simpleHash(JSON.stringify(pendingBatch))}x${simpleHash(new Date().toISOString()).substring(0,6)}`;
    
//     setIpfsStorage(prev => ({ ...prev, [cid]: pendingBatch }));
//     const newBlock = { index: blockIndex, timestamp: new Date().toISOString(), prevHash, ipfsCid: cid, hash: simpleHash(cid + prevHash), status: 'VALID' };
//     setBlocks(prev => [...prev, newBlock]);
//     setPendingBatch(null);
//     setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//   };

//   const rectifyMistake = (oldBlock, row) => {
//     if (!isAuthority) {
//         alert("ACCESS DENIED: Only Authorized Personnel can Rectify data.");
//         return;
//     }
//     alert("Correction Proposal Submitted to Consensus Layer.");
//   };

//   const executeAttack = () => {
//     const { blockIdx, rowIdx, val } = hackerTarget;
//     if (blocks[blockIdx]) {
//         alert("INJECTION ATTACK SIMULATED: Data in local memory corrupted.");
//         setHackerMode(false);
//     }
//   };

//   const checkIntegrity = (block) => true; 

//   // --- PDF DOWNLOAD (Functional) ---
//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(18);
//     doc.text("AgriFlow - Hybrid Ledger Audit Report", 14, 20);
//     doc.setFontSize(10);
//     doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    
//     let yPos = 40;
//     blocks.forEach((block) => {
//         doc.setFontSize(12);
//         doc.setTextColor(0, 50, 200);
//         doc.text(`Block #${100 + block.index} (Hash: ${block.hash.substring(0,10)}...)`, 14, yPos);
        
//         const rows = ipfsStorage[block.ipfsCid] || [];
//         const tableData = rows.map(r => [r.sack_id, r.phase, r.event, r.weight_kg]);
        
//         autoTable(doc, {
//             startY: yPos + 5,
//             head: [['Sack ID', 'Phase', 'Event', 'Weight']],
//             body: tableData,
//             theme: 'grid'
//         });
//         yPos = doc.lastAutoTable.finalY + 15;
//     });
    
//     doc.save("Audit_Report.pdf");
//   };

//   const handleIntegrityCheck = () => {
//     if (!searchQuery) return;
//     const history = [];
//     blocks.forEach(block => {
//         const batchData = ipfsStorage[block.ipfsCid];
//         if (batchData) {
//             batchData.forEach(tx => {
//                 if (tx.sack_id && tx.sack_id.toLowerCase() === searchQuery.toLowerCase()) {
//                     history.push({ ...tx, blockIdx: block.index });
//                 }
//             });
//         }
//     });
//     if (history.length > 0) setSearchResult(history);
//     else alert(`Sack ${searchQuery} not found in Immutable Ledger.`);
//   };

//   const handleRetrieveCert = () => {
//     setCertRetrievalStep(1); 
//     setTimeout(() => setCertRetrievalStep(2), 1500); 
//     setTimeout(() => setCertRetrievalStep(3), 3000); 
//     setTimeout(() => { setCertRetrievalStep(0); setShowCertDisplay(true); }, 4500);
//   };

//   const openModal = (block, type) => { setSelectedBlock(block); setViewMode(type); };

//   // --- SIDEBAR COMPONENT ---
//   const SidebarItem = ({ icon, label, onClick, count }) => (
//     <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
//         {icon}
//         {sidebarOpen && (
//             <div className="flex-1 flex justify-between items-center text-sm font-medium">
//                 <span>{label}</span>
//                 {count !== undefined && <span className="bg-slate-800 border border-slate-700 text-xs px-2 py-0.5 rounded-full">{count}</span>}
//             </div>
//         )}
//     </div>
//   );

//   return (
//     <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden">
      
//       {/* 1. SIDEBAR */}
//       <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
//         <div className="flex justify-between items-center mb-6 px-1">
//             {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500"/> HYBRID LEDGER</span>}
//             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18}/></button>
//         </div>
//         <div className="space-y-6 flex-1 overflow-y-auto">
//             <div>
//                 {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">Operations</div>}
//                 <SidebarItem icon={<Sprout size={20} className="text-green-500"/>} label="Farmer Harvests" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-orange-500"/>} label="PPC Procurement" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-blue-500"/>} label="Rice Mills (CMR)" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
//                 <SidebarItem icon={<Box size={20} className="text-cyan-500"/>} label="Central Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
//                 <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500"/>} label="FPS Distribution" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
//             </div>
//             <div>
//                 {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">System</div>}
//                 <SidebarItem icon={<Database size={20}/>} label="Operational DB" onClick={() => alert("Active DB Connection: Healthy")} />
//                 <SidebarItem icon={<HardDrive size={20}/>} label="IPFS Nodes" onClick={() => alert("IPFS Swarm: 45 Peers Connected")} />
//             </div>
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* 2. HEADER */}
//         <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
//             <h2 className="text-lg font-bold text-white flex items-center gap-2">
//                 {!sidebarOpen && <Server size={20} className="text-blue-500" />} 
//                 Dashboard Console
//             </h2>

//             <div className="flex items-center gap-4">
//                 <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
//                     <ShieldCheck size={14} className="text-emerald-500 mr-2"/>
//                     <input 
//                         className="bg-transparent border-none outline-none text-xs text-white w-48 placeholder-slate-600 font-mono"
//                         placeholder="Verify Sack ID (e.g. SK-1005)"
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         onKeyDown={(e) => e.key === 'Enter' && handleIntegrityCheck()}
//                     />
//                     <button onClick={handleIntegrityCheck} className="text-slate-500 hover:text-white"><Search size={14}/></button>
//                 </div>

//                 <div className="h-6 w-px bg-slate-700"></div>

//                 <div className="flex gap-2">
//                     <button 
//                         onClick={handleLoginToggle} 
//                         className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${
//                             isAuthority 
//                             ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50' 
//                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
//                         }`}
//                     >
//                         {isAuthority ? <><UserCheck size={14} /> AUTHORITY ACCESS</> : <><LogIn size={14}/> VIEWER LOGIN</>}
//                     </button>

//                     {!isPlaying && !pendingBatch ? 
//                         <button onClick={() => setIsPlaying(true)} className="p-1.5 text-emerald-400 bg-emerald-900/20 border border-emerald-900 rounded hover:bg-emerald-900/40"><Play size={16}/></button> :
//                         <button onClick={() => setIsPlaying(false)} className="p-1.5 text-yellow-400 bg-yellow-900/20 border border-yellow-900 rounded hover:bg-yellow-900/40"><Pause size={16}/></button>
//                     }
                    
//                     <button onClick={() => setHackerMode(true)} className="p-1.5 text-red-400 bg-red-900/20 border border-red-900 rounded hover:bg-red-900/40"><Edit3 size={16}/></button>
                    
//                     {/* DOWNLOAD PDF BUTTON */}
//                     <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="Download Audit Report">
//                         <FileText size={16}/>
//                     </button>
//                 </div>
//             </div>
//         </header>

//         {/* 3. MAIN GRID */}
//         <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
             
//              {/* Col 1: Operational CSV */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <Database size={16} className="text-blue-500" /> <span className="text-sm font-semibold">Operational CSV</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ui')} className="p-3 rounded border border-slate-800 bg-slate-900/50 hover:border-blue-500 cursor-pointer">
//                              <div className="flex justify-between text-xs font-bold text-slate-300"><span>Batch #{block.index + 1}</span> <span>{ipfsStorage[block.ipfsCid]?.length || 0} Rows</span></div>
//                          </div>
//                      ))}
//                      <div ref={scrollRefUI} />
//                  </div>
//              </div>

//              {/* Col 2: IPFS Storage */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <HardDrive size={16} className="text-purple-500" /> <span className="text-sm font-semibold">IPFS Network</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ipfs')} className="p-3 rounded border border-slate-800 bg-slate-900/50 hover:border-purple-500 cursor-pointer flex justify-between items-center">
//                              <div className="flex items-center gap-2 text-xs text-purple-400"><FileText size={14}/> <span>Snapshot_{block.index}.json</span></div>
//                              <Lock size={12} className="text-slate-600"/>
//                          </div>
//                      ))}
//                  </div>
//              </div>

//              {/* Col 3: Ledger Anchors */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-3 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
//                      <LinkIcon size={16} className="text-emerald-500" /> <span className="text-sm font-semibold">Ledger Anchors</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar relative">
//                      <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ledger')} className="ml-4 relative p-3 rounded border border-slate-800 bg-emerald-900/10 hover:border-emerald-500 cursor-pointer">
//                              <div className="absolute -left-[21px] top-4 w-2 h-2 rounded-full bg-emerald-500"></div>
//                              <div className="text-[10px] text-emerald-400 font-mono">HASH: {block.hash.substring(0,20)}...</div>
//                          </div>
//                      ))}
//                  </div>
//              </div>
//         </div>
//       </div>

//       {/* ================= MODALS ================= */}

//       {/* 1. PHASE MONITOR WINDOW */}
//       <AnimatePresence>
//         {activePhaseWindow && (
//             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10" onClick={() => setActivePhaseWindow(null)}>
//                 <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                     <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
//                         <div className="flex items-center gap-3">
//                             <Activity className="text-blue-400 animate-pulse"/>
//                             <h2 className="text-lg font-bold text-white">Live Phase Monitor: <span className="text-blue-400">{activePhaseWindow}</span></h2>
//                         </div>
//                         <button onClick={() => setActivePhaseWindow(null)}><X className="text-slate-400 hover:text-white"/></button>
//                     </div>
//                     <div className="flex-1 overflow-auto p-4">
//                         <table className="w-full text-left text-xs text-slate-300">
//                             <thead className="bg-slate-950 text-slate-500 uppercase">
//                                 <tr>
//                                     <th className="p-3">Ref ID</th>
//                                     <th className="p-3">Entity</th>
//                                     <th className="p-3">Status</th>
//                                     <th className="p-3">Timestamp</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="divide-y divide-slate-800">
//                                 {/* Query the Local Table for this Phase */}
//                                 {(localTables[activePhaseWindow.toLowerCase()] || []).map((row, i) => (
//                                     <tr key={i} className="hover:bg-slate-800">
//                                         <td className="p-3 font-mono text-blue-300">{row.sack_id || row.batch || row.token_no}</td>
//                                         <td className="p-3">{row.mill || row.farmer || row.shop_id || "Facility"}</td>
//                                         <td className="p-3">
//                                             <span className={`px-2 py-1 rounded font-bold text-[10px] ${
//                                                 row.status?.includes('PASSED') ? 'bg-green-900 text-green-400' : 
//                                                 row.status?.includes('MILLING') ? 'bg-blue-900 text-blue-400' : 
//                                                 'bg-yellow-900 text-yellow-400'
//                                             }`}>
//                                                 {row.status}
//                                             </span>
//                                         </td>
//                                         <td className="p-3 text-slate-500">{new Date().toLocaleTimeString()}</td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                         {localTables[activePhaseWindow.toLowerCase()]?.length === 0 && (
//                             <div className="text-center p-10 text-slate-500 italic">No active assets in this phase.</div>
//                         )}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 2. INSPECTOR MODAL */}
//       <AnimatePresence>
//         {selectedBlock && viewMode && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
//              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
//                   <h2 className="font-bold text-white flex items-center gap-2"><Database className="text-blue-500"/> Block Inspector</h2>
//                   <button onClick={() => setSelectedBlock(null)}><X className="text-slate-500"/></button>
//                </div>
//                <div className="p-6 overflow-y-auto font-mono text-xs">
//                  <table className="w-full text-left">
//                    <thead className="bg-slate-800 text-slate-400">
//                      <tr>
//                         <th className="p-3">Sack ID</th>
//                         <th className="p-3">Token Ref</th>
//                         <th className="p-3">Entity (Mill/Farmer)</th>
//                         <th className="p-3">Truck No</th>
//                         <th className="p-3">Status</th>
//                         <th className="p-3">Weight</th>
//                         <th className="p-3">Docs</th>
//                      </tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {/* FIX: Ensure we read the correct data array based on viewMode */}
//                      {(ipfsStorage[selectedBlock.ipfsCid])?.slice(0, 50).map((row, i) => (
//                        <tr key={i} className={row.isCorrection ? "bg-yellow-900/10" : ""}>
//                          <td className="p-3 text-emerald-400 font-bold text-sm">{row.sack_id}</td>
//                          <td className="p-3 text-slate-500">{row.token_no}</td>
//                          <td className="p-3 flex items-center gap-2"><Factory size={12} className="text-orange-400"/> {row.entity_name}</td>
//                          <td className="p-3 text-slate-400"><Truck size={12} className="inline mr-1"/> {row.truck_no}</td>
//                          <td className="p-3"><span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{row.status}</span></td>
//                          <td className="p-3 flex items-center gap-2">
//                             {row.weight_kg}kg
//                             {isAuthority && viewMode === 'ui' && (
//                                 <button onClick={() => rectifyMistake(selectedBlock, row)} className="bg-yellow-900/40 text-yellow-500 px-1 rounded hover:bg-yellow-900 border border-yellow-700">FIX</button>
//                             )}
//                          </td>
//                          <td className="p-3">
//                              <button onClick={() => setIpfsModalData(row)} className="text-indigo-400 border border-indigo-900 bg-indigo-500/10 px-2 py-1 rounded flex items-center gap-1 hover:bg-indigo-500/20">
//                                  <FileBadge size={12} /> Cert
//                              </button>
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

//       {/* 3. INTEGRITY CHECK RESULT MODAL */}
//       <AnimatePresence>
//         {searchResult && (
//             <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={() => setSearchResult(null)}>
//                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-emerald-500 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl p-6" onClick={e => e.stopPropagation()}>
//                     <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
//                         <div>
//                             <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><ShieldCheck/> Integrity Verification</h2>
//                             <p className="text-sm text-slate-400">Provenance History for {searchQuery}</p>
//                         </div>
//                         <button onClick={() => setSearchResult(null)}><X className="text-slate-500 hover:text-white"/></button>
//                     </div>
//                     <div className="space-y-4 overflow-y-auto">
//                         {searchResult.map((tx, i) => (
//                             <div key={i} className="flex gap-4 relative">
//                                 <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center text-emerald-400 z-10 font-bold">{i+1}</div>
//                                 {i !== searchResult.length - 1 && <div className="absolute left-5 top-10 bottom-[-16px] w-px bg-slate-700"/>}
//                                 <div className="flex-1 bg-slate-800/50 p-3 rounded border border-slate-700">
//                                     <div className="flex justify-between">
//                                         <span className="font-bold text-white text-sm">{tx.phase}</span>
//                                         <span className="text-[10px] text-slate-500">{tx.timestamp}</span>
//                                     </div>
//                                     <div className="text-xs text-slate-400 mt-1">{tx.event}</div>
//                                     <div className="text-xs text-blue-400 mt-1 font-mono">Block #{100 + tx.blockIdx}</div>
//                                 </div>
//                             </div>
//                         ))}
//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* 4. IPFS POPUP */}
//       <AnimatePresence>
//         {ipfsModalData && (
//           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
//             <div className="absolute inset-0 pointer-events-auto" onClick={() => {if(certRetrievalStep === 0) setIpfsModalData(null)}}></div>
//             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-indigo-500 shadow-2xl rounded-xl w-80 p-5 pointer-events-auto relative overflow-hidden">
//                {certRetrievalStep > 0 && (
//                    <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10 space-y-3">
//                        <RefreshCw className="animate-spin text-indigo-500" size={32} />
//                        <div className="text-xs font-mono text-indigo-300">
//                            {certRetrievalStep === 1 && "Finding Peers..."}
//                            {certRetrievalStep === 2 && "Downloading Chunks..."}
//                            {certRetrievalStep === 3 && "Decrypting Content..."}
//                        </div>
//                    </div>
//                )}
//                <div className="flex items-center gap-3 mb-4">
//                   <div className="bg-indigo-500/20 p-2 rounded text-indigo-400"><HardDrive size={20}/></div>
//                   <div><h3 className="font-bold text-white text-sm">IPFS Metadata</h3><p className="text-[10px] text-slate-400">Decentralized Storage</p></div>
//                </div>
//                <div className="space-y-3 text-xs">
//                   <div className="bg-black p-3 rounded border border-slate-800">
//                      <div className="flex justify-between mb-1"><span className="text-slate-500">Target:</span> <span className="text-blue-400 font-mono">{ipfsModalData.sack_id}</span></div>
//                      <div className="flex justify-between"><span className="text-slate-500">File:</span> <span className="text-slate-300">Quality_Cert.pdf</span></div>
//                   </div>
//                   <div className="font-mono text-[10px] text-indigo-300 break-all bg-indigo-900/10 p-2 rounded border border-indigo-500/20">CID: {ipfsModalData.ipfsRef}</div>
//                   <button onClick={handleRetrieveCert} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 mt-2">
//                      <UploadCloud size={14}/> Retrieve File
//                   </button>
//                </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 5. DIGITAL CERTIFICATE */}
//       <AnimatePresence>
//           {showCertDisplay && ipfsModalData && (
//               <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setShowCertDisplay(false)}>
//                   <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
//                       <button onClick={() => setShowCertDisplay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
//                       <div className="border-4 border-double border-slate-300 p-6 text-center">
//                           <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600"/></div>
//                           <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">QUALITY CERTIFICATE</h1>
//                           <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Blockchain Ledger</p>
//                           <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded">
//                               <p><strong>This certifies that the produce:</strong></p>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Item ID:</span> <b>{ipfsModalData.sack_id}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Ref Batch:</span> <b>{ipfsModalData.token_no}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Origin Entity:</span> <b>{ipfsModalData.entity_name}</b></div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2"><span>Quality Grade:</span> <b className="text-emerald-600">GRADE A (Premium)</b></div>
//                           </div>
//                           <div className="mt-8 flex justify-between items-end">
//                               <div className="text-center">
//                                   <div className="font-dancing-script text-xl text-blue-600 mb-1">BlockchainAuth</div>
//                                   <div className="border-t border-slate-400 w-32 text-[10px] text-slate-500">Digital Signature</div>
//                               </div>
//                               <div className="w-16 h-16 bg-black p-1"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ipfsModalData.ipfsRef}`} alt="QR" /></div>
//                           </div>
//                       </div>
//                   </motion.div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 6. LOGIN MODAL */}
//       <AnimatePresence>
//         {showLogin && (
//           <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
//                <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Authority Login</h2></div>
//                <p className="text-center text-slate-400 text-sm mb-6">Enter Access Key to enable Edit Mode.</p>
//                <input 
//                  type="password" 
//                  autoFocus
//                  className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white text-center tracking-widest outline-none focus:border-purple-500 transition-colors mb-2`}
//                  placeholder="ACCESS KEY"
//                  value={inputKey}
//                  onChange={(e) => setInputKey(e.target.value)}
//                  onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
//                />
//                {loginError && <p className="text-red-500 text-xs text-center mb-4">Invalid Access Key. Try 'admin'.</p>}
//                <div className="flex gap-2 mt-4">
//                  <button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button>
//                  <button onClick={submitLogin} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">Authenticate</button>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 7. PENDING BATCH MODAL */}
//       <AnimatePresence>
//         {pendingBatch && (
//           <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
//                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
//                  <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer className="animate-pulse" /> Batch Buffer Window</h2>
//                  <div className="text-right"><div className="text-[10px] text-slate-500 uppercase">AUTO-ANCHOR IN</div><div className="text-3xl font-mono text-white">{timeLeft}s</div></div>
//                </div>
//                <div className="flex-1 overflow-y-auto p-6">
//                  {!isAuthority && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-2 mb-4 text-xs text-center rounded">READ-ONLY MODE: Log in as Authority to edit weights.</div>}
//                  <table className="w-full text-left text-sm text-slate-300">
//                    <thead className="bg-slate-950 text-slate-500 sticky top-0">
//                      <tr><th className="p-3">Sack ID</th><th className="p-3">Event</th><th className="p-3">Weight (Kg)</th><th className="p-3">Quality</th></tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800 text-slate-300">
//                      {pendingBatch.map((row, i) => (
//                        <tr key={i} className={`hover:bg-slate-800/50 ${row.isCorrection ? 'bg-yellow-900/10' : ''}`}>
//                          <td className="p-3 font-mono text-blue-300">
//                            {row.sack_id}
//                            {row.isCorrection && <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">CORRECTION</span>}
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
//                              className={`w-20 p-1 border rounded ${!isAuthority ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-black border-slate-600 text-white'}`}
//                            />
//                          </td>
//                          <td className="p-3 text-slate-500">{row.quality}</td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>
//                <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-950 rounded-b-2xl">
//                  <button onClick={() => setPendingBatch(null)} disabled={!isAuthority} className="px-6 py-3 text-slate-400 disabled:opacity-50">Discard</button>
//                  <button onClick={anchorBatch} disabled={!isAuthority} className="px-8 py-3 bg-blue-600 text-white rounded-lg flex gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"><UploadCloud/> ANCHOR</button>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 8. HACKER MODAL */}
//       <AnimatePresence>
//         {hackerMode && (
//           <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
//               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
//                 <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="text-xs text-slate-500">Target Batch Index (0-{blocks.length-1})</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Row Index (0-19)</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Inject Weight Value</label>
//                     <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
//                       value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
//                   </div>
//                   <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">
//                     EXECUTE INJECTION
//                   </button>
//                   <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
//                 </div>
//               </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// };
// export default SupplyChainDashboard;






















import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import io from 'socket.io-client';

// Connect to the Proxy (which points to Port 4001)
const socket = io();
import { 
  Database, Server, Link as LinkIcon, AlertTriangle, 
  Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
  Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
  User, UserCheck, Timer, History, Search, MapPin, 
  CheckCircle2, Box, Key, Truck, Factory, Sprout,
  Activity, FileBadge, Layout, ShoppingCart, Microscope,
  Menu, ArrowRightLeft, LogIn, LogOut, Minus,
  FileJson, Code, Layers, AlertOctagon
} from 'lucide-react';

// --- HELPER: Deterministic Hash ---
const simpleHash = (data) => {
  try {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  } catch (e) {
    return "00000000";
  }
};

const SupplyChainDashboard = () => {
  // --- STATE ---
  const [blocks, setBlocks] = useState([]); 
  const [ipfsStorage, setIpfsStorage] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [pendingBatch, setPendingBatch] = useState(null); 
  const [activeSackStates, setActiveSackStates] = useState({});
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAuthority, setIsAuthority] = useState(false);
  const [isChainBroken, setIsChainBroken] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // Track server connection

  // --- LOCAL DB STATE ---
  const [localTables, setLocalTables] = useState({
    farmer: [],
    ppc: [],
    cmr: [],
    warehouse: [],
    fps: []
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isBatchMinimized, setIsBatchMinimized] = useState(false);

  // Modals & Search
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [viewMode, setViewMode] = useState(null); 
  const [hackerMode, setHackerMode] = useState(false);
  const [hackerTarget, setHackerTarget] = useState({ blockIdx: 0, rowIdx: 0, val: '' });
  
  const [activePhaseWindow, setActivePhaseWindow] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null); 

  // --- CERTIFICATE STATE ---
  const [ipfsModalData, setIpfsModalData] = useState(null);
  const [certRetrievalStep, setCertRetrievalStep] = useState(0); 
  const [showCertDisplay, setShowCertDisplay] = useState(false);

  // Login
  const [showLogin, setShowLogin] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Counter
  const [sackCounter, setSackCounter] = useState(1000); 

  const scrollRefUI = useRef(null);

  // --- CONFIG ---
  const BATCH_SIZE = 10;
  const TIMER_DURATION = 15;
  const ACCESS_KEY = "admin"; 

  // --- TOPOLOGY LOGIC ---
  const getNextPhase = (currentPhase) => {
    if (!currentPhase) return 'FARMER';
    const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
    const idx = phases.indexOf(currentPhase);
    return phases[(idx + 1) % phases.length];
  };

  // --- REAL-TIME LISTENERS ---
  useEffect(() => {
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));
    
    // 1. Sync Timer
    socket.on('timer_tick', (t) => setTimeLeft(t));

    // 2. Load Initial 12 Rows (from the SEED log you saw)
    socket.on('initial_data', (payload) => {
        if(payload && payload.data) {
            setLocalTables(prev => ({ ...prev, farmer: payload.data }));
        }
    });

    // 3. Listen for Live Data
    socket.on('new_data', (row) => {
        // Automatically open the batch window when data arrives
        setPendingBatch(prev => prev ? [row, ...prev] : [row]); 
        
        // Update specific table based on phase
        setLocalTables(prev => {
            const table = row.phase.toLowerCase();
            const target = table === 'wh' ? 'warehouse' : table; // Handle naming mismatch
            const currentList = prev[target] || [];
            return { ...prev, [target]: [...currentList, row] };
        });
    });

    // 4. Listen for Mined Blocks
    socket.on('block_mined', (block) => {
        setBlocks(prev => [block, ...prev]);
        setIpfsStorage(prev => ({ ...prev, [block.ipfsCid]: block.data }));
        setPendingBatch(null); // Clear buffer on mine
        setIsBatchMinimized(false);
    });

    return () => { 
        socket.off('connect'); 
        socket.off('disconnect');
        socket.off('timer_tick'); 
        socket.off('initial_data');
        socket.off('new_data'); 
        socket.off('block_mined'); 
    };
  }, []);


 // --- BATCH GENERATOR (API CALL) ---
  const generateBatch = async () => {
    if (isChainBroken || !isConnected) return;

    const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
    const phase = phases[Math.floor(Math.random() * phases.length)];
    
    // Construct Payload matching your DB Schema
    let payload = {
        id: `TX-${Math.floor(Math.random()*9000)+1000}`,
        entity: "Simulated User",
        quality: "Grade A",
        weight: (Math.random() * 5000 + 1000).toFixed(2),
        status: "ACTIVE"
    };

    // Phase-specific tweaks
    if (phase === 'FARMER') payload.entity = "Ramesh Kumar";
    else if (phase === 'PPC') { 
        payload.sack_id = `SK-${Math.floor(Math.random()*9000)}`; 
        payload.entity = "PPC-04"; 
    }

    // Send to Server
    try { 
        await axios.post('/api/ingest', { phase, data: payload }); 
    } catch (e) { 
        console.error("Backend Error:", e); 
    }
  };


  
  // --- INTEGRITY CHECKER ---
  const checkIntegrity = (block) => {
      const storedData = ipfsStorage[block.ipfsCid];
      if (!storedData) return true;
      const currentDataHash = simpleHash(storedData);
      return currentDataHash === block.dataHash;
  };

  useEffect(() => {
      let compromised = false;
      blocks.forEach(block => {
          if (!checkIntegrity(block)) compromised = true;
      });
      if (compromised) {
          setIsChainBroken(true);
          setIsPlaying(false); 
          setPendingBatch(null); 
      }
  }, [blocks, ipfsStorage]);

  // --- ACTIONS ---
  const handleLoginToggle = () => { isAuthority ? setIsAuthority(false) : (setShowLogin(true), setLoginError(false), setInputKey('')); };
  const submitLogin = () => { inputKey === ACCESS_KEY ? (setIsAuthority(true), setShowLogin(false)) : setLoginError(true); };
  const updatePendingRow = (idx, field, value) => { if (!isAuthority) return; const u = [...pendingBatch]; u[idx][field] = value; setPendingBatch(u); };
  
  const anchorBatch = useCallback(() => {
    if (!pendingBatch) return;
    
    const batchData = JSON.parse(JSON.stringify(pendingBatch));
    const blockIndex = blocks.length;
    const prevHash = blockIndex > 0 ? blocks[blockIndex - 1].hash : "00000000";
    const dataHash = simpleHash(batchData);
    const cid = `Qm${dataHash}x${simpleHash(new Date().toISOString()).substring(0,6)}`;
    
    setIpfsStorage(prev => ({ ...prev, [cid]: batchData }));
    
    const newBlock = { 
        index: blockIndex, 
        timestamp: new Date().toISOString(), 
        prevHash, 
        ipfsCid: cid, 
        dataHash: dataHash,
        hash: simpleHash(cid + prevHash), 
        status: 'VALID' 
    };
    
    setBlocks(prev => [...prev, newBlock]);
    setPendingBatch(null); 
    setIsBatchMinimized(false);
    
    setTimeout(() => {
        if(scrollRefUI.current) scrollRefUI.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [pendingBatch, blocks]);

  useEffect(() => {
    let timer;
    if (pendingBatch && timeLeft > 0 && !isChainBroken) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (pendingBatch && timeLeft === 0 && !isChainBroken) {
      anchorBatch();
    }
    return () => clearInterval(timer);
  }, [pendingBatch, timeLeft, anchorBatch, isChainBroken]);

  const rectifyMistake = (oldBlock, row) => {
    if (!isAuthority) {
        alert("ACCESS DENIED: Only Authorized Personnel can Rectify data.");
        return;
    }
    if (isChainBroken) {
        alert("SYSTEM LOCKED: Chain corrupted.");
        return;
    }
    const correctionEntry = { 
        ...row, 
        event: `RECTIFY_BLK_${oldBlock.index}`, 
        quality: 'CORRECTED', 
        timestamp: new Date().toISOString(), 
        isCorrection: true 
    };
    setPendingBatch(prev => prev ? [correctionEntry, ...prev] : [correctionEntry]);
    setSelectedBlock(null);
    setIsBatchMinimized(false);
    setTimeLeft(30); 
    alert("Correction Entry added to Pending Batch.");
  };

  const executeAttack = () => {
    const { blockIdx, rowIdx, val } = hackerTarget;
    const targetBlock = blocks[blockIdx];
    if (!targetBlock) { alert("Block not found."); return; }
    
    const cid = targetBlock.ipfsCid;
    const originalData = ipfsStorage[cid];
    if (!originalData) return;

    const corruptedData = JSON.parse(JSON.stringify(originalData));
    if (corruptedData[rowIdx]) {
        corruptedData[rowIdx].weight_kg = parseFloat(val);
        corruptedData[rowIdx].isTampered = true; 
        corruptedData[rowIdx].event = "INJECTED_DATA";
    }

    setIpfsStorage(prev => ({ ...prev, [cid]: corruptedData }));
    setHackerMode(false);
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Hybrid Ledger Audit Report", 14, 20);
    let yPos = 30;
    blocks.forEach(block => {
        doc.setFontSize(10);
        doc.setTextColor(0,0,0);
        doc.text(`Block #${100 + block.index} [Hash: ${block.hash.substring(0,10)}...]`, 14, yPos);
        const rows = ipfsStorage[block.ipfsCid] || [];
        if (rows.length > 0) {
            const tableData = rows.map(r => [r.sack_id, r.token_no, r.phase, r.status, r.weight_kg]);
            autoTable(doc, { 
                startY: yPos + 5, 
                head: [['Sack ID', 'Token', 'Phase', 'Status', 'Weight']], 
                body: tableData, 
                theme: 'grid',
                styles: { fontSize: 8 }
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }
    });
    doc.save("Audit_Report.pdf");
  };

  const handleIntegrityCheck = () => {
    if (!searchQuery) return;
    const history = [];
    blocks.forEach(block => {
        const batchData = ipfsStorage[block.ipfsCid];
        if (batchData) {
            batchData.forEach(tx => {
                if (tx.sack_id && tx.sack_id.toLowerCase() === searchQuery.toLowerCase()) {
                    history.push({ ...tx, blockIdx: block.index });
                }
            });
        }
    });
    if (history.length > 0) setSearchResult(history);
    else alert(`Sack ${searchQuery} not found in Immutable Ledger.`);
  };

  const handleRetrieveCert = () => {
    setCertRetrievalStep(1); 
    setTimeout(() => setCertRetrievalStep(2), 1500); 
    setTimeout(() => setCertRetrievalStep(3), 3000); 
    setTimeout(() => { setCertRetrievalStep(0); setShowCertDisplay(true); }, 4500);
  };

  const openModal = (block, type) => { setSelectedBlock(block); setViewMode(type); };

  const SidebarItem = ({ icon, label, onClick, count }) => (
    <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
        {icon}
        {sidebarOpen && (
            <div className="flex-1 flex justify-between items-center text-sm font-medium">
                <span>{label}</span>
                {count !== undefined && <span className="bg-slate-800 border border-slate-700 text-xs px-2 py-0.5 rounded-full">{count}</span>}
            </div>
        )}
    </div>
  );

  return (
    <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden relative">
      
      {/* GLOBAL SYSTEM HALT BANNER */}
      {isChainBroken && (
          <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600 text-white font-bold text-center py-2 animate-pulse flex justify-center items-center gap-4 shadow-xl">
              <AlertOctagon size={24}/>
              CRITICAL ALERT: BLOCKCHAIN INTEGRITY COMPROMISED - SYSTEM HALTED
              <AlertOctagon size={24}/>
          </div>
      )}

      {/* 1. SIDEBAR */}
      <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 ${sidebarOpen ? 'w-64' : 'w-20'} ${isChainBroken ? 'grayscale pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-6 px-1">
            {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500"/> HYBRID LEDGER</span>}
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18}/></button>
        </div>
        <div className="space-y-6 flex-1 overflow-y-auto">
            <div>
                {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">Operations</div>}
                <SidebarItem icon={<Sprout size={20} className="text-green-500"/>} label="Farmer Harvests" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
                <SidebarItem icon={<Factory size={20} className="text-orange-500"/>} label="PPC Procurement" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
                <SidebarItem icon={<Factory size={20} className="text-blue-500"/>} label="Rice Mills (CMR)" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
                <SidebarItem icon={<Box size={20} className="text-cyan-500"/>} label="Central Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
                <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500"/>} label="FPS Distribution" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
            </div>
            <div>
                {sidebarOpen && <div className="text-[10px] uppercase text-slate-500 font-bold mb-2 px-2">System</div>}
                <SidebarItem icon={<Database size={20}/>} label="Operational DB" onClick={() => alert("Active DB Connection: Healthy")} />
                <SidebarItem icon={<HardDrive size={20}/>} label="IPFS Nodes" onClick={() => alert("IPFS Swarm: 45 Peers Connected")} />
            </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 2. HEADER */}
        <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {!sidebarOpen && <Server size={20} className="text-blue-500" />} 
                Dashboard Console
            </h2>

            <div className="flex items-center gap-4">
                <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5 focus-within:border-blue-500 transition-colors">
                    <ShieldCheck size={14} className="text-emerald-500 mr-2"/>
                    <input 
                        className="bg-transparent border-none outline-none text-xs text-white w-48 placeholder-slate-600 font-mono"
                        placeholder="Verify Sack ID (e.g. SK-1005)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleIntegrityCheck()}
                    />
                    <button onClick={handleIntegrityCheck} className="text-slate-500 hover:text-white"><Search size={14}/></button>
                </div>

                <div className="h-6 w-px bg-slate-700"></div>

                <div className="flex gap-2">
                    <button 
                        onClick={handleLoginToggle} 
                        className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${
                            isAuthority 
                            ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                        disabled={isChainBroken}
                    >
                        {isAuthority ? <><UserCheck size={14} /> AUTHORITY ACCESS</> : <><LogIn size={14}/> VIEWER LOGIN</>}
                    </button>

                    {!isPlaying && !pendingBatch ? 
                        <button onClick={() => setIsPlaying(true)} disabled={isChainBroken} className="p-1.5 text-emerald-400 bg-emerald-900/20 border border-emerald-900 rounded hover:bg-emerald-900/40 disabled:opacity-50"><Play size={16}/></button> :
                        <button onClick={() => setIsPlaying(false)} disabled={isChainBroken} className="p-1.5 text-yellow-400 bg-yellow-900/20 border border-yellow-900 rounded hover:bg-yellow-900/40 disabled:opacity-50"><Pause size={16}/></button>
                    }
                    
                    <button onClick={() => setHackerMode(true)} className="p-1.5 text-red-400 bg-red-900/20 border border-red-900 rounded hover:bg-red-900/40"><Edit3 size={16}/></button>
                    <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="Download Audit Report"><FileText size={16}/></button>
                </div>
            </div>
        </header>

        {/* 3. MAIN GRID */}
        <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
             
             {/* Col 1: Operational CSV */}
             <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
                     <Database size={18} className="text-blue-500" /> <span className="font-semibold text-sm">Operational CSV</span>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {blocks.map((block) => {
                         const isValid = checkIntegrity(block);
                         return (
                             <div key={block.index} onClick={() => openModal(block, 'ui')} className={`p-5 rounded-xl border ${isValid ? 'border-slate-800 bg-slate-900/50 hover:border-blue-500' : 'border-red-500 bg-red-900/20 animate-pulse'} cursor-pointer shadow-sm group`}>
                                 <div className="flex justify-between items-center mb-2">
                                     <span className={`text-base font-bold transition-colors ${isValid ? 'text-white group-hover:text-blue-400' : 'text-red-400'}`}>Batch #{block.index + 1}</span> 
                                     <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-mono">{ipfsStorage[block.ipfsCid]?.length || 0} Events</span>
                                 </div>
                                 <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <Activity size={12} className={isValid ? "text-blue-500" : "text-red-500"}/>
                                    <span className="uppercase tracking-wider">Status: {isValid ? <span className="text-emerald-500 font-bold">SYNCED</span> : <span className="text-red-500 font-bold">CORRUPTED</span>}</span>
                                 </div>
                             </div>
                         );
                     })}
                     <div ref={scrollRefUI} />
                 </div>
             </div>

             {/* Col 2: IPFS Storage */}
             <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
                     <HardDrive size={18} className="text-purple-500" /> <span className="font-semibold text-sm">IPFS Network</span>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                     {blocks.map((block) => {
                         const isValid = checkIntegrity(block);
                         return (
                             <div key={block.index} onClick={() => openModal(block, 'ipfs')} className={`p-5 rounded-xl border ${isValid ? 'border-slate-800 bg-slate-900/50 hover:border-purple-500' : 'border-red-500 bg-red-900/20'} cursor-pointer shadow-sm group flex items-center gap-4`}>
                                 <div className={`p-3 rounded-lg ${isValid ? 'bg-purple-900/20 text-purple-400' : 'bg-red-900/20 text-red-400'}`}>
                                     <FileJson size={24} />
                                 </div>
                                 <div className="flex-1">
                                     <div className="text-sm font-bold text-white mb-1">Snapshot_{block.index + 1}.json</div>
                                     <div className="text-xs text-slate-500 font-mono truncate w-40">{block.ipfsCid}</div>
                                 </div>
                                 <Lock size={16} className="text-slate-600 group-hover:text-purple-400"/>
                             </div>
                         );
                     })}
                 </div>
             </div>

             {/* Col 3: Ledger Anchors */}
             <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                 <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center gap-2 shrink-0">
                     <LinkIcon size={18} className="text-emerald-500" /> <span className="font-semibold text-sm">Ledger Anchors</span>
                 </div>
                 <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
                     <div className="absolute left-7 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
                     {blocks.map((block) => {
                         const isValid = checkIntegrity(block);
                         return (
                             <div key={block.index} onClick={() => openModal(block, 'ledger')} className={`ml-8 relative p-5 rounded-xl border ${isValid ? 'border-slate-800 bg-emerald-900/5 hover:border-emerald-500' : 'border-red-500 bg-red-900/20'} cursor-pointer shadow-sm group`}>
                                 <div className={`absolute -left-[41px] top-7 w-3 h-3 rounded-full ring-4 ring-slate-900 ${isValid ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                 <div className="flex justify-between items-center mb-1">
                                    <div className={`text-lg font-bold ${isValid ? 'text-emerald-400' : 'text-red-400'}`}>BLOCK #{100 + block.index}</div>
                                    <span className="text-[10px] text-slate-600 font-mono border border-slate-700 px-2 rounded">{block.timestamp.split('T')[1].substring(0,8)}</span>
                                 </div>
                                 <div className="text-xs text-slate-500 font-mono flex items-center gap-2"><LinkIcon size={10}/> ANCHORED</div>
                             </div>
                         );
                     })}
                 </div>
             </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* 1. TAILORED INSPECTOR MODAL */}
      <AnimatePresence>
        {selectedBlock && viewMode && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
             <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                  <h2 className="font-bold text-white flex items-center gap-2">
                      {viewMode === 'ui' && <><Database className="text-blue-500"/> Operational Data Inspector</>}
                      {viewMode === 'ipfs' && <><Code className="text-purple-500"/> IPFS Content Viewer</>}
                      {viewMode === 'ledger' && <><LinkIcon className="text-emerald-500"/> Blockchain Ledger Anchor</>}
                  </h2>
                  <button onClick={() => setSelectedBlock(null)}><X className="text-slate-500 hover:text-white"/></button>
               </div>
               
               {/* VIEW A: DATA TABLE */}
               {viewMode === 'ui' && (
                   <div className="p-6 overflow-y-auto font-mono text-xs">
                     <table className="w-full text-left">
                       <thead className="bg-slate-800 text-slate-400">
                         <tr>
                            <th className="p-3">Sack ID</th>
                            <th className="p-3">Token Ref</th>
                            <th className="p-3">Entity</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Docs</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-800 text-slate-300">
                         {(ipfsStorage[selectedBlock.ipfsCid] || []).map((row, i) => (
                           <tr key={i} className={`${row.isCorrection ? "bg-yellow-900/10" : ""} ${row.isTampered ? "bg-red-900/30 border-l-4 border-red-500" : ""}`}>
                             <td className="p-3 text-emerald-400 font-bold text-sm">
                                {row.sack_id} 
                                {row.isCorrection && <span className="ml-2 bg-yellow-500 text-black px-1 rounded text-[9px]">CORRECTED</span>}
                                {row.isTampered && <span className="ml-2 bg-red-600 text-white px-1 rounded text-[9px]">TAMPERED</span>}
                             </td>
                             <td className="p-3 text-slate-500">{row.token_no}</td>
                             <td className="p-3">{row.entity_name}</td>
                             <td className="p-3"><span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded">{row.status}</span></td>
                             <td className="p-3">
                                 {isAuthority && !isChainBroken && (
                                     <button onClick={() => rectifyMistake(selectedBlock, row)} className="bg-yellow-900/40 text-yellow-500 px-2 py-1 rounded border border-yellow-700 mr-2 hover:bg-yellow-900">FIX</button>
                                 )}
                                 <button onClick={() => setIpfsModalData(row)} className="text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-900 hover:bg-indigo-500/20">Cert</button>
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
               )}

               {/* VIEW B: JSON CODE (SCROLL FIXED) */}
               {viewMode === 'ipfs' && (
                   <div className="p-6 flex flex-col h-full bg-[#0d1117]">
                       <div className="flex items-center justify-between text-slate-400 text-xs mb-2 px-2">
                           <span className="font-mono">source.json</span>
                           <span className="flex items-center gap-1"><Lock size={12}/> Read-Only</span>
                       </div>
                       <div className="bg-black p-4 rounded-xl border border-slate-800 flex-1 overflow-auto font-mono text-xs text-green-400 max-h-[50vh]">
                           <pre>{JSON.stringify(ipfsStorage[selectedBlock.ipfsCid], null, 2)}</pre>
                       </div>
                       <div className="mt-4 flex justify-between items-center text-slate-500 text-xs px-2">
                           <span className="font-mono">CID: {selectedBlock.ipfsCid}</span>
                           <span>Size: 24 KB</span>
                       </div>
                   </div>
               )}

               {/* VIEW C: LEDGER RECEIPT */}
               {viewMode === 'ledger' && (
                   <div className="p-10 flex flex-col items-center justify-center h-full space-y-8">
                       <div className="w-28 h-28 bg-emerald-500/10 rounded-full flex items-center justify-center border-4 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                           <CheckCircle2 size={64} className="text-emerald-500"/>
                       </div>
                       <div className="text-center space-y-2">
                           <h3 className="text-3xl font-bold text-white">Block #{100 + selectedBlock.index}</h3>
                           <p className="text-slate-400 text-sm">Confirmed at {selectedBlock.timestamp}</p>
                       </div>
                       <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                           <div className="bg-slate-800 p-4 rounded text-center border border-slate-700">
                               <div className="text-[10px] text-slate-500 uppercase">Assets Anchored</div>
                               <div className="text-xl font-bold text-white">{ipfsStorage[selectedBlock.ipfsCid]?.length || 0}</div>
                           </div>
                           <div className="bg-slate-800 p-4 rounded text-center border border-slate-700">
                               <div className="text-[10px] text-slate-500 uppercase">Network</div>
                               <div className="text-xl font-bold text-white">Polygon PoS</div>
                           </div>
                       </div>
                       <div className="bg-black p-4 rounded-lg border border-emerald-900 w-full max-w-lg text-center">
                           <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-widest">Merkle Root Hash</div>
                           <div className="text-emerald-400 font-mono text-sm break-all">{selectedBlock.hash}</div>
                       </div>
                   </div>
               )}

             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. SPLIT-PANE VERIFICATION MODAL */}
      <AnimatePresence>
        {searchResult && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-10" onClick={() => setSearchResult(null)}>
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-emerald-500 rounded-xl w-full max-w-5xl h-[70vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-emerald-900 bg-emerald-900/10 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><ShieldCheck/> Integrity Verified</h2>
                            <p className="text-sm text-slate-400">Asset: <span className="text-white font-mono">{searchQuery}</span></p>
                        </div>
                        <button onClick={() => setSearchResult(null)}><X className="text-slate-500 hover:text-white"/></button>
                    </div>
                    <div className="flex-1 flex overflow-hidden">
                        
                        {/* LEFT PANE: LOCAL TRUTH */}
                        <div className="flex-1 border-r border-slate-800 p-6 overflow-y-auto">
                            <h3 className="text-sm font-bold text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-wide"><Database size={16}/> Local DB Record</h3>
                            <div className="space-y-6">
                                {searchResult.map((tx, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-slate-700">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${tx.isCorrection ? 'border-yellow-500 bg-yellow-900' : 'border-blue-500 bg-slate-900'}`}></div>
                                        <div className={`p-4 rounded border ${tx.isCorrection ? 'border-yellow-500/30 bg-yellow-900/10' : 'border-slate-700 bg-slate-800/50'}`}>
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="font-bold text-white">{tx.phase}</span>
                                                <span className="text-slate-500">{tx.timestamp.split('T')[1].substring(0,8)}</span>
                                            </div>
                                            <div className="text-sm text-slate-300">{tx.event}</div>
                                            {tx.isCorrection && <div className="mt-2 text-[10px] text-yellow-500 font-bold bg-yellow-900/20 inline-block px-2 py-1 rounded">CORRECTION ENTRY</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* CENTER LINK */}
                        <div className="w-12 bg-slate-950 flex flex-col items-center justify-center border-r border-slate-800">
                            <div className="h-full w-px bg-emerald-500/20 absolute"></div>
                            <div className="z-10 bg-emerald-900 p-2 rounded-full border border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                                <LinkIcon size={16}/>
                            </div>
                        </div>

                        {/* RIGHT PANE: CHAIN TRUTH */}
                        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/30">
                            <h3 className="text-sm font-bold text-emerald-400 mb-6 flex items-center gap-2 uppercase tracking-wide"><LinkIcon size={16}/> Blockchain Proof</h3>
                            <div className="space-y-6">
                                {searchResult.map((tx, i) => (
                                    <div key={i} className="relative pl-6 border-l-2 border-emerald-900/50">
                                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-emerald-500 bg-slate-900"></div>
                                        <div className="p-4 rounded border border-emerald-900/30 bg-emerald-900/5">
                                            <div className="flex justify-between text-xs mb-2">
                                                <span className="font-bold text-emerald-300">Block #{100 + tx.blockIdx}</span>
                                                <span className="text-emerald-600 text-[10px]">CONFIRMED</span>
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-500 break-all mb-2">Hash: {simpleHash(JSON.stringify(tx))}</div>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                                <CheckCircle2 size={12} className="text-emerald-500"/> 
                                                <span>Cryptographic Match</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 3. PENDING BATCH MODAL (WITH MINIMIZE) */}
      <AnimatePresence>
        {pendingBatch && !isBatchMinimized && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
             <div className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
                 <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer className="animate-pulse" /> Batch Buffer Window</h2>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Auto-Anchor in {timeLeft}s</span>
                 </div>
                 <button onClick={() => setIsBatchMinimized(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Minus size={20}/></button>
               </div>
               <div className="flex-1 overflow-y-auto p-6">
                 {!isAuthority && <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-2 mb-4 text-xs text-center rounded">READ-ONLY MODE: Log in as Authority to edit weights.</div>}
                 <table className="w-full text-left text-sm text-slate-300">
                   <thead className="bg-slate-950 text-slate-500 sticky top-0">
                     <tr><th className="p-3">Sack ID</th><th className="p-3">Event</th><th className="p-3">Weight (Kg)</th><th className="p-3">Quality</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-800 text-slate-300">
                     {pendingBatch.map((row, i) => (
                       <tr key={i} className={`hover:bg-slate-800/50 ${row.isCorrection ? 'bg-yellow-900/10' : ''}`}>
                         <td className="p-3 font-mono text-blue-300">{row.sack_id}</td>
                         <td className="p-3">{row.event}</td>
                         <td className="p-3">
                           <input 
                             type="number" 
                             value={row.weight_kg} 
                             onChange={(e) => updatePendingRow(i, 'weight_kg', parseFloat(e.target.value))}
                             disabled={!isAuthority}
                             className={`w-20 p-1 border rounded ${!isAuthority ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' : 'bg-black border-slate-600 text-white'}`}
                           />
                         </td>
                         <td className="p-3 text-slate-500">{row.quality}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
               <div className="p-6 border-t border-slate-800 flex justify-between bg-slate-950 rounded-b-2xl">
                 <button onClick={() => setPendingBatch(null)} disabled={!isAuthority} className="px-6 py-3 text-slate-400 disabled:opacity-50">Discard</button>
                 <button onClick={anchorBatch} disabled={!isAuthority} className="px-8 py-3 bg-blue-600 text-white rounded-lg flex gap-2 disabled:bg-slate-700 disabled:cursor-not-allowed"><UploadCloud/> ANCHOR</button>
               </div>
             </div>
          </div>
        )}
        
        {/* Minimized Timer Bar */}
        {pendingBatch && isBatchMinimized && (
            <div className="fixed bottom-4 right-4 bg-slate-900 border border-blue-500 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce">
                <div className="text-blue-400 font-bold flex items-center gap-2"><Timer size={16}/> {timeLeft}s</div>
                <button onClick={() => setIsBatchMinimized(false)} className="text-xs bg-slate-800 px-3 py-1 rounded hover:bg-slate-700">Expand</button>
            </div>
        )}
      </AnimatePresence>

      {/* 4. REVERTED LOGIN MODAL (SIMPLE) */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
             <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
               <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Authority Login</h2></div>
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
             </div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. IPFS & CERT RETRIEVAL & DISPLAY */}
      <AnimatePresence>
        {ipfsModalData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="absolute inset-0 pointer-events-auto" onClick={() => {if(certRetrievalStep === 0) setIpfsModalData(null)}}></div>
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-slate-900 border border-indigo-500 shadow-2xl rounded-xl w-80 p-5 pointer-events-auto relative overflow-hidden">
               {certRetrievalStep > 0 && (
                   <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10 space-y-3">
                       <RefreshCw className="animate-spin text-indigo-500" size={32} />
                       <div className="text-xs font-mono text-indigo-300">
                           {certRetrievalStep === 1 && "Finding Peers..."}
                           {certRetrievalStep === 2 && "Downloading Chunks..."}
                           {certRetrievalStep === 3 && "Decrypting Content..."}
                       </div>
                   </div>
               )}
               <div className="flex items-center gap-3 mb-4">
                  <div className="bg-indigo-500/20 p-2 rounded text-indigo-400"><HardDrive size={20}/></div>
                  <div><h3 className="font-bold text-white text-sm">IPFS Metadata</h3><p className="text-[10px] text-slate-400">Decentralized Storage</p></div>
               </div>
               <div className="space-y-3 text-xs">
                  <div className="bg-black p-3 rounded border border-slate-800">
                     <div className="flex justify-between mb-1"><span className="text-slate-500">Target:</span> <span className="text-blue-400 font-mono">{ipfsModalData.sack_id}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">File:</span> <span className="text-slate-300">Quality_Cert.pdf</span></div>
                  </div>
                  <div className="font-mono text-[10px] text-indigo-300 break-all bg-indigo-900/10 p-2 rounded border border-indigo-500/20">CID: {ipfsModalData.ipfsRef}</div>
                  <button onClick={handleRetrieveCert} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded font-bold flex items-center justify-center gap-2 mt-2">
                     <UploadCloud size={14}/> Retrieve File
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
          {showCertDisplay && ipfsModalData && (
              <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setShowCertDisplay(false)}>
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                      <button onClick={() => setShowCertDisplay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
                      <div className="border-4 border-double border-slate-300 p-6 text-center">
                          <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600"/></div>
                          <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">QUALITY CERTIFICATE</h1>
                          <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Blockchain Ledger</p>
                          <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded">
                              <p><strong>This certifies that the produce:</strong></p>
                              <div className="flex justify-between border-b border-slate-200 pb-2"><span>Item ID:</span> <b>{ipfsModalData.sack_id}</b></div>
                              <div className="flex justify-between border-b border-slate-200 pb-2"><span>Ref Batch:</span> <b>{ipfsModalData.token_no}</b></div>
                              <div className="flex justify-between border-b border-slate-200 pb-2"><span>Origin Entity:</span> <b>{ipfsModalData.entity_name}</b></div>
                              <div className="flex justify-between border-b border-slate-200 pb-2"><span>Quality Grade:</span> <b className="text-emerald-600">GRADE A (Premium)</b></div>
                          </div>
                          <div className="mt-8 flex justify-between items-end">
                              <div className="text-center">
                                  <div className="font-dancing-script text-xl text-blue-600 mb-1">BlockchainAuth</div>
                                  <div className="border-t border-slate-400 w-32 text-[10px] text-slate-500">Digital Signature</div>
                              </div>
                              <div className="w-16 h-16 bg-black p-1"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ipfsModalData.ipfsRef}`} alt="QR" /></div>
                          </div>
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>

      {/* 6. PHASE MONITOR */}
      <AnimatePresence>
        {activePhaseWindow && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-10" onClick={() => setActivePhaseWindow(null)}>
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-slate-600 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Activity className="text-blue-400 animate-pulse"/>
                            <h2 className="text-lg font-bold text-white">Live Phase Monitor: <span className="text-blue-400">{activePhaseWindow}</span></h2>
                        </div>
                        <button onClick={() => setActivePhaseWindow(null)}><X className="text-slate-400 hover:text-white"/></button>
                    </div>
                    <div className="flex-1 overflow-auto p-4">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950 text-slate-500 uppercase">
                                <tr>
                                    <th className="p-3">Ref ID</th>
                                    <th className="p-3">Entity</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {(localTables[activePhaseWindow.toLowerCase()] || []).map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-800">
                                        <td className="p-3 font-mono text-blue-300">{row.sack_id || row.id}</td>
                                        <td className="p-3">ACTIVE</td>
                                        <td className="p-3"><span className="bg-green-900/20 text-green-400 px-2 py-1 rounded">SYNCED</span></td>
                                        <td className="p-3 text-slate-500">{new Date().toLocaleTimeString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 8. HACKER MODAL */}
      <AnimatePresence>
        {hackerMode && (
          <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
                <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-500">Target Batch Index</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                      value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Row Index</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                      value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Inject Weight Value</label>
                    <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
                      value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
                  </div>
                  <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">EXECUTE INJECTION</button>
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








// import React, { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import jsPDF from 'jspdf';
// import autoTable from 'jspdf-autotable';
// import axios from 'axios';
// import io from 'socket.io-client';
// import { 
//   Database, Server, Link as LinkIcon, AlertTriangle, 
//   Play, Pause, RefreshCw, ShieldCheck, ShieldAlert,
//   Edit3, HardDrive, FileText, UploadCloud, Lock, X, 
//   User, UserCheck, Timer, History, Search, MapPin, 
//   CheckCircle2, Box, Key, Truck, Factory, Sprout,
//   Activity, FileBadge, Layout, ShoppingCart, Microscope,
//   Menu, ArrowRightLeft, LogIn, LogOut, Minus,
//   FileJson, Code, Layers, AlertOctagon
// } from 'lucide-react';

// // --- CONNECT TO BACKEND ---
// const socket = io(); 

// const SupplyChainDashboard = () => {
//   // --- STATE ---
//   const [blocks, setBlocks] = useState([]); 
//   const [ipfsStorage, setIpfsStorage] = useState({});
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [pendingBatch, setPendingBatch] = useState([]); 
//   const [timeLeft, setTimeLeft] = useState(15);
  
//   // Login & Auth State (Restored Purple Theme)
//   const [isAuthority, setIsAuthority] = useState(false);
//   const [showLogin, setShowLogin] = useState(false);
//   const [inputKey, setInputKey] = useState('');
//   const [loginError, setLoginError] = useState(false);
  
//   const [isChainBroken, setIsChainBroken] = useState(false);
//   const [isConnected, setIsConnected] = useState(false); // Connection Check

//   // Tables
//   const [localTables, setLocalTables] = useState({
//     farmer: [], ppc: [], cmr: [], warehouse: [], fps: []
//   });
  
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [isBatchMinimized, setIsBatchMinimized] = useState(false);

//   // Modals
//   const [selectedBlock, setSelectedBlock] = useState(null);
//   const [viewMode, setViewMode] = useState(null); 
//   const [hackerMode, setHackerMode] = useState(false);
//   const [activePhaseWindow, setActivePhaseWindow] = useState(null);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResult, setSearchResult] = useState(null);
  
//   // Certificate
//   const [ipfsModalData, setIpfsModalData] = useState(null);
//   const [certRetrievalStep, setCertRetrievalStep] = useState(0); 
//   const [showCertDisplay, setShowCertDisplay] = useState(false);
  
//   const scrollRefUI = useRef(null);
//   const ACCESS_KEY = "admin"; 

//   // --- 1. REAL-TIME LISTENERS ---
//   useEffect(() => {
//     socket.on('connect', () => setIsConnected(true));
//     socket.on('disconnect', () => setIsConnected(false));

//     socket.on('timer_tick', (t) => setTimeLeft(t));

//     socket.on('new_data', (row) => {
//         // IMPORTANT: This triggers the "Timer Window" to appear
//         setPendingBatch(prev => [row, ...prev]); 
//         setLocalTables(prev => {
//             const table = row.phase.toLowerCase();
//             const target = table === 'wh' ? 'warehouse' : table;
//             if (prev[target] || target === 'warehouse') {
//                 const currentList = prev[target] || [];
//                 return { ...prev, [target]: [...currentList, row] };
//             }
//             return prev;
//         });
//     });

//     socket.on('block_mined', (block) => {
//         setBlocks(prev => [block, ...prev]);
//         setIpfsStorage(prev => ({ ...prev, [block.ipfsCid]: block.data }));
//         setPendingBatch([]); // Clears the window
//         setIsBatchMinimized(false);
//         setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
//     });

//     return () => { 
//         socket.off('connect');
//         socket.off('disconnect');
//         socket.off('timer_tick'); 
//         socket.off('new_data'); 
//         socket.off('block_mined'); 
//     };
//   }, []);

//   // --- 2. DATA GENERATOR ---
//   const generateBatch = async () => {
//     if (isChainBroken) return;
//     if (!isConnected) {
//         console.error("Backend Disconnected");
//         return;
//     }

//     const phases = ['FARMER', 'PPC', 'CMR', 'WH', 'FPS'];
//     const phase = phases[Math.floor(Math.random() * phases.length)];
    
//     let payload = {};

//     if (phase === 'FARMER') {
//         payload = {
//             id: `TX-${Math.floor(Math.random()*9000)+1000}`,
//             entity: ["Ramesh Kumar", "Suresh Reddy", "Mahesh Yadav"][Math.floor(Math.random()*3)],
//             quality: Math.random() > 0.5 ? "Sana (Grade A)" : "Dodu (Grade B)",
//             weight: (Math.random() * 5000 + 1000).toFixed(2),
//             status: "HARVESTED"
//         };
//     } else if (phase === 'PPC') {
//         payload = {
//             sack_id: `SK-${Math.floor(Math.random()*90000)+10000}`,
//             token_no: `TKN-${Math.floor(Math.random()*9000)}`,
//             entity: "PPC Centre 04",
//             weight: 50.00,
//             status: "WEIGHED"
//         };
//     } else if (phase === 'CMR') {
//          payload = {
//             sack_id: `SK-${Math.floor(Math.random()*90000)+10000}`, 
//             token_no: `RCPT-${Math.floor(Math.random()*9000)}`,
//             truck: `TS-${Math.floor(Math.random()*99)}`,
//             entity: "Sri Laxmi Mills",
//             status: "MILLED"
//         };
//     } else if (phase === 'WH') {
//          payload = {
//             sack_id: `SK-${Math.floor(Math.random()*90000)+10000}`,
//             entity: "Central Zone Warehouse",
//             status: "STORED"
//         };
//     } else if (phase === 'FPS') {
//          payload = {
//             entity: "FPS-102 (Ration Shop)",
//             token_no: `ALLOC-${Math.floor(Math.random()*500)}`,
//             status: "DISTRIBUTED"
//         };
//     }

//     try { 
//         await axios.post('/api/ingest', { phase, data: payload });
//     } catch (e) { 
//         console.error("Backend Error:", e);
//     }
//   };

//   useEffect(() => {
//     let interval;
//     if (isPlaying && !isChainBroken) {
//       interval = setInterval(generateBatch, 2000); 
//     }
//     return () => clearInterval(interval);
//   }, [isPlaying, isChainBroken, isConnected]);

//   // --- ACTIONS ---
  
//   // RESTORED: Purple Login Logic
//   const handleLoginToggle = () => { 
//       if (isAuthority) {
//           setIsAuthority(false); 
//       } else {
//           setShowLogin(true); 
//           setLoginError(false); 
//           setInputKey(''); 
//       } 
//   };
  
//   const submitLogin = () => { 
//       if (inputKey === ACCESS_KEY) { 
//           setIsAuthority(true); 
//           setShowLogin(false); 
//       } else { 
//           setLoginError(true); 
//       } 
//   };

//   const executeAttack = () => { 
//       setIsChainBroken(true); 
//       setIsPlaying(false); 
//       setHackerMode(false); 
//   };
  
//   const handleDownloadPDF = () => {
//     const doc = new jsPDF();
//     doc.text("AgriFlow Audit Report", 14, 20);
//     doc.save("Audit.pdf");
//   };

//   const handleIntegrityCheck = () => {
//     if (!searchQuery) return;
//     const history = [];
//     blocks.forEach(block => {
//         const batchData = ipfsStorage[block.ipfsCid];
//         if (batchData) {
//             batchData.forEach(tx => {
//                 if ((tx.sack_id && tx.sack_id.includes(searchQuery)) || (tx.id && tx.id.includes(searchQuery))) {
//                     history.push({ ...tx, blockIdx: block.index });
//                 }
//             });
//         }
//     });
//     if (history.length > 0) setSearchResult(history);
//     else alert(`ID ${searchQuery} not found in Immutable Ledger.`);
//   };

//   const handleRetrieveCert = () => { 
//       setCertRetrievalStep(1); 
//       setTimeout(() => setCertRetrievalStep(2), 1500); 
//       setTimeout(() => setCertRetrievalStep(3), 3000); 
//       setTimeout(() => { 
//           setCertRetrievalStep(0); 
//           setShowCertDisplay(true); 
//       }, 4500); 
//   };

//   const openModal = (block, type) => { 
//       setSelectedBlock(block); 
//       setViewMode(type); 
//   };

//   // --- COMPONENTS ---
//   const SidebarItem = ({ icon, label, onClick, count }) => (
//     <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
//         {icon}
//         {sidebarOpen && (
//             <div className="flex-1 flex justify-between text-sm">
//                 <span>{label}</span>
//                 {count !== undefined && <span className="bg-slate-800 px-2 rounded-full text-xs">{count}</span>}
//             </div>
//         )}
//     </div>
//   );

//   return (
//     <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden relative">
      
//       {/* SYSTEM HALTED ALERT */}
//       {isChainBroken && (
//           <div className="absolute top-0 left-0 right-0 z-[100] bg-red-600 text-white font-bold text-center py-2 animate-pulse flex justify-center items-center gap-4 shadow-xl">
//               <AlertOctagon size={24}/> CRITICAL ALERT: SYSTEM HALTED - INTEGRITY COMPROMISED <AlertOctagon size={24}/>
//           </div>
//       )}

//       {/* SIDEBAR NAVIGATION */}
//       <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
//         <div className="flex justify-between items-center mb-6 px-1">
//             {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500"/> AGRIFLOW</span>}
//             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18}/></button>
//         </div>
//         <div className="space-y-6 flex-1 overflow-y-auto">
//             <div>
//                 <SidebarItem icon={<Sprout size={20} className="text-green-500"/>} label="Farmer (Grains)" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-orange-500"/>} label="PPC (Sacks)" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
//                 <SidebarItem icon={<Factory size={20} className="text-blue-500"/>} label="Rice Mills" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
//                 <SidebarItem icon={<Box size={20} className="text-cyan-500"/>} label="Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
//                 <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500"/>} label="FPS Shops" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
//             </div>
//         </div>
//         <div className="mt-auto border-t border-slate-800 pt-4">
//              {sidebarOpen && (
//                  <div className="text-xs text-center">
//                      <div className={`flex items-center justify-center gap-2 mb-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
//                          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
//                          {isConnected ? "Backend Connected" : "Backend Offline"}
//                      </div>
//                      <span className="text-slate-500">Port 4001</span>
//                  </div>
//              )}
//         </div>
//       </div>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* HEADER */}
//         <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm">
//             <h2 className="text-lg font-bold text-white flex items-center gap-2">{!sidebarOpen && <Server size={20} className="text-blue-500" />} Dashboard Console</h2>
//             <div className="flex items-center gap-4">
//                 <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5">
//                     <ShieldCheck size={14} className="text-emerald-500 mr-2"/>
//                     <input className="bg-transparent border-none outline-none text-xs text-white w-48 font-mono" placeholder="Verify ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleIntegrityCheck()} />
//                     <button onClick={handleIntegrityCheck} className="text-slate-500 hover:text-white"><Search size={14}/></button>
//                 </div>
//                 <div className="h-6 w-px bg-slate-700"></div>
//                 <div className="flex gap-2">
                    
//                     {/* RESTORED: Purple Auth Button */}
//                     <button 
//                         onClick={handleLoginToggle} 
//                         className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${
//                             isAuthority 
//                             ? 'bg-purple-900/30 border-purple-500 text-purple-300 hover:bg-purple-900/50' 
//                             : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700 hover:text-white'
//                         }`}
//                         disabled={isChainBroken}
//                     >
//                         {isAuthority ? <><UserCheck size={14} /> AUTHORITY ACCESS</> : <><LogIn size={14}/> VIEWER LOGIN</>}
//                     </button>

//                     <button onClick={() => setIsPlaying(!isPlaying)} disabled={isChainBroken || !isConnected} className="p-1.5 text-emerald-400 border border-emerald-900 rounded disabled:opacity-50 hover:bg-emerald-900/20 transition-colors">
//                         {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
//                     </button>
//                     <button onClick={() => setHackerMode(true)} className="p-1.5 text-red-400 border border-red-900 rounded hover:bg-red-900/20 transition-colors">
//                         <Edit3 size={16}/>
//                     </button>
//                     <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700" title="Download Report"><FileText size={16}/></button>
//                 </div>
//             </div>
//         </header>

//         {/* MAIN GRID COLUMNS */}
//         <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">
             
//              {/* COLUMN 1: OPERATIONAL DB */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                      <Database size={18} className="text-blue-500" /> 
//                      <span className="font-semibold text-sm">Operational DB (Live)</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
//                      {blocks.length === 0 && <div className="text-center text-slate-600 text-xs mt-10">Waiting for data... <br/> {isConnected ? "Press Play." : "Connecting to Backend..."}</div>}
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ui')} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-blue-500 cursor-pointer shadow-sm group transition-all">
//                              <div className="flex justify-between items-center mb-2">
//                                  <span className="text-base font-bold text-white">Batch #{block.index}</span> 
//                                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{block.data.length} Rows</span>
//                              </div>
//                              <div className="text-xs text-slate-500 uppercase tracking-wider flex justify-between">
//                                  <span>Status:</span> 
//                                  <span className="text-emerald-500 font-bold">SYNCED</span>
//                              </div>
//                          </div>
//                      ))}
//                      <div ref={scrollRefUI} />
//                  </div>
//              </div>

//              {/* COLUMN 2: IPFS STORAGE */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                      <HardDrive size={18} className="text-purple-500" /> 
//                      <span className="font-semibold text-sm">IPFS Storage (Hashes)</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ipfs')} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-purple-500 cursor-pointer flex items-center gap-4 transition-all">
//                              <div className="bg-purple-900/20 p-3 rounded-lg text-purple-400">
//                                  <FileJson size={24} />
//                              </div>
//                              <div className="flex-1 overflow-hidden">
//                                  <div className="text-sm font-bold text-white mb-1">Snapshot_{block.index}.json</div>
//                                  <div className="text-xs text-slate-500 font-mono truncate">{block.ipfsCid}</div>
//                              </div>
//                          </div>
//                      ))}
//                  </div>
//              </div>

//              {/* COLUMN 3: IMMUTABLE LEDGER */}
//              <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
//                  <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                      <LinkIcon size={18} className="text-emerald-500" /> 
//                      <span className="font-semibold text-sm">Immutable Ledger</span>
//                  </div>
//                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
//                      {/* Timeline Line */}
//                      <div className="absolute left-7 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
                     
//                      {blocks.map((block) => (
//                          <div key={block.index} onClick={() => openModal(block, 'ledger')} className="ml-8 relative p-5 rounded-xl border border-slate-800 bg-emerald-900/5 hover:border-emerald-500 cursor-pointer transition-all">
//                              {/* Timeline Dot */}
//                              <div className="absolute -left-[41px] top-7 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900"></div>
                             
//                              <div className="flex justify-between items-center mb-1">
//                                  <div className="text-lg font-bold text-emerald-400">BLOCK #{block.index}</div>
//                                  <span className="text-[10px] text-slate-600 font-mono border border-slate-700 px-2 rounded">
//                                      {block.timestamp.split('T')[1].substring(0,8)}
//                                  </span>
//                              </div>
//                              <div className="text-xs text-slate-500 font-mono break-all leading-tight">
//                                  {block.hash.substring(0,24)}...
//                              </div>
//                          </div>
//                      ))}
//                  </div>
//              </div>
//         </div>
//       </div>

//       {/* --- MODALS SECTION --- */}

//       {/* 1. INSPECTOR MODAL */}
//       <AnimatePresence>
//         {selectedBlock && viewMode === 'ui' && (
//           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
//              <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
//                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
//                    <h2 className="text-white font-bold flex items-center gap-2"><Database size={18} className="text-blue-500"/> Batch Data Inspector</h2>
//                    <button onClick={()=>setSelectedBlock(null)} className="text-slate-500 hover:text-white"><X size={20}/></button>
//                </div>
//                <div className="p-6 overflow-y-auto">
//                  <table className="w-full text-left text-xs text-slate-300">
//                    <thead className="bg-slate-800 text-slate-400 uppercase tracking-wider">
//                      <tr>
//                          <th className="p-3 rounded-tl-lg">ID / Ref</th>
//                          <th className="p-3">Entity Name</th>
//                          <th className="p-3">Phase</th>
//                          <th className="p-3">Technical Details</th>
//                          <th className="p-3 rounded-tr-lg">Action</th>
//                      </tr>
//                    </thead>
//                    <tbody className="divide-y divide-slate-800">
//                      {ipfsStorage[selectedBlock.ipfsCid]?.map((row, i) => (
//                        <tr key={i} className="hover:bg-slate-800/50 transition-colors">
//                          <td className="p-3 text-emerald-400 font-mono">
//                              {row.phase === 'FARMER' ? row.id : row.sack_id || row.id}
//                          </td>
//                          <td className="p-3 font-semibold text-white">{row.entity || row.entity_name}</td>
//                          <td className="p-3"><span className="bg-slate-800 px-2 py-1 rounded text-[10px] border border-slate-700">{row.phase}</span></td>
//                          <td className="p-3">
//                             {row.phase === 'FARMER' 
//                                 ? <span className="text-yellow-400 font-bold">{row.quality} - {row.weight} kg</span> 
//                                 : <span>Weight: {row.weight || row.weight_kg} kg | Token: {row.token_no}</span>}
//                          </td>
//                          <td className="p-3">
//                              <button onClick={() => setIpfsModalData(row)} className="text-indigo-400 hover:text-indigo-300 border border-indigo-900 hover:border-indigo-500 px-3 py-1 rounded transition-all">
//                                  View Cert
//                              </button>
//                          </td>
//                        </tr>
//                      ))}
//                    </tbody>
//                  </table>
//                </div>
//              </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 2. IPFS JSON MODAL */}
//       <AnimatePresence>
//           {viewMode === 'ipfs' && selectedBlock && (
//               <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={()=>setSelectedBlock(null)}>
//                   <div className="bg-slate-900 border border-purple-500 p-6 rounded-xl w-3/4 max-h-[80vh] overflow-auto shadow-purple-900/20 shadow-2xl relative">
//                       <button className="absolute top-4 right-4 text-purple-500 hover:text-white" onClick={()=>setSelectedBlock(null)}><X size={20}/></button>
//                       <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2"><FileJson/> IPFS Node Content</h3>
//                       <pre className="text-xs text-green-400 font-mono bg-black p-4 rounded border border-slate-800">
//                           {JSON.stringify(ipfsStorage[selectedBlock.ipfsCid], null, 2)}
//                       </pre>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>
      
//       {/* 3. LEDGER BLOCK MODAL */}
//       <AnimatePresence>
//           {viewMode === 'ledger' && selectedBlock && (
//               <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={()=>setSelectedBlock(null)}>
//                   <div className="bg-slate-900 border border-emerald-500 p-10 rounded-xl text-center shadow-emerald-900/20 shadow-2xl relative max-w-2xl">
//                        <button className="absolute top-4 right-4 text-emerald-500 hover:text-white" onClick={()=>setSelectedBlock(null)}><X size={20}/></button>
//                        <div className="flex justify-center mb-6"><LinkIcon size={64} className="text-emerald-600 opacity-50"/></div>
//                        <h1 className="text-4xl font-bold text-white mb-2">BLOCK #{selectedBlock.index}</h1>
//                        <p className="text-slate-500 text-sm mb-6 uppercase tracking-widest">Cryptographic Validation</p>
                       
//                        <div className="space-y-4 text-left">
//                            <div className="bg-black p-4 rounded border border-slate-800">
//                                <div className="text-xs text-slate-500 mb-1">Block Hash (SHA-256)</div>
//                                <div className="text-emerald-400 font-mono text-sm break-all">{selectedBlock.hash}</div>
//                            </div>
//                            <div className="bg-black p-4 rounded border border-slate-800">
//                                <div className="text-xs text-slate-500 mb-1">Previous Hash</div>
//                                <div className="text-slate-400 font-mono text-xs break-all">{selectedBlock.prevHash}</div>
//                            </div>
//                            <div className="bg-black p-4 rounded border border-slate-800">
//                                <div className="text-xs text-slate-500 mb-1">Merkle Root</div>
//                                <div className="text-blue-400 font-mono text-xs break-all">{selectedBlock.hash.substring(10)}...</div>
//                            </div>
//                        </div>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 4. CERTIFICATE DISPLAY */}
//       <AnimatePresence>
//           {showCertDisplay && ipfsModalData && (
//               <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => setShowCertDisplay(false)}>
//                   <div className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
//                       <button onClick={() => setShowCertDisplay(false)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24}/></button>
//                       <div className="border-4 border-double border-slate-300 p-6 text-center">
//                           <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600"/></div>
//                           <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">QUALITY CERTIFICATE</h1>
//                           <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Immutable Ledger</p>
                          
//                           <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded border border-slate-100">
//                               <div className="flex justify-between border-b border-slate-200 pb-2">
//                                   <span>ID / Ref:</span> 
//                                   <b>{ipfsModalData.sack_id || ipfsModalData.id}</b>
//                               </div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2">
//                                   <span>Origin Entity:</span> 
//                                   <span>{ipfsModalData.entity}</span>
//                               </div>
//                               <div className="flex justify-between border-b border-slate-200 pb-2">
//                                   <span>Quality/Weight:</span> 
//                                   <b className="text-emerald-600">
//                                       {ipfsModalData.quality ? ipfsModalData.quality : `${ipfsModalData.weight} kg`}
//                                   </b>
//                               </div>
//                               <div className="flex justify-between">
//                                   <span>Timestamp:</span> 
//                                   <span className="text-slate-500">{ipfsModalData.timestamp?.split('T')[0]}</span>
//                               </div>
//                           </div>
                          
//                           <div className="mt-8 flex justify-between items-end">
//                               <div className="text-center">
//                                   <div className="font-dancing-script text-xl text-blue-600 mb-1">AgriFlowAuth</div>
//                                   <div className="border-t border-slate-400 w-32 text-[10px] text-slate-500 pt-1">Digital Signature</div>
//                               </div>
//                               <div className="w-16 h-16 bg-white p-1 border border-slate-200">
//                                   <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ipfsModalData.id || ipfsModalData.sack_id}`} alt="QR" className="w-full h-full object-contain"/>
//                               </div>
//                           </div>
//                       </div>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 5. RETRIEVAL LOADING STATE */}
//       <AnimatePresence>
//           {ipfsModalData && !showCertDisplay && (
//               <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={() => setIpfsModalData(null)}>
//                   <div className="bg-slate-900 border border-indigo-500 p-6 rounded-xl w-80 text-center shadow-xl" onClick={e=>e.stopPropagation()}>
//                       <h3 className="text-white font-bold mb-4">IPFS Asset Retrieval</h3>
//                       <div className="space-y-2 mb-6">
//                           <div className={`flex items-center gap-3 text-sm ${certRetrievalStep >= 1 ? 'text-green-400' : 'text-slate-600'}`}>
//                               <CheckCircle2 size={16}/> Locating Content Identifier (CID)...
//                           </div>
//                           <div className={`flex items-center gap-3 text-sm ${certRetrievalStep >= 2 ? 'text-green-400' : 'text-slate-600'}`}>
//                               <CheckCircle2 size={16}/> Verifying Cryptographic Hash...
//                           </div>
//                           <div className={`flex items-center gap-3 text-sm ${certRetrievalStep >= 3 ? 'text-green-400' : 'text-slate-600'}`}>
//                               <CheckCircle2 size={16}/> Decoding Metadata...
//                           </div>
//                       </div>
//                       <button className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-2 rounded transition-colors font-semibold" onClick={handleRetrieveCert}>
//                           {certRetrievalStep === 0 ? "Retrieve from IPFS" : "Processing..."}
//                       </button>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>

//       {/* 6. RESTORED: PURPLE LOGIN MODAL */}
//       <AnimatePresence>
//         {showLogin && (
//           <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
//               <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
//                 <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Authority Login</h2></div>
//                 <p className="text-center text-slate-400 text-sm mb-6">Enter Access Key to enable Edit Mode.</p>
//                 <input 
//                   type="password" 
//                   autoFocus
//                   className={`w-full bg-black border ${loginError ? 'border-red-500' : 'border-slate-700'} rounded-lg p-3 text-white text-center tracking-widest outline-none focus:border-purple-500 transition-colors mb-2`}
//                   placeholder="ACCESS KEY"
//                   value={inputKey}
//                   onChange={(e) => setInputKey(e.target.value)}
//                   onKeyDown={(e) => e.key === 'Enter' && submitLogin()}
//                 />
//                 {loginError && <p className="text-red-500 text-xs text-center mb-4">Invalid Access Key. Try 'admin'.</p>}
//                 <div className="flex gap-2 mt-4">
//                   <button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button>
//                   <button onClick={submitLogin} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">Authenticate</button>
//                 </div>
//               </div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 7. HACKER MODE MODAL */}
//       <AnimatePresence>
// //         {hackerMode && (
//           <div className="fixed inset-0 bg-red-950/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
//               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-black border border-red-600 rounded-xl w-full max-w-md p-6 shadow-2xl">
//                 <h2 className="text-xl font-bold text-red-500 mb-4 flex items-center gap-2"><Edit3/> Modify Local CSV</h2>
//                 <div className="space-y-4">
//                   <div>
//                     <label className="text-xs text-slate-500">Target Batch Index</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.blockIdx} onChange={e => setHackerTarget({...hackerTarget, blockIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Row Index</label>
//                     <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
//                       value={hackerTarget.rowIdx} onChange={e => setHackerTarget({...hackerTarget, rowIdx: parseInt(e.target.value)})} />
//                   </div>
//                   <div>
//                     <label className="text-xs text-slate-500">Inject Weight Value</label>
//                     <input type="number" className="w-full bg-red-900/20 border border-red-500 rounded p-2 text-red-400 font-bold" 
//                       value={hackerTarget.val} onChange={e => setHackerTarget({...hackerTarget, val: e.target.value})} placeholder="e.g. 5000" />
//                   </div>
//                   <button onClick={executeAttack} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-lg mt-4">EXECUTE INJECTION</button>
//                   <button onClick={() => setHackerMode(false)} className="w-full text-slate-500 text-sm mt-2 hover:text-white">Cancel</button>
//                 </div>
//               </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* 8. ACTIVE PHASE LOGS WINDOW */}
//       <AnimatePresence>
//           {activePhaseWindow && (
//               <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setActivePhaseWindow(null)}>
//                   <div className="bg-slate-900 border border-slate-600 p-6 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e=>e.stopPropagation()}>
//                       <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
//                           <h2 className="text-white font-bold text-xl flex items-center gap-2"><Layout size={20}/> {activePhaseWindow} LOGS</h2>
//                           <button onClick={()=>setActivePhaseWindow(null)} className="text-slate-400 hover:text-white"><X size={24}/></button>
//                       </div>
//                       <div className="flex-1 overflow-auto custom-scrollbar">
//                           <table className="w-full text-slate-300 text-xs">
//                               <thead className="bg-slate-800 text-slate-400 sticky top-0">
//                                   <tr>
//                                       <th className="p-3 text-left">Timestamp</th>
//                                       <th className="p-3 text-left">ID / Ref</th>
//                                       <th className="p-3 text-left">Entity</th>
//                                       <th className="p-3 text-left">Status</th>
//                                       <th className="p-3 text-left">Raw Data</th>
//                                   </tr>
//                               </thead>
//                               <tbody className="divide-y divide-slate-800">
//                                   {localTables[activePhaseWindow === 'WAREHOUSE' ? 'warehouse' : activePhaseWindow.toLowerCase()]?.map((r,i)=>(
//                                       <tr key={i} className="hover:bg-slate-800/30">
//                                           <td className="p-3 text-slate-500">{r.timestamp?.split('T')[1].substring(0,8)}</td>
//                                           <td className="p-3 font-mono text-emerald-500">{r.id || r.sack_id}</td>
//                                           <td className="p-3">{r.entity || r.entity_name}</td>
//                                           <td className="p-3"><span className="bg-slate-800 px-2 py-1 rounded text-[10px]">{r.status}</span></td>
//                                           <td className="p-3 font-mono text-[10px] text-slate-500 truncate max-w-xs">{JSON.stringify(r)}</td>
//                                       </tr>
//                                   ))}
//                                   {(!localTables[activePhaseWindow === 'WAREHOUSE' ? 'warehouse' : activePhaseWindow.toLowerCase()]?.length) && (
//                                       <tr><td colSpan="5" className="p-8 text-center text-slate-600 italic">No records found for this phase yet.</td></tr>
//                                   )}
//                               </tbody>
//                           </table>
//                       </div>
//                   </div>
//               </div>
//           )}
//       </AnimatePresence>
      
//       {/* 9. SEARCH RESULT / INTEGRITY VERIFICATION WINDOW */}
//       <AnimatePresence>
//         {searchResult && (
//             <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-10" onClick={() => setSearchResult(null)}>
//                 <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-slate-900 border border-emerald-500 rounded-xl w-full max-w-5xl h-[70vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
//                     <div className="p-6 border-b border-emerald-900 bg-emerald-900/10 flex justify-between items-center">
//                         <div>
//                             <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2"><ShieldCheck/> Integrity Verified</h2>
//                             <p className="text-sm text-slate-400">Asset: <span className="text-white font-mono">{searchQuery}</span></p>
//                         </div>
//                         <button onClick={() => setSearchResult(null)}><X className="text-slate-500 hover:text-white"/></button>
//                     </div>
//                     <div className="flex-1 flex overflow-hidden">
                        
//                         {/* RIGHT PANE: CHAIN TRUTH */}
//                         <div className="flex-1 p-6 overflow-y-auto bg-slate-950/30 w-full">
//                             <h3 className="text-sm font-bold text-emerald-400 mb-6 flex items-center gap-2 uppercase tracking-wide"><LinkIcon size={16}/> Blockchain Proof</h3>
//                             <div className="space-y-6">
//                                 {searchResult.map((tx, i) => (
//                                     <div key={i} className="relative pl-6 border-l-2 border-emerald-900/50">
//                                         <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-emerald-500 bg-slate-900"></div>
//                                         <div className="p-4 rounded border border-emerald-900/30 bg-emerald-900/5">
//                                             <div className="flex justify-between text-xs mb-2">
//                                                 <span className="font-bold text-emerald-300">Block #{100 + tx.blockIdx}</span>
//                                                 <span className="text-emerald-600 text-[10px]">CONFIRMED</span>
//                                             </div>
//                                             <div className="text-sm text-slate-300 mb-2">
//                                                  <span className="font-bold">{tx.phase}:</span> {tx.entity}
//                                             </div>
//                                             <div className="flex items-center gap-2 text-[10px] text-slate-400">
//                                                 <CheckCircle2 size={12} className="text-emerald-500"/> 
//                                                 <span>Cryptographic Match</span>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                     </div>
//                 </motion.div>
//             </div>
//         )}
//       </AnimatePresence>

//       {/* PENDING BATCH BUFFER & TIMER */}
//       <AnimatePresence>
//         {pendingBatch.length > 0 && !isBatchMinimized && (
//           <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
//              <div className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl h-[60vh] flex flex-col shadow-[0_0_30px_rgba(59,130,246,0.2)]">
//                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
//                  <div className="flex items-center gap-3">
//                      <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Activity/> Mempool (Pending Batch)</h2>
//                      <span className="text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded-full flex items-center gap-2 border border-blue-700">
//                          <Timer size={12}/> Auto-Anchor in {timeLeft}s
//                      </span>
//                  </div>
//                  <button onClick={() => setIsBatchMinimized(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"><Minus size={20}/></button>
//                </div>
//                <div className="flex-1 overflow-y-auto p-6">
//                    <table className="w-full text-left text-sm text-slate-300">
//                        <thead className="text-slate-500 uppercase text-xs">
//                            <tr><th className="p-3">ID</th><th className="p-3">Phase</th><th className="p-3">Entity</th><th className="p-3 text-right">Status</th></tr>
//                        </thead>
//                        <tbody>
//                            {pendingBatch.map((r,i)=>(
//                                <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50">
//                                    <td className="p-3 font-mono text-blue-400">{r.phase==='FARMER'?r.id:r.sack_id}</td>
//                                    <td className="p-3"><span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{r.phase}</span></td>
//                                    <td className="p-3">{r.entity}</td>
//                                    <td className="p-3 text-right text-yellow-500 font-bold text-xs">BUFFERED</td>
//                                </tr>
//                            ))}
//                        </tbody>
//                    </table>
//                </div>
//              </div>
//           </div>
//         )}
        
//         {/* Minimized Batch Indicator */}
//         {pendingBatch.length > 0 && isBatchMinimized && (
//             <div className="fixed bottom-6 right-6 bg-slate-900 border border-blue-500 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-50 animate-bounce cursor-pointer hover:bg-slate-800 transition-colors" onClick={()=>setIsBatchMinimized(false)}>
//                 <div className="bg-blue-900/20 p-2 rounded-full text-blue-400"><Database size={20}/></div>
//                 <div>
//                     <div className="text-xs text-blue-400 font-bold uppercase">Mempool Active</div>
//                     <div className="text-white text-sm font-bold">{pendingBatch.length} txs pending</div>
//                 </div>
//                 <div className="text-2xl font-bold text-slate-500 border-l border-slate-700 pl-4">{timeLeft}s</div>
//             </div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// };

// export default SupplyChainDashboard;







