
import React, { useState, useEffect } from 'react';
import { AgentMemory } from './types';
import CardWorkshop from './features/CardWorkshop';
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
  const [memory, setMemory] = useState<AgentMemory>({
    recipientName: "My Network",
    senderName: "Sheng-Liang Song",
    generatedCardUrl: null,
    cardMessage: "As we step into 2025, the landscape of career and AI is evolving rapidly. Whether you are a new graduate or a veteran with 20+ years of experience navigating recent changes, remember that resilience is key.\n\nPrioritize your work-life balance and never give up on your journey. The right opportunity is waiting for you.\n\nWishing you a year of growth and balance!",
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
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('workshop')}>
               <span className="material-symbols-outlined text-4xl text-red-500">fireplace</span>
               <div>
                   <h1 className="text-3xl font-christmas text-red-100 drop-shadow-lg">
                     Holiday Card Factory
                   </h1>
                   <p className="text-xs text-slate-400">Powered by Gemini 2.5 Live & Flash</p>
               </div>
           </div>
           
           {view === 'workshop' && (
             <button 
                onClick={() => setView('about')}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 hover:bg-slate-700 border border-white/10 transition-all text-sm text-slate-300 hover:text-white"
             >
                <span className="material-symbols-outlined text-lg">info</span>
                <span className="hidden sm:inline">About Project</span>
             </button>
           )}
         </header>
         
         <main className="min-h-[600px] transition-all duration-300">
           {view === 'workshop' ? (
             <CardWorkshop memory={memory} updateMemory={updateMemory} />
           ) : (
             <AboutPage onBack={() => setView('workshop')} />
           )}
         </main>
         
         <footer className="mt-12 text-center text-slate-500 text-xs flex flex-col items-center gap-3">
            <p>Gemini API Demo | Holiday 2025</p>
            <div className="flex items-center gap-6">
                <a 
                  href="https://github.com/Shengliang/holidayVibe" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">code</span>
                    Source Code
                </a>
                <a 
                  href="https://holiday-vibe-pipeline-600965458720.us-west1.run.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Live Demo
                </a>
            </div>
         </footer>
      </div>
    </div>
  );
};

export default App;
