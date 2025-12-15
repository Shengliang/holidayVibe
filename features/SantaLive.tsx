import React, { useState, useEffect, useRef } from 'react';
import { HolidayLiveAgent } from '../services/geminiService';

const SantaLive: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState<{role: 'user' | 'elf', text: string}[]>([]);
  const [currentTurn, setCurrentTurn] = useState<{user: string, elf: string}>({ user: '', elf: '' });
  
  const agentRef = useRef<HolidayLiveAgent | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (agentRef.current) {
        agentRef.current.disconnect();
      }
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, currentTurn]);

  const toggleConnection = async () => {
    if (connected) {
      if (agentRef.current) await agentRef.current.disconnect();
      setConnected(false);
      agentRef.current = null;
    } else {
      agentRef.current = new HolidayLiveAgent();
      
      agentRef.current.onTranscriptUpdate = (input, output, turnComplete) => {
        setCurrentTurn(prev => ({
            user: prev.user + input,
            elf: prev.elf + output
        }));

        if (turnComplete) {
            setCurrentTurn(prev => {
                const newHistoryItems: {role: 'user' | 'elf', text: string}[] = [];
                if (prev.user.trim()) newHistoryItems.push({ role: 'user', text: prev.user.trim() });
                if (prev.elf.trim()) newHistoryItems.push({ role: 'elf', text: prev.elf.trim() });
                
                setHistory(h => [...h, ...newHistoryItems]);
                return { user: '', elf: '' };
            });
        }
      };

      try {
        await agentRef.current.connect();
        setConnected(true);
      } catch (e) {
        console.error("Failed to connect live agent", e);
        alert("Could not connect to microphone or API.");
      }
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center">
          <span className="material-symbols-outlined mr-1">arrow_back</span> Back
        </button>
        <h2 className="text-2xl font-christmas text-green-300">Elf Live Assistant</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-slate-900/50 rounded-2xl border border-white/5 p-8">
         
         {/* Visualizer Circle */}
         <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-700 ${connected ? 'bg-green-500/20 shadow-[0_0_50px_rgba(34,197,94,0.3)] scale-110' : 'bg-slate-700/20'}`}>
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${connected ? 'bg-green-500/40 animate-pulse' : 'bg-slate-700/40'}`}>
                 <span className={`material-symbols-outlined text-6xl ${connected ? 'text-green-200' : 'text-slate-500'}`}>
                    {connected ? 'graphic_eq' : 'mic_off'}
                 </span>
            </div>
         </div>

         <div className="mt-8 z-10 w-full max-w-md h-40 overflow-y-auto text-center space-y-2 text-sm mask-gradient scroll-smooth" ref={scrollRef}>
             {history.length === 0 && !currentTurn.user && !currentTurn.elf && (
                 <p className="text-slate-600 italic">Conversations will appear here...</p>
             )}
             
             {history.map((t, i) => (
                 <p key={i} className={t.role === 'user' ? 'text-slate-400' : 'text-green-300 font-semibold'}>
                     {t.role === 'elf' && '🧝 '}
                     {t.text}
                 </p>
             ))}
             
             {/* Current Turn (Streaming) */}
             {currentTurn.user && (
                 <p className="text-slate-400 opacity-80">{currentTurn.user}</p>
             )}
             {currentTurn.elf && (
                 <p className="text-green-300 font-semibold opacity-80">🧝 {currentTurn.elf}</p>
             )}
         </div>

         <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className={`absolute w-64 h-64 border border-green-500/10 rounded-full ${connected ? 'animate-spin-slow' : 'opacity-0'}`}></div>
         </div>
      </div>

      <div className="mt-6 flex justify-center shrink-0">
        <button 
          onClick={toggleConnection}
          className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all transform hover:scale-105 ${connected ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/30'} shadow-lg`}
        >
            <span className="material-symbols-outlined">{connected ? 'call_end' : 'call'}</span>
            {connected ? 'End Call' : 'Talk to Elf'}
        </button>
      </div>
    </div>
  );
};

export default SantaLive;
