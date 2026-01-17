import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Link as LinkIcon, Unlink, Hash, AlertTriangle, Box, ArrowRight, RefreshCw 
} from 'lucide-react';

const simpleHash = (data, prevHash) => {
  const str = data + prevHash;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
};

const BlockchainDemo = () => {
  const [isTampered, setIsTampered] = useState(false);
  const [blocks, setBlocks] = useState([]);

  const generateChain = (tamperedState = false) => {
    const genesisData = "GENESIS_CROP";
    const genesisHash = simpleHash(genesisData, "00000000");

    const block1 = {
      index: 0,
      phase: "Farmer (Harvest)",
      data: genesisData,
      prev: "00000000",
      hash: genesisHash,
      status: 'valid'
    };

    const ppcData = tamperedState ? "PPC_RCVD_BAD_DATA" : "PPC_RCVD_OK";
    const ppcPrev = block1.hash;
    const ppcHash = simpleHash(ppcData, ppcPrev);
    
    const block2 = {
      index: 1,
      phase: "PPC (Procure)",
      data: ppcData,
      prev: ppcPrev,
      hash: ppcHash,
      status: tamperedState ? 'tampered' : 'valid'
    };

    // Block 3 expects the ORIGINAL hash of block 2
    const millData = "MILLING_BATCH_A";
    const originalBlock2Hash = simpleHash("PPC_RCVD_OK", genesisHash); 
    const millPrev = tamperedState ? originalBlock2Hash : block2.hash; 
    const millHash = simpleHash(millData, millPrev);

    const block3 = {
      index: 2,
      phase: "Miller (Process)",
      data: millData,
      prev: millPrev, 
      hash: millHash,
      status: tamperedState ? 'broken' : 'valid'
    };

    setBlocks([block1, block2, block3]);
  };

  useEffect(() => {
    generateChain(false);
  }, []);

  const handleTamper = () => {
    setIsTampered(true);
    generateChain(true);
  };

  const handleReset = () => {
    setIsTampered(false);
    generateChain(false);
  };

  return (
    <div className="min-h-screen bg-[#0c0f14] text-slate-200 p-8 font-sans flex flex-col items-center justify-center pb-20">
      
      <div className="w-full max-w-5xl flex justify-between items-end mb-12 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Blockchain Immutability Demo
          </h1>
          <p className="text-slate-500 mt-2">Visualizing how data tampering breaks the hash chain.</p>
        </div>
        
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isTampered ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
          {isTampered ? <Unlink size={18} /> : <LinkIcon size={18} />}
          <span className="font-mono font-bold text-sm">
            {isTampered ? 'CHAIN BROKEN' : 'CHAIN INTACT'}
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center overflow-x-auto w-full max-w-6xl pb-12 px-4 justify-center">
        <AnimatePresence mode="popLayout">
          {blocks.map((block, i) => {
            const isBrokenLink = i > 0 && block.prev !== blocks[i-1].hash;
            
            return (
              <React.Fragment key={block.index}>
                {i > 0 && (
                   <div className="relative flex flex-col items-center justify-center w-16 text-slate-600">
                      <div className={`h-0.5 w-full transition-colors duration-500 ${isBrokenLink ? 'bg-red-500' : 'bg-slate-700'}`} />
                      {isBrokenLink ? (
                        <motion.div 
                          initial={{ scale: 0 }} 
                          animate={{ scale: 1 }} 
                          className="absolute bg-[#0c0f14] p-1"
                        >
                          <Unlink size={24} className="text-red-500" />
                        </motion.div>
                      ) : (
                        <ArrowRight size={20} className="absolute text-slate-600" />
                      )}
                   </div>
                )}

                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    borderColor: block.status === 'tampered' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(51, 65, 85, 1)',
                    backgroundColor: block.status === 'tampered' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(15, 23, 42, 0.6)'
                  }}
                  className={`relative w-72 rounded-xl border backdrop-blur-sm p-5 flex-shrink-0 transition-colors duration-300
                    ${block.status === 'tampered' ? 'shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'shadow-xl'}
                  `}
                >
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <Box size={16} className="text-blue-400" />
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Block #{block.index}</span>
                    </div>
                    <span className="text-xs text-slate-500">{block.phase}</span>
                  </div>

                  <div className="space-y-3 font-mono text-[10px] md:text-xs">
                    
                    <div className={`p-2 rounded border transition-colors duration-300 ${
                      isBrokenLink 
                        ? 'bg-red-500/10 border-red-500/50 text-red-300' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <LinkIcon size={10} />
                        <span>PREV_HASH</span>
                      </div>
                      <div className="break-all">{block.prev}</div>
                    </div>

                    <div className={`p-2 rounded border transition-colors duration-300 ${
                       block.status === 'tampered' 
                       ? 'bg-yellow-500/10 border-yellow-500/50 text-yellow-200' 
                       : 'bg-slate-800/50 border-slate-700 text-slate-300'
                    }`}>
                       <div className="flex items-center gap-1.5 mb-1 opacity-70">
                        <span>DATA</span>
                      </div>
                      <div className="font-sans font-medium">{block.data}</div>
                    </div>

                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-emerald-400">
                      <div className="flex items-center gap-1.5 mb-1 opacity-70 text-emerald-600">
                        <Hash size={10} />
                        <span>CURR_HASH</span>
                      </div>
                      <div className="break-all">{block.hash}</div>
                    </div>

                  </div>

                  {block.status === 'tampered' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-3 -right-3 bg-red-500 text-white p-1.5 rounded-full shadow-lg"
                    >
                      <AlertTriangle size={20} />
                    </motion.div>
                  )}
                </motion.div>
              </React.Fragment>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={handleTamper}
          disabled={isTampered}
          className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
        >
          <AlertTriangle size={18} />
          Simulate Attack
        </button>

        {isTampered && (
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-all border border-slate-700"
          >
            <RefreshCw size={18} />
            Reset Ledger
          </motion.button>
        )}
      </div>

      <div className="mt-8 text-center text-slate-500 text-sm max-w-lg">
        <p>
          Note: In a real blockchain, changing the Data in Block #1 changes its Hash. 
          Block #2, which still points to the <em>old</em> hash, is now invalid.
        </p>
      </div>

    </div>
  );
};

export default BlockchainDemo;