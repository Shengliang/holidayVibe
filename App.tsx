import React, { useState, useEffect } from 'react';
import { AgentMemory, AppView } from './types';
import VibeStudio from './features/VibeStudio';
import SantaLive from './features/SantaLive';
import VeoMemories from './features/VeoMemories';
import CharityAgent from './features/CharityAgent';
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
  const [view, setView] = useState<AppView>(AppView.DASHBOARD);
  const [memory, setMemory] = useState<AgentMemory>({
    vibe: "Cozy Nordic Christmas",
    themeColor: "red",
    charity: null,
    donationAmount: 0,
    recipientName: "Family",
    generatedCardUrl: null,
    cardMessage: null,
    giftUrl: null
  });

  const updateMemory = (updates: Partial<AgentMemory>) => {
    setMemory(prev => ({ ...prev, ...updates }));
  };

  const renderView = () => {
    switch(view) {
      case AppView.VIBE_STUDIO:
        return <VibeStudio onBack={() => setView(AppView.DASHBOARD)} memory={memory} updateMemory={updateMemory} />;
      case AppView.LIVE_AGENT:
        return <SantaLive onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.VEO_MEMORIES:
        return <VeoMemories onBack={() => setView(AppView.DASHBOARD)} />;
      case AppView.CHARITY:
        return <CharityAgent onBack={() => setView(AppView.DASHBOARD)} memory={memory} updateMemory={updateMemory} />;
      case AppView.CARD_WORKSHOP:
        return <CardWorkshop onBack={() => setView(AppView.DASHBOARD)} memory={memory} updateMemory={updateMemory} />;
      default:
        return <Dashboard setView={setView} memory={memory} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-100 relative selection:bg-red-500 selection:text-white">
      <Snowfall />
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
         <header className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
           <h1 className="text-4xl font-christmas text-red-400 drop-shadow-lg cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
             Holiday Vibe Pipeline <span className="text-sm font-sans text-slate-400 align-middle ml-2">v2.5</span>
           </h1>
           <div className="flex gap-4 text-sm text-slate-400">
             {memory.charity && (
               <span className="flex items-center text-green-400">
                 <span className="material-symbols-outlined text-sm mr-1">volunteer_activism</span>
                 ${memory.donationAmount} Donated
               </span>
             )}
             <span className="flex items-center">
                <span className="material-symbols-outlined text-sm mr-1">palette</span>
                {memory.vibe}
             </span>
           </div>
         </header>
         
         <main className="min-h-[600px] transition-all duration-300">
           {renderView()}
         </main>
         
         <footer className="mt-12 text-center text-slate-500 text-xs">
           Powered by Gemini 2.5, Veo & AP2 Protocol Simulation
         </footer>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ setView: (v: AppView) => void, memory: AgentMemory }> = ({ setView, memory }) => {
  const steps = [
    { id: AppView.VIBE_STUDIO, label: "Vibe Builder", icon: "brush", desc: "Design your aesthetic with Nano Banana" },
    { id: AppView.LIVE_AGENT, label: "Elf Live Chat", icon: "mic", desc: "Brainstorm ideas with a real-time elf" },
    { id: AppView.VEO_MEMORIES, label: "Veo Magic", icon: "movie_filter", desc: "Turn photos into festive videos" },
    { id: AppView.CHARITY, label: "Charity Agent", icon: "volunteer_activism", desc: "Give back via Agent Payments (AP2)" },
    { id: AppView.CARD_WORKSHOP, label: "Card Factory", icon: "mark_email_read", desc: "Generate & Send cards based on memory" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
       <div className="col-span-full mb-8 p-6 bg-gradient-to-r from-red-900/40 to-slate-900/40 border border-red-500/20 rounded-2xl backdrop-blur-sm">
          <h2 className="text-2xl font-christmas text-amber-200 mb-2">Welcome to the Workshop</h2>
          <p className="text-slate-300">Start by defining your Christmas vibe, then let the agents handle the rest. Don't forget to donate!</p>
       </div>
       
       {steps.map(step => (
         <button 
           key={step.id}
           onClick={() => setView(step.id)}
           className="group p-6 bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-red-500/50 rounded-xl text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/20"
         >
           <span className="material-symbols-outlined text-4xl mb-4 text-red-400 group-hover:text-red-300 transition-colors">
             {step.icon}
           </span>
           <h3 className="text-xl font-semibold mb-2">{step.label}</h3>
           <p className="text-slate-400 text-sm">{step.desc}</p>
         </button>
       ))}
    </div>
  );
};

export default App;
