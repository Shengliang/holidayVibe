
import React, { useState, useEffect, useRef } from 'react';
import { AgentMemory } from './types';
import CardWorkshop, { WorkshopHandle } from './features/CardWorkshop';
import AboutPage from './features/AboutPage';

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
  const [view, setView] = useState<'workshop' | 'about'>('workshop');
  const [workshopStatus, setWorkshopStatus] = useState({ loading: false, connected: false });
  const workshopRef = useRef<WorkshopHandle>(null);

  const [memory, setMemory] = useState<AgentMemory>({
    recipientName: "My Network",
    senderName: "Sheng-Liang Song",
    date: "2025-12-16",
    // Default cover image simulating the "AI Christmas" vibe
    generatedCardUrl: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?q=80&w=1000&auto=format&fit=crop", 
    // Default message matching the screenshot
    cardMessage: "As 2025 brings new career paths and AI advancements, remember to prioritize your well-being. To new graduates and veterans navigating changes, embrace resilience. Your journey is unique and valuable. Never give up on your potential. Happy Holidays, and here's to a fulfilling New Year!",
    giftUrl: null,
    conversationContext: "Theme: Career resilience and AI progress in 2025. Focus: Resilience, Work-Life Balance."
  });

  const updateMemory = (updates: Partial<AgentMemory>) => {
    setMemory(prev => ({ ...prev, ...updates }));
  };

  const getActionButtonText = () => {
      if (workshopStatus.loading) return "Creating Magic...";
      if (workshopStatus.connected) return "Finish & Create Card";
      return "Create Card";
  };

  return (
    <div className="min-h-screen text-slate-100 relative selection:bg-red-500 selection:text-white flex flex-col overflow-hidden">
      <Snowfall />
      <div className="relative z-10 container mx-auto px-4 py-4 max-w-[1600px] flex-1 flex flex-col h-screen">
         <header className="flex justify-between items-center mb-4 border-b border-white/10 pb-4 shrink-0">
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('workshop')}>
               <span className="material-symbols-outlined text-4xl text-red-500">fireplace</span>
               <div>
                   <h1 className="text-2xl font-christmas text-red-100 drop-shadow-lg leading-none">
                     Holiday Card Factory
                   </h1>
                   <p className="text-[10px] text-slate-400">Powered by Gemini 2.5</p>
               </div>
           </div>
           
           <div className="flex items-center gap-3">
             {view === 'workshop' && (
               <button 
                  onClick={() => workshopRef.current?.triggerGeneration()}
                  disabled={workshopStatus.loading}
                  className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all text-sm shadow-lg ${
                    workshopStatus.loading 
                      ? 'bg-slate-700 text-slate-400 cursor-wait' 
                      : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-amber-900/30'
                  }`}
               >
                  <span className={`material-symbols-outlined text-lg ${workshopStatus.loading ? 'animate-spin' : ''}`}>
                      {workshopStatus.loading ? 'refresh' : 'auto_fix_high'}
                  </span>
                  {getActionButtonText()}
               </button>
             )}

             {view === 'workshop' && (
               <button 
                  onClick={() => setView('about')}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700 border border-white/10 transition-all text-sm text-slate-300 hover:text-white"
               >
                  <span className="material-symbols-outlined text-lg">info</span>
                  <span className="hidden sm:inline">About</span>
               </button>
             )}
           </div>
         </header>
         
         <main className="flex-1 min-h-0">
           {view === 'workshop' ? (
             <CardWorkshop 
                ref={workshopRef}
                memory={memory} 
                updateMemory={updateMemory} 
                onStatusChange={setWorkshopStatus}
             />
           ) : (
             <AboutPage onBack={() => setView('workshop')} />
           )}
         </main>
         
         {view === 'about' && (
             <footer className="mt-4 text-center text-slate-500 text-xs flex flex-col items-center gap-3 pb-4">
                <p>Gemini API Demo | Holiday 2025</p>
                <div className="flex items-center gap-6">
                    <a href="https://github.com/Shengliang/holidayVibe" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white">
                        <span className="material-symbols-outlined text-sm">code</span> Source Code
                    </a>
                </div>
             </footer>
         )}
      </div>
    </div>
  );
};

export default App;
