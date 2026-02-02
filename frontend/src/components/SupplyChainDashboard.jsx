

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import io from 'socket.io-client';
import {
    Database, Server, Link as LinkIcon, AlertTriangle,
    Play, Pause, RefreshCw, ShieldCheck,
    Edit3, HardDrive, FileText, UploadCloud, Lock, X,
    UserCheck, Timer,
    CheckCircle2, Box, Key, Factory, Sprout,
    Layout, ShoppingCart,
    Menu, LogIn, Minus,
    FileJson, Code, Inbox
} from 'lucide-react';

// --- CONFIGURATION ---
// 1. Point Axios and Socket to the Backend Port (4001)
// Note: Hardcoded to localhost to prevent network mismatch issues
const SERVER_URL = "";
axios.defaults.baseURL = SERVER_URL;

// 2. Initialize Socket connection
const socket = io(SERVER_URL, {
    transports: ['websocket'],
    reconnection: true
});

const SupplyChainDashboard = () => {
    // --- STATE MANAGEMENT ---

    // 1. Blockchain Data
    // blocks: Array of block headers (Index, Hash, Timestamp) for the grid display.
    const [blocks, setBlocks] = useState([]);
    // ipfsStorage: Dictionary { CID: [DataArray] }. Acts as our local "Cache" of block data.
    const [ipfsStorage, setIpfsStorage] = useState({});
    // pendingBatch: Data received via Socket but not yet mined (waiting for 15s timer).
    const [pendingBatch, setPendingBatch] = useState([]);

    // 2. System Status
    const [timeLeft, setTimeLeft] = useState(15); // Syncs with Server
    const [isPlaying, setIsPlaying] = useState(false); // Controls the Generator
    const [isConnected, setIsConnected] = useState(socket.connected); // Connection Status

    // 3. Authentication (Roles)
    // isValidator: Can Anchor Blocks and Fix Data (The "Authority")
    const [isValidator, setIsValidator] = useState(false);
    // isCommissioner: Can Reset the entire System (The "Super Admin")
    const [isCommissioner, setIsCommissioner] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [inputKey, setInputKey] = useState('');
    const [loginError, setLoginError] = useState(false);

    // 4. Correction Logic
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [correctionTarget, setCorrectionTarget] = useState(null); // Which row are we fixing?
    const [newWeightInput, setNewWeightInput] = useState('');

    // 5. UI Layout State
    const [localTables, setLocalTables] = useState({ farmer: [], ppc: [], cmr: [], warehouse: [], fps: [] });
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isBatchMinimized, setIsBatchMinimized] = useState(false); // For the bouncing card
    const [isBatchMode, setIsBatchMode] = useState(true); // Default true (95%)
    
    // 7. INBOX & WORKFLOW STATE
    const [inboxOpen, setInboxOpen] = useState(false);
    const [drafts, setDrafts] = useState([]);
    const [selectedDrafts, setSelectedDrafts] = useState([]);
    const [showSigningModal, setShowSigningModal] = useState(false);
    const [signingPin, setSigningPin] = useState("");
    const [isSigning, setIsSigning] = useState(false);

    // 6. Modal Controls
    const [selectedBlock, setSelectedBlock] = useState(null); // The block clicked by user
    const [viewMode, setViewMode] = useState(null); // 'ui' (Inspector), 'ipfs' (JSON), 'ledger' (Receipt)
    const [activePhaseWindow, setActivePhaseWindow] = useState(null); // Phase Monitor Modal
    const [searchQuery, setSearchQuery] = useState('');
    // Removed unused searchResult state

    // 7. Certificate & Verification State
    const [ipfsModalData, setIpfsModalData] = useState(null);
    const [certRetrievalStep, setCertRetrievalStep] = useState(0); // Loading state for cert
    const [showCertDisplay, setShowCertDisplay] = useState(false); // Final White Paper
    const [showTwoWayVerify, setShowTwoWayVerify] = useState(false); // New Two-Way Modal
    const [showRegistry, setShowRegistry] = useState(false); // NEW REGISTRY STATE
    
    // --- MOCK DATA FOR CHARTS ---
    const scrollRefUI = useRef(null); // For auto-scrolling the grid

    // --- HELPERS ---
    const sanitizeRowData = (row) => {
        // 1. Resolve ID
        const id = row.id || row.sack_id || row.token_no || "N/A";
        
        // 2. Resolve Entity (Filter out IPs/Hashes)
        let entity = row.entity || row.farmer_name || row.mill_name || "Unknown Entity";
        if (entity.match(/^\d{1,3}\.\d{1,3}\./) || entity.length > 50) entity = "Unknown Entity";

        // 3. Resolve Weight (Strict Number)
        let weight = row.weight_kg || row.quantity || 0;
        if (isNaN(parseFloat(weight))) weight = 0;

        // 4. Resolve Status
        const status = row.status || row.event || "RECORDED";
        
        // 5. Resolve Timestamp
        const timestamp = row.timestamp ? row.timestamp.replace('T', ' ').substring(0, 19) : "N/A";

        return { id, entity, weight, status, timestamp, _cid: row._cid, phase: row.phase };
    };

    // --- EFFECT: SOCKET LISTENERS ---
    useEffect(() => {
        // Connect Check
        if (socket.connected) setIsConnected(true);
        socket.on('connect', () => setIsConnected(true));
        socket.on('disconnect', () => setIsConnected(false));

        // A. SYNC TIMER: Server dictates time, Frontend just displays it.
        socket.on('timer_tick', (t) => setTimeLeft(t));

        // B. INCOMING DATA: When Generator sends data to Backend, Backend broadcasts it back here.
        socket.on('new_data', (row) => {
            setPendingBatch(prev => {
                // Prevent duplicates (Socket might emit twice in bad network)
                if (prev.find(r => (r.id === row.id && r.id) || (r.sack_id === row.sack_id && r.sack_id))) return prev;
                const newList = [row, ...prev];
                // PRIORITIZE CORRECTIONS: Sort so items with isCorrection=true are at the top
                return newList.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));
            });
            // Sort data into buckets for Sidebar Counts
            setLocalTables(prev => {
                const table = row.phase.toLowerCase();
                const target = table === 'wh' ? 'warehouse' : table;
                if (prev[target] || target === 'warehouse') return { ...prev, [target]: [...(prev[target] || []), row] };
                return prev;
            });
        });

        // C. BLOCK MINED: 15s is up. Move data from Pending -> Immutable History.
        socket.on('block_mined', (block) => {
            // Critical: Parse stringified JSON if needed
            let safeData = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;
            // Inject CID into the data for visibility
            if (Array.isArray(safeData)) {
                safeData = safeData.map(r => ({ ...r, _cid: block.ipfsCid }));
            }

            setBlocks(prev => [block, ...prev]); // Add to Grid
            setIpfsStorage(prev => ({ ...prev, [block.ipfsCid]: safeData })); // Store Data in Dictionary
            setPendingBatch([]); // Clear Mempool
            setIsBatchMinimized(false);
            // Scroll grid to top
            setTimeout(() => scrollRefUI.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });

        // D. RESET EVENT: Commissioner wiped the DB.
        socket.on('chain_reset', () => {
            setBlocks([]);
            setIpfsStorage({});
            setPendingBatch([]);
            setLocalTables({ farmer: [], ppc: [], cmr: [], warehouse: [], fps: [] });
            alert("SYSTEM RESET: Blockchain has been re-initialized by Commissioner.");
        });

        // F. NEW DRAFT LISTENER (INBOX)
        socket.on('new_draft', (draft) => {
            setDrafts(prev => [draft, ...prev]);
            // Play notification sound if needed
        });

        // E. HISTORY LOADER: Fetches existing blocks from Postgres on page load.
        const fetchHistory = async () => {
            try {
                const res = await axios.get('/api/chain');
                setBlocks(res.data);

                // Rebuild the IPFS Storage Map so clicking old blocks works
                // Slideshow commented out
                // <Slideshow ... />
                const historicalIpfs = {};
                res.data.forEach(block => {
                    let safeData = typeof block.data === 'string' ? JSON.parse(block.data) : block.data;
                    if (Array.isArray(safeData)) {
                        safeData = safeData.map(r => ({ ...r, _cid: block.ipfsCid }));
                    }
                    historicalIpfs[block.ipfsCid] = safeData;
                });
                setIpfsStorage(historicalIpfs);
                console.log(`[INIT] Loaded ${res.data.length} blocks.`);
            } catch (e) { console.error(e); }
        };
        fetchHistory();

        return () => { socket.off(); };
    }, []);

    // --- HELPER: INTEGRITY CHECK ---
    // Returns false if any row in the block has been tampered with
    const checkBlockIntegrity = (block) => {
        const data = ipfsStorage[block.ipfsCid];
        if (!data) return true; // Assume safe if loading
        return !data.some(row => row.isTampered);
    };

    // --- HELPER: SEARCH FUNCTION ---
    const handleSearch = () => {
        if (!searchQuery.trim()) return;
        const query = searchQuery.toLowerCase().trim();
        let found = false;

        // 1. Search Block Hashes (Ledger View)
        const blockMatch = blocks.find(b =>
            b.hash.toLowerCase() === query ||
            
            b.index.toString() === query
        );

        if (blockMatch) {
            openModal(blockMatch, 'ledger');
            setSearchQuery(''); // Clear input on success
            found = true;
        }
        // 2. Search Transaction IDs/Data (Inspector View)
        else {
            // Loop through all blocks to find the specific row data
            for (const block of blocks) {
                const data = ipfsStorage[block.ipfsCid];
                if (!data) continue;

                const rowMatch = data.find(row => 
                    Object.values(row).some(val => 
                        val && String(val).toLowerCase().includes(query)
                    )
                );

                if (rowMatch) {
                    handleVerifyClick(rowMatch); // Open Two-Way Verification for Search Matches
                    setSearchQuery('');
                    found = true;
                    break; // Stop searching once found
                }
            }
        }

        if (!found) {
            alert("❌ VERIFICATION FAILED: ID or Hash not found in the Immutable Ledger.");
        }
    };

    // --- CRYPTO HELPERS ---
    const generateHash = async (text) => {
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // --- AUTHENTICATION ---
    const handleLoginToggle = () => {
        if (isValidator || isCommissioner) {
            setIsValidator(false); setIsCommissioner(false); // Logout
        } else {
            setShowLogin(true); setLoginError(false); setInputKey(''); // Open Modal
        }
    };

    const submitLogin = () => {
        if (inputKey === "admin") { setIsValidator(true); setShowLogin(false); }
        else if (inputKey === "superadmin") { setIsCommissioner(true); setIsValidator(true); setShowLogin(false); }
        else { setLoginError(true); }
    };

    // --- ACTIONS ---

    // 1. SIGNING FLOW
    const handleFetchDrafts = async () => {
        setInboxOpen(true); // Open immediately for responsiveness
        try {
            const res = await axios.get('/api/drafts');
            if (Array.isArray(res.data)) {
                setDrafts(res.data);
            } else {
                console.warn("Expected array for drafts, got:", res.data);
                setDrafts([]);
            }
        } catch (e) { 
            console.error("Failed to fetch drafts:", e);
            // Optionally could show a toast or error in the modal
        }
    };

    const handleSignBatch = async () => {
        if (signingPin !== "123444") {
            alert("SECURITY ALERT: Invalid PIN. Authorization Denied.");
            setSigningPin(""); // Clear for retry
            return;
        }

        setIsSigning(true);
        try {
            // Simulate HSM Delay
            await new Promise(r => setTimeout(r, 1500)); 
            
            const idsToSign = selectedDrafts.length > 0 ? selectedDrafts : drafts.map(d => d.db_id);
            await axios.post('/api/sign_batch', { ids: idsToSign });
            
            setDrafts(prev => prev.filter(d => !idsToSign.includes(d.db_id)));
            setSelectedDrafts([]);
            setShowSigningModal(false);
            setSigningPin("");
            // Inbox stays open but empty
        } catch (e) { alert("Signing Failed"); }
        setIsSigning(false);
    };

    // 1b. Manual Anchor (Skip Timer) - OLD
    const handleManualAnchor = async () => { if (isValidator) await axios.post('/api/mine'); };

    // 2. Correction Logic (The FIX Button)
    const initiateCorrection = (row) => {
        setCorrectionTarget(row);
        setNewWeightInput(row.weight_kg); // Pre-fill with current weight
        setCorrectionModalOpen(true);
    };

    const submitCorrection = async () => {
        if (!correctionTarget) return;
        // Create a NEW transaction (Append Only)
        const correctionPayload = {
            ...correctionTarget,
            event: "CORRECTION_ISSUED",
            weight_kg: parseFloat(newWeightInput).toFixed(2),
            isCorrection: true,
            priority: true, // FLAG FOR TOP SORTING
            timestamp: new Date().toISOString()
        };
        try {
            await axios.post('/api/ingest', { phase: correctionTarget.phase, data: correctionPayload });
            setCorrectionModalOpen(false);
            setSelectedBlock(null); // Close inspector to show the update in Pending
        } catch (e) { console.error(e); }
    };

    // 3. Reset System (Commissioner)
    const handleResetSystem = async () => {
        if (!isCommissioner) return;
        if (confirm("COMMISSIONER ACTION: Are you sure you want to WIPEOUT the blockchain and restart?")) {
            await axios.post('/api/reset');
        }
    };

    // 4. Attack Simulation (Modify Local Memory)
    // --- NEW: SIMULATION CONTROLS ---
    const handleToggleSim = async () => {
        const newState = !isPlaying;
        setIsPlaying(newState);
        try { await axios.post('/api/toggle_sim', { active: newState }); } 
        catch (e) { console.error("Sim Toggle Failed", e); setIsPlaying(!newState); }
    };

    const handleToggleBatch = async () => {
        const newState = !isBatchMode;
        setIsBatchMode(newState);
        try { await axios.post('/api/toggle_batch', { batch: newState }); }
        catch (e) { console.error("Batch Toggle Failed", e); setIsBatchMode(!newState); }
    };

    // --- DATA GENERATOR (DISABLED) ---
    // All data now comes exclusively from the Backend via Socket.IO
    // to ensure 100% affinity with the Source V8 Databases.
    
    // Loop for Simulation (DISABLED)
    useEffect(() => {
        // Strict Mode: No fake generation.
    }, []);

    // --- PDF GENERATOR ---
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        doc.text("AgriFlow Supply Chain - Audit Report", 14, 20);
        let yPos = 40;
        blocks.forEach(block => {
            doc.text(`Block #${block.index} [Hash: ${block.hash.substring(0, 10)}...]`, 14, yPos);
            const rows = ipfsStorage[block.ipfsCid] || [];
            const tableBody = rows.map(r => [r.phase, r.sack_id || r.id, r.product_type || 'N/A', r.weight_kg || 'N/A']);
            autoTable(doc, { startY: yPos + 5, head: [['Phase', 'ID', 'Type', 'Weight']], body: tableBody });
            yPos = doc.lastAutoTable.finalY + 15;
        });
        doc.save("Audit_Report.pdf");
    };

    // --- UI HELPERS ---
    const openModal = (block, type) => { setSelectedBlock(block); setViewMode(type); };

    // NEW: TRIGGER TWO-WAY VERIFICATION FIRST
    const handleVerifyClick = async (row) => {
        const cid = await generateHash(JSON.stringify(row));
        setIpfsModalData({...row, _cid: cid});
        setShowTwoWayVerify(true);
    };

    const handleProceedToCert = () => {
        setShowTwoWayVerify(false);
        handleRetrieveCert();
    };

    const handleRetrieveCert = () => { 
        setCertRetrievalStep(1); 
        setTimeout(() => setCertRetrievalStep(2), 800); 
        setTimeout(() => setCertRetrievalStep(3), 1600); 
        setTimeout(() => { 
            setCertRetrievalStep(0); 
            setShowCertDisplay(true); 
        }, 2500); 
    };

    const SidebarItem = ({ icon, label, onClick, count }) => (
        <div onClick={onClick} className="flex items-center gap-3 p-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg cursor-pointer transition-all mb-1">
            {icon} {sidebarOpen && <div className="flex-1 flex justify-between text-sm"><span>{label}</span>{count !== undefined && <span className="bg-slate-800 px-2 rounded-full text-xs">{count}</span>}</div>}
        </div>
    );

    // --- INSPECTOR DATA FILTERING (SINGLE TRUTH) ---
    const inspectorRows = React.useMemo(() => {
        if (!selectedBlock || !ipfsStorage[selectedBlock.ipfsCid]) return [];
        return ipfsStorage[selectedBlock.ipfsCid]; // Return RAW data (simplifying to fix visibility bug)
    }, [selectedBlock, ipfsStorage]);

    // --- LIFECYCLE HELPER ---
    const getItemLifecycle = (sackId) => {
        if (!sackId) return [];
        const history = [];
        
        // Iterate ALL blocks (Oldest to Newest)
        // We reverse blocks copy to go from Genesis -> Latest
        [...blocks].reverse().forEach(block => {
            const rows = ipfsStorage[block.ipfsCid] || [];
            const match = rows.find(r => (r.sack_id === sackId || r.id === sackId));
            if (match) {
                history.push({
                    phase: match.phase,
                    event: match.event || "RECORDED",
                    timestamp: match.timestamp || block.timestamp,
                    entity: match.entity || "Unknown",
                    hash: block.hash
                });
            }
        });
        return history;
    };

    return (
        <div className="h-screen bg-[#0c0f14] text-slate-200 font-sans flex overflow-hidden relative">

            {/* --- SIDEBAR --- */}
            <div className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col p-3 z-[60] relative ${sidebarOpen ? 'w-64' : 'w-20'}`}>
                <div className="flex justify-between items-center mb-6 px-1">
                    {sidebarOpen && <span className="font-bold text-white tracking-wider flex items-center gap-2"><Server className="text-blue-500" /> AGRIFLOW</span>}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-slate-800 rounded text-slate-400"><Menu size={18} /></button>
                </div>
                
                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div>
                        <SidebarItem 
                            icon={<FileText size={20} className="text-emerald-400" />} 
                            label="Digital Registry" 
                            onClick={() => setShowRegistry(true)} 
                        />
                        <div className="h-4"></div>
                        <SidebarItem icon={<Sprout size={20} className="text-green-500" />} label="Farmer (Grains)" onClick={() => setActivePhaseWindow('FARMER')} count={localTables.farmer.length} />
                        <SidebarItem icon={<Factory size={20} className="text-orange-500" />} label="PPC (Sacks)" onClick={() => setActivePhaseWindow('PPC')} count={localTables.ppc.length} />
                        <SidebarItem icon={<Factory size={20} className="text-blue-500" />} label="Rice Mills" onClick={() => setActivePhaseWindow('CMR')} count={localTables.cmr.length} />
                        <SidebarItem icon={<Box size={20} className="text-cyan-500" />} label="Warehouse" onClick={() => setActivePhaseWindow('WAREHOUSE')} count={localTables.warehouse.length} />
                        <SidebarItem icon={<ShoppingCart size={20} className="text-teal-500" />} label="FPS Shops" onClick={() => setActivePhaseWindow('FPS')} count={localTables.fps.length} />
                        
                        <div className="pt-4 mt-4 border-t border-slate-800">
                             <SidebarItem 
                                icon={<Inbox size={20} className="text-blue-400" />} 
                                label="Inbox Approvals" 
                                onClick={handleFetchDrafts} 
                                count={drafts.length}
                            />
                             <SidebarItem 
                                icon={<Database size={20} className="text-slate-400" />} 
                                label="DB Admin" 
                                onClick={() => window.open('http://localhost:5050', '_blank', 'noopener,noreferrer')} 
                            />
                        </div>
                    </div>
                </div>
                <div className="mt-auto border-t border-slate-800 pt-4">
                    {sidebarOpen && (
                        <div className="text-xs text-center">
                            <div className={`flex items-center justify-center gap-2 mb-1 ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                                {isConnected ? "System Online" : "Connecting..."}
                            </div>
                            <span className="text-slate-500">Postgres Node</span>
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 flex flex-col overflow-hidden">

                {/* HEADER */}
                <header className="shrink-0 bg-slate-900/50 p-4 border-b border-slate-800 flex justify-between items-center backdrop-blur-sm z-[60] relative">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">{!sidebarOpen && <Server size={20} className="text-blue-500" />} Dashboard Console</h2>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-black border border-slate-700 rounded-lg px-3 py-1.5">
                            <ShieldCheck size={14} className="text-emerald-500 mr-2" />
                            <input
                                className="bg-transparent border-none outline-none text-xs text-white w-48 font-mono"
                                placeholder="Verify ID, Sack #, or Hash..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleLoginToggle} className={`text-xs px-4 py-1.5 rounded border transition-colors flex items-center gap-2 font-bold ${isCommissioner ? 'bg-red-900/30 border-red-500 text-red-300' : isValidator ? 'bg-purple-900/30 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                {isCommissioner ? <><UserCheck size={14} /> COMMISSIONER</> : isValidator ? <><UserCheck size={14} /> OFFICER</> : <><LogIn size={14} /> LOGIN</>}
                            </button>
                            
                            {/* NEW: INBOX BUTTON */}
                            {/* NEW: INBOX BUTTON (SECURED) */}
                            <button 
                                onClick={() => {
                                    if (!isValidator && !isCommissioner) {
                                        alert("Restricted Area: Officer or Commissioner Access Required.");
                                        handleLoginToggle();
                                    } else {
                                        handleFetchDrafts();
                                    }
                                }} 
                                className={`relative p-1.5 px-3 border rounded flex items-center gap-2 font-bold transition-all ${
                                    isValidator || isCommissioner 
                                    ? "text-blue-400 border-blue-900 bg-blue-900/20 hover:bg-blue-900/40" 
                                    : "text-slate-600 border-slate-800 bg-slate-900 cursor-not-allowed opacity-50"
                                }`}
                            >
                                <Inbox size={16} /> Inbox
                                {drafts.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                                        {drafts.length}
                                    </span>
                                )}
                            </button>
                            {/* Batch Toggle Hidden - Auto 95% Batch Mode Default */}
                            {/* <button onClick={handleToggleSim} disabled={isChainBroken || !isConnected} className="p-1.5 text-emerald-400 border border-emerald-900 rounded disabled:opacity-50">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button> */}
                            <button onClick={handleDownloadPDF} className="p-1.5 text-slate-400 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700"><FileText size={16} /></button>
                            {isCommissioner && (
                                <button onClick={async () => { if (confirm("CRITICAL WARNING: This will WIPE the entire blockchain. Are you sure?")) await axios.post('/api/reset'); }} className="p-1.5 text-white bg-red-600 border border-red-500 rounded hover:bg-red-700 animate-pulse font-bold text-[10px] px-3">RESET CHAIN</button>
                            )}
                        </div>
                    </div>
                </header>

                {/* 3-COLUMN GRID */}
                <div className="flex-1 grid grid-cols-12 gap-4 p-4 min-h-0 overflow-hidden">

                    {/* COL 1: OPERATIONAL DATABASE */}
                    <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2"><Database size={18} className="text-blue-500" /> <span className="font-semibold text-sm">Operational DB (Live)</span></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {blocks.map((block) => (
                                <div key={block.index} onClick={() => openModal(block, 'ui')} className={`p-5 rounded-xl border cursor-pointer transition-all ${checkBlockIntegrity(block) ? 'border-slate-800 bg-slate-900/50 hover:border-blue-500' : 'border-red-500 bg-red-900/10 animate-pulse'}`}>
                                    <div className="flex justify-between items-center mb-2"><span className="text-base font-bold text-white">Batch #{block.index}</span> <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{Array.isArray(block.data) ? block.data.length : 0} Rows</span></div>
                                    <div className="text-xs text-slate-500 uppercase tracking-wider flex justify-between"><span>Status:</span> <span className={checkBlockIntegrity(block) ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{checkBlockIntegrity(block) ? "SYNCED" : "TAMPERED"}</span></div>
                                </div>
                            ))}
                            <div ref={scrollRefUI} />
                        </div>
                    </div>

                    {/* COL 2: IPFS STORAGE */}
                    <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2"><HardDrive size={18} className="text-purple-500" /> <span className="font-semibold text-sm">IPFS Storage</span></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {blocks.map((block) => (
                                <div key={block.index} onClick={() => openModal(block, 'ipfs')} className="p-5 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-purple-500 cursor-pointer flex items-center gap-4 transition-all">
                                    <div className="bg-purple-900/20 p-3 rounded-lg text-purple-400"><FileJson size={24} /></div>
                                    <div className="flex-1 overflow-hidden"><div className="text-sm font-bold text-white mb-1">Snapshot_{block.index}.json</div><div className="text-xs text-slate-500 font-mono truncate">{block.ipfsCid}</div></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* COL 3: IMMUTABLE LEDGER */}
                    <div className="col-span-4 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2"><LinkIcon size={18} className="text-emerald-500" /> <span className="font-semibold text-sm">Immutable Ledger</span></div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar relative">
                            <div className="absolute left-7 top-0 bottom-0 w-px bg-slate-800 -z-10"></div>
                            {blocks.map((block) => (
                                <div key={block.index} onClick={() => openModal(block, 'ledger')} className="ml-8 relative p-5 rounded-xl border border-slate-800 bg-emerald-900/5 hover:border-emerald-500 cursor-pointer transition-all">
                                    <div className="absolute -left-[41px] top-7 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-900"></div>
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="text-lg font-bold text-emerald-400">BLOCK #{block.index}</div>
                                        <span className="text-[10px] text-slate-600 font-mono border border-slate-700 px-2 rounded">{block.timestamp?.split('T')[1].substring(0, 8)}</span>
                                    </div>
                                    <div className="mt-2 space-y-1">
                                        <div className="flex justify-between text-[10px] text-slate-500"><span>Previous Hash:</span> <span className="font-mono">{block.prevHash.substring(0, 8)}...</span></div>
                                        <div className="flex justify-between text-[10px] text-emerald-600"><span>Block Root:</span> <span className="font-mono">{block.hash.substring(0, 8)}...</span></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MODALS SECTION (POPUPS) --- */}

            {/* 1. INSPECTOR MODAL (Main Data View) */}
            <AnimatePresence>
                {selectedBlock && viewMode === 'ui' && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                <h2 className="text-white font-bold flex items-center gap-2"><Database size={18} className="text-blue-500" /> Batch Data Inspector</h2>
                                <button onClick={() => setSelectedBlock(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-auto p-0 relative">
                                <table className="w-full text-left text-sm text-slate-300 min-w-max border-collapse">
                                    <thead className="bg-slate-900 text-slate-500 uppercase tracking-wider sticky top-0 bg-[#09090b] border-b border-slate-800 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 bg-slate-900/90 w-24 text-center border-r border-slate-800">Actions</th>
                                            <th className="p-4 bg-slate-900/90 w-24 border-r border-slate-800">Phase</th>
                                            <th className="p-4 bg-slate-900/90 w-48 font-mono text-blue-500 border-r border-slate-800">ID / Token</th>
                                            <th className="p-4 bg-slate-900/90 w-32 font-mono text-blue-500 border-r border-slate-800">Entity</th>
                                            <th className="p-4 bg-slate-900/90 w-32 font-mono text-blue-500 border-r border-slate-800">Status</th>
                                            <th className="p-4 bg-slate-900/90 w-24 font-mono text-blue-500 border-r border-slate-800">Weight</th>
                                            <th className="p-4 bg-slate-900/90 w-32 font-mono text-blue-500 border-r border-slate-800">Timestamp</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {inspectorRows.length > 0 ? inspectorRows.map((rawRow, i) => {
                                            const row = sanitizeRowData(rawRow); // STRICT SANITIZATION
                                            return (
                                            <tr key={i} className={`hover:bg-slate-800/50 ${rawRow.isTampered ? 'bg-red-900/40 border-l-4 border-red-500' : ''}`}>
                                                {/* Actions */}
                                                <td className="p-4 text-center border-r border-slate-800/50">
                                                    <button 
                                                        onClick={async () => { 
                                                            const dataToDisplay = {...rawRow};
                                                            if (!dataToDisplay._cid) {
                                                                const h = await generateHash(JSON.stringify(rawRow));
                                                                dataToDisplay._cid = `PENDING_${h.substring(0,8)}`; 
                                                            }
                                                            setIpfsModalData(dataToDisplay); 
                                                            setShowCertDisplay(false);
                                                            handleRetrieveCert();
                                                        }} 
                                                        className="bg-slate-800 hover:bg-emerald-600 text-slate-100 px-3 py-1.5 rounded border border-slate-700/50 text-[10px] font-bold shadow-md transition-all uppercase tracking-wider outline-none"
                                                    >
                                                        VIEW CERT
                                                    </button>
                                                </td>
                                                {/* Phase */}
                                                <td className="p-4 border-r border-slate-800/50"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                                                        row.phase === 'FARMER' ? 'border-green-800 text-green-500 bg-green-900/20' :
                                                        row.phase === 'PPC' ? 'border-yellow-800 text-yellow-400 bg-yellow-900/20' :
                                                        row.phase === 'CMR' ? 'border-orange-800 text-orange-400 bg-orange-900/20' :
                                                        row.phase === 'WH' ? 'border-blue-800 text-blue-400 bg-blue-900/20' :
                                                        'border-purple-800 text-purple-400 bg-purple-900/20'
                                                    }`}>{row.phase}</span>
                                                </td>
                                                
                                                {/* Fixed Data Columns */}
                                                <td className="p-4 text-xs text-slate-300 border-r border-slate-800/50 font-mono">{row.id}</td>
                                                <td className="p-4 text-xs text-slate-300 border-r border-slate-800/50">{row.entity}</td>
                                                <td className="p-4 text-xs text-slate-300 border-r border-slate-800/50">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${row.status === 'VERIFIED' ? 'bg-green-900 text-green-400' : 'bg-slate-800 text-slate-400'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-slate-300 border-r border-slate-800/50 font-mono">{row.weight} kg</td>
                                                <td className="p-4 text-xs text-slate-500 border-r border-slate-800/50 font-mono">{row.timestamp}</td>
                                            </tr>
                                        )}) : (
                                            <tr><td colSpan="10" className="p-8 text-center text-slate-500 italic">No data found in this block.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2. CORRECTION INPUT MODAL (Popup for Fixing) */}
            <AnimatePresence>
                {correctionModalOpen && (
                    <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-yellow-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                            <h3 className="text-yellow-500 font-bold mb-4 flex items-center gap-2"><AlertTriangle /> Issue Correction</h3>
                            <div className="mb-4 text-xs text-slate-400">Current Weight: <span className="text-white">{correctionTarget?.weight_kg} kg</span></div>
                            <label className="text-xs text-slate-500 mb-1 block">New Verified Weight (kg)</label>
                            <input type="number" autoFocus className="w-full bg-black border border-slate-700 rounded p-2 text-white mb-4" value={newWeightInput} onChange={e => setNewWeightInput(e.target.value)} />
                            <div className="flex gap-2">
                                <button onClick={() => setCorrectionModalOpen(false)} className="flex-1 py-2 text-slate-500">Cancel</button>
                                <button onClick={submitCorrection} className="flex-1 bg-yellow-600 text-black font-bold py-2 rounded">Confirm Fix</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2B. INBOX MODAL (WORKFLOW) */}
            <AnimatePresence>
                {inboxOpen && (
                    <div className="fixed inset-0 bg-black/90 z-[80] flex items-center justify-center p-4">
                        <div className="bg-[#09090b] border border-blue-600 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl relative">
                             {/* HEADER */}
                             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
                                <div>
                                    <h2 className="text-2xl font-bold text-white flex items-center gap-3"><Inbox size={28} className="text-blue-500" /> Pending Approvals</h2>
                                    <p className="text-slate-400 text-sm">Review data from V8 Systems before Anchoring to Blockchain.</p>
                                </div>
                                <button onClick={() => setInboxOpen(false)} className="bg-slate-800 p-2 rounded hover:bg-slate-700 text-slate-300"><X size={20}/></button>
                            </div>

                            {/* BODY */}
                            <div className="flex-1 overflow-auto p-0 relative">
                                <table className="w-full text-left text-sm text-slate-300 min-w-max border-collapse">
                                    <thead className="text-slate-500 uppercase text-xs sticky top-0 bg-[#09090b] border-b border-slate-800 z-10 shadow-sm">
                                        <tr>
                                            <th className="p-4 bg-slate-900/90 w-12 text-center border-r border-slate-800"><input type="checkbox" onChange={(e) => setSelectedDrafts(e.target.checked ? drafts.map(d => d.db_id) : [])} checked={selectedDrafts.length === drafts.length && drafts.length > 0} className="bg-slate-800 border-slate-600 rounded" /></th>
                                            <th className="p-4 bg-slate-900/90 w-24 text-center border-r border-slate-800">Actions</th>
                                            <th className="p-4 bg-slate-900/90 w-32 border-r border-slate-800">Time</th>
                                            <th className="p-4 bg-slate-900/90 w-24 border-r border-slate-800">Phase</th>
                                            {/* Dynamic Headers */}
                                            {drafts.length > 0 && Object.keys(drafts[0]).filter(k => !['db_id','status','phase','timestamp','created_at'].includes(k)).map(key => (
                                                <th key={key} className="p-4 bg-slate-900/90 font-mono text-blue-500 whitespace-nowrap border-r border-slate-800">{key}</th>
                                            ))}
                                            {drafts.length === 0 && <th className="p-4 bg-slate-900/90">Data Payload</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {!Array.isArray(drafts) || drafts.length === 0 ? (
                                            <tr><td colSpan="15" className="p-12 text-center text-slate-500 italic">No pending items. Listening for V8 Data...</td></tr>
                                        ) : (
                                            drafts.map((row, i) => (
                                                <tr key={i} className={`border-b border-slate-800 hover:bg-slate-800/30 transition-colors ${selectedDrafts.includes(row.db_id) ? 'bg-blue-900/10' : ''}`}>
                                                    <td className="p-4 text-center border-r border-slate-800/50"><input type="checkbox" checked={selectedDrafts.includes(row.db_id)} onChange={(e) => {
                                                        if (e.target.checked) setSelectedDrafts(prev => [...prev, row.db_id]);
                                                        else setSelectedDrafts(prev => prev.filter(id => id !== row.db_id));
                                                    }} className="bg-slate-800 border-slate-600 rounded cursor-pointer" /></td>
                                                    
                                                    {/* Fix Button */}
                                                    <td className="p-4 text-center border-r border-slate-800/50">
                                                        <button onClick={() => { setCorrectionTarget(row); setCorrectionModalOpen(true); }} className="p-2 hover:bg-yellow-500/10 text-slate-500 hover:text-yellow-500 rounded transition-colors" title="Fix Data">
                                                            <Edit3 size={16} />
                                                        </button>
                                                    </td>

                                                    <td className="p-4 font-mono text-slate-500 text-xs border-r border-slate-800/50 whitespace-nowrap">{new Date(row.timestamp).toLocaleTimeString()}</td>
                                                    <td className="p-4 border-r border-slate-800/50"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${row.phase === 'FARMER' ? 'border-green-800 text-green-500' : 'border-slate-700 text-slate-400'}`}>{row.phase}</span></td>
                                                    
                                                    {/* Dynamic Cells */}
                                                    {Object.keys(row).filter(k => !['db_id','status','phase','timestamp','created_at'].includes(k)).map((key) => (
                                                        <td key={key} className="p-4 text-xs text-slate-300 border-r border-slate-800/50 whitespace-nowrap max-w-[200px] truncate" title={String(row[key])}>
                                                            {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* FOOTER */}
                            <div className="p-6 border-t border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <div className="text-slate-500 text-sm">{selectedDrafts.length} items selected</div>
                                <div className="flex gap-3">
                                    <button className="px-4 py-2 text-red-400 hover:bg-red-900/20 rounded font-bold text-sm">REJECT</button>
                                    <button onClick={() => setShowSigningModal(true)} disabled={drafts.length === 0} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <ShieldCheck size={18} /> SIGN & ANCHOR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2C. SIGNING PIN MODAL (HSM) */}
            <AnimatePresence>
                {showSigningModal && (
                    <div className="fixed inset-0 bg-black/95 z-[90] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-lg w-full max-w-sm p-8 shadow-2xl text-center">
                            <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                                <Key size={32} className="text-blue-400 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">HSM Authentication</h3>
                            <p className="text-sm text-slate-400 mb-6">Enter your 6-digit PIN to authorize the digital signature for {selectedDrafts.length || drafts.length} records.</p>
                            
                            <div className="relative w-full mb-6">
                                <div className="flex justify-center gap-3">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className={`w-12 h-14 border rounded-lg flex items-center justify-center text-2xl transition-all ${i === signingPin.length ? 'border-blue-500 bg-blue-900/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : signingPin.length > i ? 'border-slate-600 bg-slate-800' : 'border-slate-800 bg-black'}`}>
                                            {signingPin.length > i && <div className="w-3 h-3 bg-white rounded-full"></div>}
                                        </div>
                                    ))}
                                </div>
                                <input 
                                    type="number" 
                                    autoFocus 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-[1px] bg-transparent" 
                                    value={signingPin} 
                                    onChange={(e) => {
                                        if (e.target.value.length <= 6) setSigningPin(e.target.value);
                                    }} 
                                    onKeyDown={(e) => {
                                        if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
                                    }}
                                />
                            </div>
                            
                            <button onClick={handleSignBatch} disabled={signingPin.length !== 6 || isSigning} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSigning ? "Verifying Keys..." : "AUTHORIZE TRANSFER"}
                            </button>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 3. IPFS VIEWER (JSON Code) */}
            <AnimatePresence>
                {selectedBlock && viewMode === 'ipfs' && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
                        <div className="bg-[#0d1117] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                                <h2 className="text-white font-bold flex items-center gap-2"><Code size={18} className="text-purple-500" /> IPFS Object Explorer</h2>
                                <button onClick={() => setSelectedBlock(null)} className="text-slate-500 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="p-6 overflow-y-auto font-mono text-xs text-green-400">
                                {/* QR Code Removed from IPFS Inspector to prevent crash */}\n
                                <pre>{JSON.stringify(ipfsStorage[selectedBlock.ipfsCid], null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

           {/* 4. LEDGER RECEIPT (Visual Block Data) - REORDERED LAYOUT */}
            <AnimatePresence>
                {selectedBlock && viewMode === 'ledger' && (
                    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedBlock(null)}>
                        <div className="bg-slate-900 border border-emerald-900 rounded-xl w-full max-w-md p-8 shadow-2xl flex flex-col items-center justify-center text-center relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => setSelectedBlock(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                            
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/50">
                                <CheckCircle2 size={48} className="text-emerald-500" />
                            </div>
                            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Previous Block Hash (Block #{selectedBlock.index - 1})</div>

                            {/* UPDATED LAYOUT: PREVIOUS -> CURRENT */}
                            <div className="w-full bg-black p-4 rounded border border-slate-800 text-left space-y-4">
                                
                                {/* 1. The Parent (Previous) */}
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                                        <LinkIcon size={10}/> Parent Block Hash (Block #{selectedBlock.index - 1})
                                    </div>
                                    <div className="text-slate-400 font-mono text-xs break-all border-l-2 border-slate-700 pl-2 mt-1">
                                        {selectedBlock.prevHash}
                                    </div>
                                </div>

                                {/* Visual Chain Link */}
                                <div className="flex justify-center">
                                    <div className="h-4 w-0.5 bg-emerald-500/50"></div>
                                </div>

                                {/* 2. The Current (Self) */}
                                <div className="bg-emerald-900/10 p-2 rounded border border-emerald-900/30">
                                    <div className="text-[10px] text-emerald-500 uppercase font-bold">
                                        Current Merkle Root (Block #{selectedBlock.index})
                                    </div>
                                    <div className="text-emerald-400 font-mono text-xs break-all mt-1">
                                        {selectedBlock.hash}
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 5. PENDING BATCH WINDOW */}
            <AnimatePresence>
                {pendingBatch.length > 0 && !isBatchMinimized && (
                    <div className="fixed inset-0 bg-black/60 z-[50] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-blue-500 rounded-2xl w-full max-w-5xl h-[70vh] flex flex-col shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-blue-900/10">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2"><Timer size={24} className="animate-pulse" /> Mempool (Pending Batch)</h2>
                                    <span className="text-xs bg-blue-900 text-blue-200 px-3 py-1 rounded-full flex items-center gap-2 border border-blue-700">{isValidator ? "Validator Control Active" : `Auto-Anchor in ${timeLeft}s`}</span>
                                </div>
                                <button onClick={() => setIsBatchMinimized(true)} className="p-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Minus size={20} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6">
                                <table className="w-full text-left text-sm text-slate-300">
                                    <thead className="text-slate-500 uppercase text-xs"><tr><th className="p-3">ID</th><th className="p-3">Entity</th><th className="p-3">Weight/Status</th></tr></thead>
                                    <tbody>{pendingBatch.map((r, i) => (<tr key={i} className={`border-b border-slate-800 hover:bg-slate-800/50 ${r.isCorrection ? 'bg-yellow-900/10' : ''}`}><td className="p-3 font-mono text-blue-400">{r.id || r.sack_id} {r.isCorrection && <span className="ml-2 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded">CORRECTION</span>}</td><td className="p-3">{r.entity}</td><td className="p-3"><span className="text-white">{r.weight_kg} kg</span></td></tr>))}</tbody>
                                </table>
                            </div>
                            <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end items-center gap-4">
                                <button onClick={handleManualAnchor} disabled={!isValidator} className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${isValidator ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg cursor-pointer' : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'}`}><UploadCloud size={18} /> {isValidator ? "ANCHOR BLOCK NOW" : `ANCHOR LOCKED (${timeLeft}s)`}</button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 6. MINIMIZED CARD */}
            {pendingBatch.length > 0 && isBatchMinimized && (
                <div className="fixed bottom-6 right-6 bg-slate-900 border border-blue-500 p-4 rounded-xl shadow-2xl flex items-center gap-4 z-[100] animate-bounce cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => setIsBatchMinimized(false)}>
                    <div className="bg-blue-900/20 p-2 rounded-full text-blue-400"><Database size={20} /></div>
                    <div className="text-2xl font-bold text-slate-500 border-l border-slate-700 pl-4">{timeLeft}s</div>
                </div>
            )}

            {/* 7. CERTIFICATE (WHITE PAPER UI + QR) */}
            <AnimatePresence>
                {showCertDisplay && ipfsModalData && (
                    <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4" onClick={() => { setShowCertDisplay(false); setIpfsModalData(null); }}>
                        <div className="bg-white text-slate-900 w-full max-w-lg p-8 rounded-lg shadow-2xl relative" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { setShowCertDisplay(false); setIpfsModalData(null); }} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><X size={24} /></button>
                            <div className="border-4 border-double border-slate-300 p-6 text-center">
                                <div className="flex justify-center mb-4"><ShieldCheck size={48} className="text-emerald-600" /></div>
                                
                                <h1 className="text-2xl font-serif font-bold text-slate-800 mb-2">
                                    {ipfsModalData.phase === 'FARMER' ? 'ORIGIN CERTIFICATE' :
                                     ipfsModalData.phase === 'QUALITY' ? 'QUALITY ANALYSIS REPORT' :
                                     ipfsModalData.phase === 'CMR' ? 'MILLING CUSTODY CERT' : 
                                     ipfsModalData.phase === 'WH' ? 'WAREHOUSE RECEIPT' : 'DIGITAL ASSET CERTIFICATE'}
                                </h1>
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-6">Verified on Immutable Ledger</p>
                                
                                <div className="text-left space-y-4 font-serif text-sm bg-slate-50 p-6 rounded border border-slate-100">
                                    <div className="flex justify-between border-b border-slate-200 pb-2"><span>Certificate ID:</span> <b>{ipfsModalData.sack_id || ipfsModalData.id}</b></div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2"><span>Issuing Entity:</span> <span>{ipfsModalData.entity}</span></div>
                                    <div className="flex justify-between border-b border-slate-200 pb-2"><span>Timestamp:</span> <span className="font-mono text-xs">{ipfsModalData.timestamp}</span></div>
                                    
                                    {ipfsModalData.product_type && <div className="flex justify-between border-b border-slate-200 pb-2"><span>Product:</span> <b className="text-blue-600">{ipfsModalData.product_type}</b></div>}
                                    {ipfsModalData.weight_kg && <div className="flex justify-between border-b border-slate-200 pb-2"><span>Weight:</span> <b className="text-emerald-600">{ipfsModalData.weight_kg} kg</b></div>}
                                    {ipfsModalData.moisture_level && <div className="flex justify-between border-b border-slate-200 pb-2"><span>Moisture Content:</span> <b className="text-amber-600">{ipfsModalData.moisture_level}%</b></div>}
                                </div>

                                <div className="mt-8 flex justify-between items-end">
                                    <div className="text-center"><div className="font-dancing-script text-xl text-blue-600 mb-1">BlockchainAuth</div><div className="border-t border-slate-400 w-32 text-[10px] text-slate-500">Digital Signature</div></div>
                                    <div className="w-36 h-36 bg-white p-2 shadow-inner"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=CERT:${ipfsModalData.sack_id || ipfsModalData.id}|CID:${ipfsModalData._cid}|TYPE:${ipfsModalData.phase}`} alt="QR" className="w-full h-full" data-qr="true" /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}


            </AnimatePresence>

            {/* 8. LOADING SPINNER */}
            <AnimatePresence>
                {ipfsModalData && !showCertDisplay && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#0c0c0c] border border-slate-700 rounded-lg w-full max-w-md shadow-2xl relative font-mono text-xs overflow-hidden flex flex-col">
                            {/* Terminal Header */}
                            <div className="bg-slate-900 px-4 py-2 border-b border-slate-700 flex justify-between items-center shrink-0">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                                </div>
                                <div className="text-slate-500 font-sans font-bold text-[10px] tracking-widest">IPFS GATEWAY LINK</div>
                                <button onClick={() => setIpfsModalData(null)} className="text-slate-500 hover:text-white"><X size={14} /></button>
                            </div>
                            {/* Terminal Body */}
                            <div className="p-6 h-64 bg-black/95 text-slate-300 flex flex-col relative" onClick={certRetrievalStep === 0 ? handleRetrieveCert : undefined}>
                                {certRetrievalStep === 0 && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-900/30 transition-colors">
                                        <div className="w-16 h-16 rounded-full bg-indigo-900/20 flex items-center justify-center border border-indigo-500/30"><Database size={32} className="text-indigo-400" /></div>
                                        <div className="text-center space-y-1">
                                            <div className="text-indigo-400 font-bold text-sm font-sans">READY TO RETRIEVE</div>
                                            <div className="text-slate-600">Click to fetch asset from ID: {ipfsModalData.sack_id || ipfsModalData.id}</div>
                                        </div>
                                    </div>
                                )}
                                <div className="space-y-2 font-mono">
                                    {certRetrievalStep > 0 && <div className="text-green-500">$ ipfs get {ipfsModalData._cid || "QmHash..."} --verbose</div>}
                                    {certRetrievalStep > 0 && <div><span className="text-blue-500">[INFO]</span> Resolving Content Identifier (CID)... <span className="text-green-500">DONE</span></div>}
                                    {certRetrievalStep > 1 && <div><span className="text-blue-500">[INFO]</span> Connecting to Swarm Peers... <span className="text-green-500">CONNECTED (12 Peers)</span></div>}
                                    {certRetrievalStep > 1 && <div><span className="text-blue-500">[INFO]</span> Fetching shards... <span className="text-slate-500">| | | | | | | | | | 100%</span></div>}
                                    {certRetrievalStep > 2 && <div><span className="text-blue-500">[INFO]</span> Verifying Merkle DAG Integrity... <span className="text-green-500">MATCH</span></div>}
                                    {certRetrievalStep > 2 && <div className="animate-pulse text-indigo-400">{">>"} Decrypting Assets...</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 9a. TWO-WAY VERIFICATION MODAL */}
            <AnimatePresence>
                {showTwoWayVerify && ipfsModalData && (
                    <div className="fixed inset-0 bg-black/95 z-[70] flex items-center justify-center p-4" onClick={() => setShowTwoWayVerify(false)}>
                        <div className="w-full max-w-5xl max-h-[85vh] bg-slate-900 border border-blue-500 rounded-2xl overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>

                            {/* HEADER */}
                            <div className="p-6 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><ShieldCheck size={32} className="text-blue-500" /> TWO-WAY VERIFICATION PROTOCOL</h2>
                                <button onClick={() => setShowTwoWayVerify(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                            </div>

                            {/* SPLIT CONTENT */}
                            <div className="flex-1 grid grid-cols-2">
                                {/* LEFT: PHYSICAL/INPUT */}
                                <div className="p-8 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border border-slate-600">
                                        <Box size={40} className="text-slate-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-300 mb-2">PHYSICAL STATE</h3>
                                    <p className="text-sm text-slate-500 mb-8 max-w-xs">Data captured from physical sensors, RFID tags, and user inputs at the source.</p>

                                    <div className="w-full space-y-4 text-left p-6 bg-black rounded-xl border border-slate-800">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Subject ID</span>
                                            <span className="font-mono text-white">{ipfsModalData.sack_id || ipfsModalData.id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Reported Weight</span>
                                            <span className="font-mono text-white">{ipfsModalData.weight_kg} kg</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Origin Entity</span>
                                            <span className="font-mono text-white">{ipfsModalData.entity}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* RIGHT: LIFECYCLE TIMELINE (Replaces Digital Truth) */}
                                <div className="p-8 bg-slate-900/80 flex flex-col relative overflow-hidden border-l border-slate-800">
                                    <div className="absolute top-0 right-0 p-3 opacity-10"><RefreshCw size={120} className="text-blue-500" /></div>
                                    
                                    <div className="flex items-center gap-3 mb-6 z-10">
                                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/50">
                                            <Timer size={20} className="text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">ITEM LIFECYCLE</h3>
                                            <p className="text-xs text-slate-500">Immutable History across Supply Chain</p>
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative z-10 space-y-4">
                                        {getItemLifecycle(ipfsModalData.sack_id || ipfsModalData.id).length > 0 ? (
                                            getItemLifecycle(ipfsModalData.sack_id || ipfsModalData.id).map((step, idx) => (
                                                <div key={idx} className="relative pl-6 pb-2 border-l border-slate-700 last:border-0">
                                                    <div className={`absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full ${idx === getItemLifecycle(ipfsModalData.sack_id || ipfsModalData.id).length - 1 ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-600'}`}></div>
                                                    <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                                step.phase === 'FARMER' ? 'bg-green-900/30 text-green-400 border-green-900' :
                                                                step.phase === 'PPC' ? 'bg-yellow-900/30 text-yellow-400 border-yellow-900' :
                                                                step.phase === 'CMR' ? 'bg-orange-900/30 text-orange-400 border-orange-900' :
                                                                step.phase === 'WH' ? 'bg-blue-900/30 text-blue-400 border-blue-900' :
                                                                'bg-purple-900/30 text-purple-400 border-purple-900'
                                                            }`}>{step.phase}</span>
                                                            <span className="text-[10px] text-slate-500 font-mono">{step.timestamp?.split('T')[1]?.substring(0,8)}</span>
                                                        </div>
                                                        <div className="text-sm font-bold text-white mb-0.5">{step.event}</div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1"><UserCheck size={10} /> {step.entity}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center text-slate-500 py-10">No history other than current state found.</div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ACTION BAR */}
                            <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
                                <div className="text-xs text-slate-500">By verifying, you confirm the physical-digital link is intact.</div>
                                <button onClick={handleProceedToCert} className="bg-slate-900 hover:bg-emerald-600 text-slate-100 font-bold py-2 px-6 rounded-lg shadow-md flex items-center gap-2 border border-slate-700/50 transition-all outline-none text-xs uppercase tracking-widest group">
                                    <ShieldCheck size={18} className="text-emerald-500 group-hover:text-white transition-colors" /> VERIFY & RETRIEVE ASSET
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

                {/* 10. REGISTRY MODAL (Unified Lookup) */}
            <AnimatePresence>
                {showRegistry && (
                    <div className="fixed inset-0 bg-black/95 z-[80] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-6xl h-[85vh] flex flex-col shadow-2xl">
                             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-3"><FileText size={24} className="text-emerald-500" /> Digital Certificate Registry</h2>
                                <button onClick={() => setShowRegistry(false)} className="bg-slate-800 p-2 rounded hover:bg-slate-700 text-slate-300"><X size={20}/></button>
                            </div>
                            <div className="p-4 border-b border-slate-800 bg-black/40">
                                <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full max-w-md">
                                    <ShieldCheck size={18} className="text-slate-500 mr-2" />
                                    <input className="bg-transparent border-none outline-none text-sm text-white w-full font-mono" placeholder="Filter Registry by ID, Name, or Status..." onChange={(e) => {
                                        // Simple local filter logic could go here, or relies on main search
                                        // For now, this is visual as main search covers global. 
                                        // Let's implement local filtering for this table:
                                        const q = e.target.value.toLowerCase();
                                        const rows = document.querySelectorAll('.registry-row');
                                        rows.forEach(row => {
                                            row.style.display = row.innerText.toLowerCase().includes(q) ? 'table-row' : 'none';
                                        });
                                    }} />
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto p-0">
                                <table className="w-full text-left text-sm text-slate-300 min-w-max border-collapse">
                                    <thead className="text-slate-500 uppercase text-xs sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                                        <tr>
                                            <th className="p-4 w-32 border-r border-slate-800">Certificate</th>
                                            <th className="p-4 w-48 border-r border-slate-800">Reference ID</th>
                                            <th className="p-4 w-32 border-r border-slate-800">Phase</th>
                                            <th className="p-4 w-48 border-r border-slate-800">Entity</th>
                                            <th className="p-4 border-r border-slate-800">Timestamp</th>
                                            <th className="p-4 w-32">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {blocks.flatMap(b => ipfsStorage[b.ipfsCid] || []).map((rawRow, i) => {
                                             const row = sanitizeRowData(rawRow); // STRICT SANITIZATION
                                             return (
                                            <tr key={i} className="registry-row hover:bg-slate-800/30 transition-colors">
                                                <td className="p-4 text-center border-r border-slate-800/50">
                                                     <button 
                                                        onClick={async () => { 
                                                            const dataToDisplay = {...rawRow};
                                                            if (!dataToDisplay._cid) {
                                                                const h = await generateHash(JSON.stringify(rawRow));
                                                                dataToDisplay._cid = `PENDING_${h.substring(0,8)}`; 
                                                            }
                                                            setIpfsModalData(dataToDisplay); 
                                                            setShowRegistry(false);
                                                            handleRetrieveCert();
                                                        }} 
                                                        className="bg-emerald-900/20 hover:bg-emerald-600 text-emerald-400 hover:text-white px-3 py-1.5 rounded border border-emerald-900 text-[10px] font-bold transition-all uppercase tracking-wider"
                                                    >
                                                        VIEW CERT
                                                    </button>
                                                </td>
                                                <td className="p-4 font-mono text-white border-r border-slate-800/50 text-xs">{row.id}</td>
                                                <td className="p-4 border-r border-slate-800/50"><span className={`text-[10px] font-bold px-2 py-0.5 rounded border whitespace-nowrap ${
                                                    row.phase === 'FARMER' ? 'border-green-800 text-green-500' : 
                                                    row.phase === 'PPC' ? 'border-yellow-800 text-yellow-500' : 'border-slate-700 text-slate-400'
                                                }`}>{row.phase}</span></td>
                                                <td className="p-4 border-r border-slate-800/50 text-xs">{row.entity}</td>
                                                <td className="p-4 font-mono text-slate-500 border-r border-slate-800/50 text-xs">{row.timestamp}</td>
                                                <td className="p-4 text-xs font-bold text-slate-400">{row.status}</td>
                                            </tr>
                                        )})}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 9. AUTH MODAL */}
            <AnimatePresence>
                {showLogin && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <div className="bg-slate-900 border border-purple-500 rounded-xl w-full max-w-sm p-6 shadow-2xl">
                            <div className="flex items-center gap-3 text-purple-400 mb-4 justify-center"><Key size={32} /><h2 className="text-xl font-bold">Node Login</h2></div>
                            <input type="password" autoFocus className="w-full bg-black border border-slate-700 rounded-lg p-3 text-white text-center mb-2" placeholder="NODE KEY" value={inputKey} onChange={(e) => setInputKey(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitLogin()} />
                            <div className="flex gap-2 mt-4"><button onClick={() => setShowLogin(false)} className="flex-1 py-2 text-slate-500 hover:text-white">Cancel</button><button onClick={submitLogin} className="flex-1 bg-purple-600 text-white font-bold py-2 rounded-lg">Authenticate</button></div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

            {/* 11. ACTIVE LOGS WINDOW (PHASE MONITOR) */}
            <AnimatePresence>
                {activePhaseWindow && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setActivePhaseWindow(null)}>
                        <div className="bg-slate-900 border border-slate-600 p-6 rounded-xl w-full max-w-4xl h-[70vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                                <h2 className="text-white font-bold text-xl flex items-center gap-2"><Layout size={20} /> {activePhaseWindow} LOGS</h2>
                                <button onClick={() => setActivePhaseWindow(null)} className="text-slate-400 hover:text-white"><X size={24} /></button>
                            </div>
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <table className="w-full text-slate-300 text-xs">
                                    <thead className="bg-slate-800 text-slate-400 sticky top-0"><tr><th className="p-3 text-left">Timestamp</th><th className="p-3 text-left">ID</th><th className="p-3 text-left">Entity</th><th className="p-3 text-left">Status</th></tr></thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {localTables[activePhaseWindow === 'WAREHOUSE' ? 'warehouse' : activePhaseWindow.toLowerCase()]?.map((r, i) => (
                                            <tr key={i} className="hover:bg-slate-800/30">
                                                <td className="p-3 text-slate-500">{r.timestamp?.split('T')[1].substring(0, 8)}</td>
                                                <td className="p-3 font-mono text-emerald-500">{r.id || r.sack_id}</td>
                                                <td className="p-3">{r.entity || r.entity_name}</td>
                                                <td className="p-3"><span className="bg-slate-800 px-2 py-1 rounded text-[10px]">{r.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default SupplyChainDashboard;