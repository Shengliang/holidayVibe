import React, { useState } from 'react';
import { AgentMemory } from '../types';
import { generateCardText, generateHolidayVibeImage } from '../services/geminiService';

interface Props {
    onBack: () => void;
    memory: AgentMemory;
    updateMemory: (m: Partial<AgentMemory>) => void;
}

const CardWorkshop: React.FC<Props> = ({ onBack, memory, updateMemory }) => {
    const [recipient, setRecipient] = useState(memory.recipientName);
    const [giftUrl, setGiftUrl] = useState(memory.giftUrl || '');
    const [loading, setLoading] = useState(false);
    const [activePage, setActivePage] = useState(0);

    const generateAssets = async () => {
        setLoading(true);
        try {
            const updates: Partial<AgentMemory> = {};
            
            // 1. Generate Text (Search Grounded) if missing
            if (!memory.cardMessage) {
                const textData = await generateCardText(memory.vibe, recipient);
                updates.cardMessage = textData.text;
            }
            
            // 2. Generate Cover Image if missing
            if (!memory.generatedCardUrl) {
                const imagePrompt = `A holiday greeting card background, theme: ${memory.vibe}, high quality, festive, no text`;
                const imageUrl = await generateHolidayVibeImage(imagePrompt);
                updates.generatedCardUrl = imageUrl;
            }

            updates.recipientName = recipient;
            updates.giftUrl = giftUrl;
            
            updateMemory(updates);
            
            // Move to inside page after generation
            setActivePage(1);

        } catch (e) {
            console.error(e);
            alert("Card generation had a hiccup. Try again!");
        } finally {
            setLoading(false);
        }
    };

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(giftUrl || 'https://google.com')}&color=255-255-255&bgcolor=000-000-000`;

    const renderPageContent = () => {
        switch(activePage) {
            case 0: // Cover
                return (
                    <div className="relative w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        {memory.generatedCardUrl ? (
                            <>
                                <img src={memory.generatedCardUrl} className="absolute inset-0 w-full h-full object-cover" alt="Cover" />
                                <div className="absolute inset-0 bg-black/30"></div>
                                <div className="relative z-10 text-center p-6 border-4 border-white/20 m-4 h-[90%] flex items-center justify-center">
                                    <h1 className="font-christmas text-5xl text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">Merry Christmas</h1>
                                </div>
                            </>
                        ) : (
                            <div className="text-slate-500 text-center">
                                <span className="material-symbols-outlined text-6xl opacity-30">image</span>
                                <p className="mt-4">Cover Image Placeholder</p>
                            </div>
                        )}
                    </div>
                );
            case 1: // Inside Left (Letter)
                return (
                    <div className="w-full h-full bg-[#fffbf0] text-slate-800 p-8 flex flex-col relative">
                        <div className="flex-1 overflow-y-auto">
                            <p className="font-christmas text-2xl text-red-700 mb-4">Dear {recipient},</p>
                            <p className="font-serif leading-relaxed text-lg whitespace-pre-line">
                                {memory.cardMessage || "Your heartfelt message will appear here..."}
                            </p>
                        </div>
                        <div className="mt-8 pt-4 border-t border-red-200 text-right">
                             <p className="font-christmas text-xl text-red-700">Warmly,</p>
                             <p className="font-serif">The Elves</p>
                        </div>
                    </div>
                );
            case 2: // Inside Right (Gift/QR)
                return (
                    <div className="w-full h-full bg-[#fffbf0] text-slate-800 p-8 flex flex-col items-center justify-center relative border-l border-slate-200">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-6xl text-red-500 mb-4">redeem</span>
                            <h3 className="font-christmas text-3xl text-red-700 mb-6">A Little Something</h3>
                            
                            <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 inline-block">
                                {giftUrl ? (
                                     <img src={qrCodeUrl} alt="Gift QR" className="w-32 h-32" />
                                ) : (
                                     <div className="w-32 h-32 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                                         No Gift URL
                                     </div>
                                )}
                            </div>
                            
                            <p className="mt-6 text-sm font-serif text-slate-600 italic max-w-xs mx-auto">
                                Scan the code to unwrap your digital surprise!
                            </p>
                        </div>
                    </div>
                );
            case 3: // Back
                return (
                    <div className="w-full h-full bg-slate-100 text-slate-400 flex flex-col items-center justify-end p-8">
                        <div className="mb-12 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <span className="material-symbols-outlined">auto_awesome</span>
                                <span className="font-christmas text-xl text-slate-500">Holiday Vibe Pipeline</span>
                            </div>
                            <p className="text-xs uppercase tracking-widest">Designed with Gemini 2.5</p>
                            <p className="text-[10px] mt-1">Made in Vibe Studio</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center">
                    <span className="material-symbols-outlined mr-1">arrow_back</span> Back
                </button>
                <h2 className="text-2xl font-christmas text-red-300">Holiday Card Publisher</h2>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Controls */}
                <div className="w-full lg:w-1/3 space-y-4">
                    <div className="p-4 bg-slate-900/50 rounded-xl border border-white/5 space-y-4">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Recipient</label>
                            <input 
                                value={recipient}
                                onChange={e => setRecipient(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-1 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-slate-400 text-xs uppercase font-bold mb-2">Gift URL (for QR)</label>
                            <input 
                                value={giftUrl}
                                onChange={e => setGiftUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:ring-1 focus:ring-red-500 outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-amber-300 bg-amber-900/20 p-2 rounded">
                             <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                             Vibe: {memory.vibe}
                        </div>
                    </div>

                    <button 
                        onClick={generateAssets}
                        disabled={loading}
                        className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${loading ? 'bg-slate-700' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20'}`}
                    >
                        {loading ? 'Elves are crafting...' : 'Generate Card Assets'}
                    </button>
                    
                    <div className="flex justify-between items-center bg-black/20 p-2 rounded-lg">
                        <button onClick={() => setActivePage(Math.max(0, activePage - 1))} className="p-2 hover:bg-white/10 rounded-full">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <div className="flex gap-2">
                             {[0,1,2,3].map(i => (
                                 <div 
                                    key={i} 
                                    onClick={() => setActivePage(i)}
                                    className={`w-2 h-2 rounded-full cursor-pointer ${activePage === i ? 'bg-red-400' : 'bg-slate-600'}`}
                                 />
                             ))}
                        </div>
                        <button onClick={() => setActivePage(Math.min(3, activePage + 1))} className="p-2 hover:bg-white/10 rounded-full">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    
                    <div className="text-center text-xs text-slate-500">
                        Current View: {['Cover Page', 'Inside: Letter', 'Inside: Gift', 'Back Page'][activePage]}
                    </div>
                </div>

                {/* Preview Area */}
                <div className="w-full lg:w-2/3 flex items-center justify-center">
                    <div className="relative w-[400px] h-[560px] shadow-2xl transition-all duration-500 transform perspective-1000">
                         {/* Card Page Container */}
                         <div className="w-full h-full bg-white rounded-r-lg rounded-l-sm overflow-hidden relative shadow-lg">
                             {/* Spine effect */}
                             <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none"></div>
                             
                             {renderPageContent()}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CardWorkshop;
