import React, { useState } from 'react';
import { AgentMemory } from '../types';

interface Props {
    onBack: () => void;
    memory: AgentMemory;
    updateMemory: (m: Partial<AgentMemory>) => void;
}

const CharityAgent: React.FC<Props> = ({ onBack, memory, updateMemory }) => {
    const [amount, setAmount] = useState(25);
    const [selectedCharity, setSelectedCharity] = useState(memory.charity || 'Code for Kids');
    const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'NEGOTIATING' | 'TRANSFERRING' | 'SUCCESS'>('IDLE');

    const charities = ['Code for Kids', 'Global Reforestation', 'Ocean Cleanup Agent DAO', 'Open Source Health'];

    const handleDonate = () => {
        setStatus('CONNECTING');
        // Simulation of AP2 Protocol Steps
        setTimeout(() => setStatus('NEGOTIATING'), 1500);
        setTimeout(() => setStatus('TRANSFERRING'), 3000);
        setTimeout(() => {
            setStatus('SUCCESS');
            updateMemory({ charity: selectedCharity, donationAmount: (memory.donationAmount || 0) + amount });
        }, 5000);
    };

    return (
        <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 relative z-10">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center">
                    <span className="material-symbols-outlined mr-1">arrow_back</span> Back
                </button>
                <h2 className="text-2xl font-christmas text-amber-300">AP2 Charity Agent</h2>
            </div>

            {status === 'SUCCESS' ? (
                 <div className="flex flex-col items-center justify-center py-12 animate-fade-in relative z-10">
                     <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                         <span className="material-symbols-outlined text-5xl text-white">check</span>
                     </div>
                     <h3 className="text-2xl font-bold text-white mb-2">Donation Verified!</h3>
                     <p className="text-slate-300">Your agent successfully transferred ${amount} to {selectedCharity}.</p>
                     <button onClick={() => setStatus('IDLE')} className="mt-8 text-amber-400 hover:text-amber-300 underline">Donate again</button>
                 </div>
            ) : status !== 'IDLE' ? (
                <div className="flex flex-col items-center justify-center py-12 relative z-10">
                     <div className="w-64 h-2 bg-slate-700 rounded-full mb-8 overflow-hidden">
                         <div className="h-full bg-amber-500 animate-progress"></div>
                     </div>
                     <div className="flex items-center gap-3 text-amber-200 text-lg font-mono">
                         <span className="material-symbols-outlined animate-spin">settings</span>
                         {status === 'CONNECTING' && 'Connecting to Agent Wallet...'}
                         {status === 'NEGOTIATING' && 'Verifying Charity Signature...'}
                         {status === 'TRANSFERRING' && 'Executing AP2 Smart Contract...'}
                     </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <div>
                        <label className="block text-slate-400 mb-2 uppercase text-xs font-bold">Select Charity DAO</label>
                        <div className="space-y-2">
                            {charities.map(c => (
                                <div 
                                    key={c}
                                    onClick={() => setSelectedCharity(c)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedCharity === c ? 'bg-amber-900/40 border-amber-500 text-amber-100' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                                >
                                    {c}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col justify-between">
                        <div>
                             <label className="block text-slate-400 mb-2 uppercase text-xs font-bold">Amount (USD)</label>
                             <div className="flex items-center gap-4 mb-8">
                                 {[10, 25, 50, 100].map(val => (
                                     <button 
                                        key={val}
                                        onClick={() => setAmount(val)}
                                        className={`w-12 h-12 rounded-full font-bold border ${amount === val ? 'bg-amber-500 text-black border-amber-500' : 'border-slate-600 hover:border-amber-500'}`}
                                     >
                                         ${val}
                                     </button>
                                 ))}
                             </div>
                             <div className="p-4 bg-black/20 rounded-lg mb-4">
                                 <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Agent Memory Context</h4>
                                 <p className="text-sm text-slate-300">
                                     Based on your vibe <span className="text-amber-400">"{memory.vibe}"</span>, we recommend <span className="font-bold">{selectedCharity}</span> to align with your festive spirit.
                                 </p>
                             </div>
                        </div>
                        <button 
                             onClick={handleDonate}
                             className="w-full py-4 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-bold text-lg rounded-xl shadow-lg shadow-amber-900/30 flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">payments</span>
                            Process with AP2
                        </button>
                    </div>
                </div>
            )}
            
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </div>
    );
};

export default CharityAgent;