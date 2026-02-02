import React, { useState } from 'react';
import SupplyChainDashboard from './components/SupplyChainDashboard';
import Slideshow from './components/Slideshow';

export default function App() {
  // 'slides' is the starting mode
  const [mode, setMode] = useState('slides');

  return (
    <div>
      {mode === 'slides' && (
        <Slideshow onComplete={() => setMode('demo')} />
      )}

      {mode === 'demo' && (
        <SupplyChainDashboard />
      )}
    </div>
  );
}