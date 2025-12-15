import React, { useState, useEffect } from 'react';
import { AgentMemory } from './types';
import CardWorkshop from './features/CardWorkshop';

// Simple Snowfall Effect Component
const Snowfall = () => {
  const [flakes, setFlakes] = useState<number[]>([]);
  useEffect(() => {
    setFlakes(Array.from({ length: 50 }, (_, i) => i));
  }, []);

  return (
    <div className="snow-container">
      {flakes.map((i) => (
        <div
          key={i}
          className="snowflake"
          style={{
            left: `${Math.random() * 100}vw`,
            opacity: Math.random(),
            width: `${Math.random() * 5 + 3}px`,
            height: `${Math.random() * 5 + 3}px`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  );
};

const App: React.FC = () => {
  const [memory, setMemory] = useState<AgentMemory>({
    recipientName: "Family",
    generatedCardUrl: null,
    cardMessage: null,
    giftUrl: null,
    conversationContext: ""
  });

  const updateMemory = (updates: Partial<AgentMemory>) => {
    setMemory(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen text-slate-100 relative selection:bg-red-500 selection:text-white">
      <Snowfall />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
         <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
           <div className="flex items-center gap-3">
               <span className="material-symbols-outlined text-4xl text-red-500">fireplace</span>
               <div>
                   <h1 className="text-3xl font-christmas text-red-100 drop-shadow-lg">
                     Holiday Card Factory
                   </h1>
                   <p className="text-xs text-slate-400">Powered by Gemini 2.5 Live & Flash</p>
               </div>
           </div>
         </header>
         
         <main className="min-h-[600px] transition-all duration-300">
           <CardWorkshop memory={memory} updateMemory={updateMemory} />
         </main>
         
         <footer className="mt-12 text-center text-slate-500 text-xs">
           Gemini API Demo | Holiday 2024
         </footer>
      </div>
    </div>
  );
};

export default App;
