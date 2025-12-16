
import React, { useState, useRef, useEffect } from 'react';
import { AgentMemory } from '../types';
import { generateCardText, generateHolidayVibeImage, generateHolidayBackground, HolidayLiveAgent } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface Props {
    memory: AgentMemory;
    updateMemory: (m: Partial<AgentMemory>) => void;
}

type GiftType = 'URL' | 'CODE';
type GiftProvider = 'APPLE' | 'GOOGLE' | 'AMAZON';

const CardWorkshop: React.FC<Props> = ({ memory, updateMemory }) => {
    // UI State
    const [activePage, setActivePage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [generationStatus, setGenerationStatus] = useState<string>("");
    
    // Gift State
    const [giftType, setGiftType] = useState<GiftType>('URL');
    const [giftProvider, setGiftProvider] = useState<GiftProvider>('APPLE');
    const [showGiftCode, setShowGiftCode] = useState(false);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
    const [includeGift, setIncludeGift] = useState(false);
    
    // Data State
    const [recipient, setRecipient] = useState(memory.recipientName || 'Family');
    const [sender, setSender] = useState(memory.senderName || 'Me');
    const [date, setDate] = useState(memory.date || new Date().toISOString().split('T')[0]);
    const [contextInput, setContextInput] = useState("Theme: Top trends in career changes and AI technology progress in 2025.\n\nLetter Focus: Encourage work-life balance and resilience. Inspire those looking for job changes, from new graduates to veterans with 20+ years of experience who may have recently lost their jobs.\n\nMessage: Never give up.");
    const [giftValue, setGiftValue] = useState(memory.giftUrl || '');
    
    // Album State
    const [albumLink, setAlbumLink] = useState(memory.photoAlbumLink || '');
    const [albumQrUrl, setAlbumQrUrl] = useState<string | null>(null);
    
    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Live Agent State
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState<{role: 'user' | 'elf', text: string}[]>([]);
    const [currentTurn, setCurrentTurn] = useState<{user: string, elf: string}>({ user: '', elf: '' });
    const agentRef = useRef<HolidayLiveAgent | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);

    // Sync local state with memory on mount
    useEffect(() => {
        if (memory.giftUrl) {
            setGiftValue(memory.giftUrl);
            setIncludeGift(true);
        }
    }, []);

    // Cleanup agent on unmount
    useEffect(() => {
        return () => {
            if (agentRef.current) agentRef.current.disconnect();
        };
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, currentTurn]);

    // Smart QR Logic (Gift)
    const getQrData = () => {
        if (!giftValue) return 'https://google.com';
        
        if (giftType === 'URL') return giftValue;
        
        // Handle Redeem Codes
        switch (giftProvider) {
            case 'APPLE':
                return `https://apps.apple.com/redeem?code=${giftValue}`;
            case 'GOOGLE':
                return `https://play.google.com/redeem?code=${giftValue}`;
            case 'AMAZON':
                return `https://www.amazon.com/gc/redeem?claimCode=${giftValue}`;
            default:
                return giftValue;
        }
    };

    // Pre-fetch QR Code for Gift
    useEffect(() => {
        let active = true;
        const fetchQr = async () => {
            if (!giftValue || !includeGift) {
                setQrCodeDataUrl(null);
                return;
            }
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(getQrData())}&color=255-255-255&bgcolor=000-000-000&format=png`;
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (active) setQrCodeDataUrl(reader.result as string);
                };
                reader.readAsDataURL(blob);
            } catch (e) {
                console.error("Failed to load QR code for PDF", e);
            }
        };
        fetchQr();
        return () => { active = false; };
    }, [giftValue, giftType, giftProvider, includeGift]);

    // Pre-fetch QR Code for Album Link
    useEffect(() => {
        let active = true;
        const fetchAlbumQr = async () => {
            if (!albumLink) {
                setAlbumQrUrl(null);
                return;
            }
            const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(albumLink)}&color=000-000-000&bgcolor=255-255-255&format=png`;
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (active) setAlbumQrUrl(reader.result as string);
                };
                reader.readAsDataURL(blob);
            } catch (e) {
                console.error("Failed to load Album QR", e);
            }
        };
        fetchAlbumQr();
        return () => { active = false; };
    }, [albumLink]);

    const handleDisconnect = async () => {
        if (agentRef.current) await agentRef.current.disconnect();
        setConnected(false);
        agentRef.current = null;
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const newImages: any[] = [];
        
        // Helper to read file as Promise
        const readFile = (file: File): Promise<void> => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const res = reader.result as string;
                    const matches = res.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                    if (matches) {
                        const imgObj = new Image();
                        imgObj.onload = () => {
                            newImages.push({ 
                                mime: matches[1], 
                                data: matches[2],
                                width: imgObj.width,
                                height: imgObj.height
                            });
                            resolve();
                        };
                        imgObj.src = res;
                    } else {
                        resolve();
                    }
                };
                reader.readAsDataURL(file);
            });
        };

        // Process all selected files
        await Promise.all(Array.from(files).map(readFile));
        
        // Batch update memory
        const currentImages = memory.userImages || [];
        updateMemory({ userImages: [...currentImages, ...newImages] });
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        const currentImages = memory.userImages || [];
        updateMemory({ userImages: currentImages.filter((_, i) => i !== index) });
    };

    const toggleConnection = async () => {
        if (connected) {
            await handleDisconnect();
        } else {
            agentRef.current = new HolidayLiveAgent();
            
            // Handle Conversation Updates
            agentRef.current.onTranscriptUpdate = (input, output, turnComplete) => {
                setCurrentTurn(prev => ({ user: prev.user + input, elf: prev.elf + output }));
                
                if (turnComplete) {
                    setCurrentTurn(prev => {
                        const newItems: {role: 'user' | 'elf', text: string}[] = [];
                        if (prev.user.trim()) newItems.push({ role: 'user', text: prev.user.trim() });
                        if (prev.elf.trim()) newItems.push({ role: 'elf', text: prev.elf.trim() });
                        setHistory(h => [...h, ...newItems]);
                        return { user: '', elf: '' };
                    });
                }
            };

            // Handle Voice-Triggered Generation (Optional fallback)
            agentRef.current.onGenerateTrigger = () => {
                console.log("Trigger received from Agent Tool Call");
                handleDisconnect(); 
                generateAssets(); 
            };

            try {
                // Pass text inputs as initial context
                const initial = `${contextInput}`;
                await agentRef.current.connect(initial);
                setConnected(true);
            } catch(e) {
                alert("Connection failed. Check permissions.");
            }
        }
    };

    const generateAssets = async () => {
        setLoading(true);
        setGenerationStatus("Creating magic...");
        try {
            // Combine history and manual inputs for context
            let context = `Theme/Requirements: ${contextInput}\n`;
            context += history.map(h => `${h.role}: ${h.text}`).join('\n');
            
            // Fallback if empty
            if (!context.trim() && !contextInput.trim()) {
                 context = "A standard festive holiday card."; 
            }

            const updates: Partial<AgentMemory> = { conversationContext: context };
            
            setGenerationStatus("Writing your message...");
            const textData = await generateCardText(context, recipient, sender);
            updates.cardMessage = textData.text;
            
            setGenerationStatus("Painting the cover...");
            // Use the first uploaded image as reference if available
            const firstImage = memory.userImages?.[0];
            const imageUrl = await generateHolidayVibeImage(
                context, 
                firstImage?.data, 
                firstImage?.mime
            );
            updates.generatedCardUrl = imageUrl;

            setGenerationStatus("Designing themed stationery...");
            // 3. Generate Background Texture (for inside pages)
            const bgUrl = await generateHolidayBackground(context);
            updates.generatedBackgroundUrl = bgUrl;

            updates.recipientName = recipient;
            updates.senderName = sender;
            updates.date = date;
            updates.giftUrl = includeGift ? giftValue : null;
            updates.photoAlbumLink = albumLink;
            
            updateMemory(updates);
            setActivePage(1); // Auto flip to inside

        } catch (e) {
            console.error(e);
            alert("Card generation failed. Please try again.");
        } finally {
            setLoading(false);
            setGenerationStatus("");
        }
    };

    const handleMainAction = async () => {
        if (connected) {
            await handleDisconnect();
        }
        await generateAssets();
    };

    // Helper to get button text
    const getActionButtonText = () => {
        if (loading) return "Creating Magic...";
        if (connected) return "Finish & Create Card";
        if (history.length > 0 || contextInput.trim()) return "Create Card";
        return "Create Card";
    };

    const getPagesList = () => {
        const pages = [0, 1]; // Cover, Letter
        // Show Photos page if images exist OR if an album link is provided
        if ((memory.userImages && memory.userImages.length > 0) || memory.photoAlbumLink) {
            pages.push(2); 
        }
        pages.push(3); // Gift
        pages.push(4); // Back
        return pages;
    };

    const downloadPDF = async () => {
        if (!pdfContainerRef.current) return;
        setGeneratingPdf(true);
        try {
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [400, 560]
            });

            const pages = pdfContainerRef.current.children;
            for (let i = 0; i < pages.length; i++) {
                const pageElement = pages[i] as HTMLElement;
                const canvas = await html2canvas(pageElement, {
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: null,
                    logging: false
                });
                
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                if (i > 0) doc.addPage();
                doc.addImage(imgData, 'JPEG', 0, 0, 400, 560);
            }

            doc.save(`holiday-card-${recipient}.pdf`);
        } catch (e) {
            console.error("PDF Generation failed:", e);
            alert("Could not generate PDF. Please try again.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const renderPageContent = (pageType: number) => {
        // Shared background style for non-cover pages
        const bgStyle: React.CSSProperties = memory.generatedBackgroundUrl ? {
            backgroundImage: `url(${memory.generatedBackgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#fffbf0' // fallback
        } : { backgroundColor: '#fffbf0' };

        // Overlay for readability if using image background
        const overlayClass = memory.generatedBackgroundUrl ? "bg-white/80" : "";

        switch(pageType) {
            case 0: // Cover
                return (
                    <div className="relative w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
                        {memory.generatedCardUrl ? (
                            <>
                                <div 
                                    className="absolute inset-0 w-full h-full z-0"
                                    style={{
                                        backgroundImage: `url(${memory.generatedCardUrl})`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat'
                                    }}
                                />
                                <div className="absolute inset-0 bg-black/30 z-0"></div>
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
                    <div className="w-full h-full text-slate-800 flex flex-col relative" style={bgStyle}>
                        <div className={`w-full h-full p-8 flex flex-col ${overlayClass}`}>
                            <div className="flex-1 overflow-y-auto flex flex-col justify-center">
                                <p className="font-serif leading-relaxed text-lg whitespace-pre-line">
                                    {memory.cardMessage || "Your heartfelt message will appear here..."}
                                </p>
                            </div>
                            <div className="mt-8 pt-4 border-t border-red-200/50 text-right">
                                <p className="font-christmas text-xl text-red-700">Warmly,</p>
                                <div className="mt-2 inline-block transform -rotate-2">
                                    <p className="font-christmas text-3xl text-slate-900">{sender}</p>
                                    <p className="font-serif text-xs text-slate-500 mt-1">{date}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Photos (New Page)
                return (
                    <div className="w-full h-full text-slate-800 flex flex-col relative" style={bgStyle}>
                         <div className={`w-full h-full p-6 flex flex-col items-center justify-center ${overlayClass}`}>
                             <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden content-center">
                                {memory.userImages?.map((img, i) => {
                                    // Check aspect ratio if available
                                    const isPortrait = (img.height || 0) > (img.width || 0);
                                    
                                    return (
                                        <div key={i} className={`bg-white p-2 shadow-lg transform hover:scale-105 transition-transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} self-center justify-self-center`}>
                                            <img 
                                                src={`data:${img.mime};base64,${img.data}`} 
                                                className={`block object-contain ${isPortrait ? 'h-[160px] w-auto' : 'w-full h-auto max-h-[120px]'}`} 
                                                alt="Memory" 
                                            />
                                        </div>
                                    );
                                })}
                                {/* Render QR Code card if album link exists */}
                                {memory.photoAlbumLink && albumQrUrl && (
                                    <div className="bg-white p-2 shadow-lg transform hover:scale-105 transition-transform -rotate-1 flex flex-col items-center justify-center self-center justify-self-center h-[160px] w-full">
                                        <img src={albumQrUrl} className="w-24 h-24 mb-2" alt="Album QR" />
                                        <p className="text-[10px] text-center font-bold text-slate-600 uppercase leading-tight">Shared<br/>Photo Album</p>
                                    </div>
                                )}
                             </div>
                             <p className="font-christmas text-xl text-red-700 mt-4">Holiday Memories</p>
                         </div>
                    </div>
                );
            case 3: // Inside Right (Gift)
                return (
                    <div className="w-full h-full text-slate-800 flex flex-col relative border-l border-slate-200/50" style={bgStyle}>
                        <div className={`w-full h-full p-8 flex flex-col items-center justify-center ${overlayClass}`}>
                            <div className="text-center w-full">
                                {includeGift && giftValue && qrCodeDataUrl ? (
                                    <>
                                        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">redeem</span>
                                        <h3 className="font-christmas text-3xl text-red-700 mb-6">A Little Something</h3>
                                        <div className="bg-white p-4 rounded-xl shadow-inner border border-slate-200 inline-block">
                                            <img src={qrCodeDataUrl} alt="Gift QR" className="w-32 h-32" />
                                        </div>
                                        <p className="mt-6 text-sm font-serif text-slate-600 italic max-w-xs mx-auto">
                                            {giftType === 'CODE' && giftProvider === 'APPLE' ? 'Scan to redeem on App Store' : 'Scan to unwrap your surprise!'}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                         <span className="material-symbols-outlined text-6xl text-amber-500 mb-4">volunteer_activism</span>
                                         <h3 className="font-christmas text-4xl text-red-800 mb-4">Best Wishes</h3>
                                         <p className="font-serif text-slate-600 italic px-8">
                                            "May your days be merry and bright, and may all your Christmases be white."
                                         </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 4: // Back
                return (
                    <div className="w-full h-full text-slate-400 flex flex-col items-center justify-end" style={bgStyle}>
                         <div className={`w-full h-full p-8 flex flex-col items-center justify-end ${overlayClass}`}>
                            <div className="mb-12 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                    <span className="font-christmas text-xl text-slate-500">Holiday Factory</span>
                                </div>
                                <p className="text-xs uppercase tracking-widest">Designed with Gemini 2.5</p>
                            </div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const activePageType = getPagesList()[activePage];
    const totalPages = getPagesList().length;

    return (
        <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl min-h-[600px] flex flex-col md:flex-row gap-8">
            {/* Left Panel: Inputs & Chat */}
            <div className="w-full md:w-1/3 flex flex-col gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                    <h3 className="font-christmas text-2xl text-red-300 mb-4">Card Settings</h3>
                    
                    {/* People */}
                    <div className="mb-4 space-y-3">
                        <div>
                            <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Recipient</label>
                            <input value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-red-500 outline-none" placeholder="Name" />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="block text-slate-400 text-xs uppercase font-bold mb-1">From</label>
                                <input value={sender} onChange={e => setSender(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-red-500 outline-none" placeholder="Your Name" />
                            </div>
                            <div className="w-1/3">
                                <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Date</label>
                                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs focus:border-red-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Photo Reference / Uploads */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-1">
                            Photos (Style Ref & Memories)
                        </label>
                        <div className="grid grid-cols-4 gap-2 mb-2">
                            {memory.userImages?.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded overflow-hidden group border border-slate-600">
                                    <img src={`data:${img.mime};base64,${img.data}`} className="w-full h-full object-cover" alt="thumbnail" />
                                    <button 
                                        onClick={() => removeImage(idx)}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            ))}
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="aspect-square bg-slate-700 hover:bg-slate-600 rounded border border-dashed border-slate-500 flex items-center justify-center text-slate-300 transition-colors"
                            >
                                <span className="material-symbols-outlined">add</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                        </div>
                        
                        {/* Google Photos Link Input */}
                        <div className="mt-2">
                             <input 
                                value={albumLink} 
                                onChange={e => setAlbumLink(e.target.value)} 
                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-xs focus:border-red-500 outline-none" 
                                placeholder="Google Photos / Album Link" 
                             />
                             <p className="text-[10px] text-slate-500 mt-1">
                                Link generates a QR code for recipients. To print photos on the card, please <span className="text-slate-300 font-bold cursor-pointer hover:underline" onClick={() => fileInputRef.current?.click()}>upload them here</span> (multi-select supported).
                             </p>
                        </div>
                    </div>

                    {/* Context */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Theme / Context</label>
                        <textarea 
                            value={contextInput} 
                            onChange={e => setContextInput(e.target.value)} 
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-red-500 outline-none text-sm h-20 resize-none" 
                            placeholder="e.g. A cyberpunk christmas with neon lights..." 
                        />
                    </div>

                    {/* Letter Editor */}
                    <div className="mb-4">
                        <label className="block text-slate-400 text-xs uppercase font-bold mb-1">Letter Content</label>
                        <textarea 
                            value={memory.cardMessage || ""} 
                            onChange={e => updateMemory({ cardMessage: e.target.value })} 
                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-red-500 outline-none text-sm h-24 resize-none" 
                            placeholder="Generated message will appear here. You can also write your own!" 
                        />
                    </div>
                    
                    {/* Gift Section */}
                    <div className="mb-2 pt-4 border-t border-white/5">
                         <div className="flex items-center gap-2 mb-2">
                            <input 
                                type="checkbox" 
                                id="includeGift" 
                                checked={includeGift} 
                                onChange={e => setIncludeGift(e.target.checked)}
                                className="accent-red-500"
                            />
                            <label htmlFor="includeGift" className="text-slate-300 text-sm font-bold cursor-pointer">Include Digital Gift</label>
                         </div>
                         
                         {includeGift && (
                             <div className="animate-fade-in pl-2 border-l-2 border-slate-700 ml-1">
                                <div className="flex gap-2 mb-2">
                                    <button onClick={() => setGiftType('URL')} className={`text-xs px-2 py-1 rounded ${giftType === 'URL' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>Web Link</button>
                                    <button onClick={() => setGiftType('CODE')} className={`text-xs px-2 py-1 rounded ${giftType === 'CODE' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-400'}`}>Redeem Code</button>
                                </div>
                                
                                {giftType === 'CODE' && (
                                    <div className="flex gap-1 mb-2">
                                        {(['APPLE', 'GOOGLE', 'AMAZON'] as GiftProvider[]).map(p => (
                                            <button key={p} onClick={() => setGiftProvider(p)} className={`text-[10px] px-2 py-1 rounded border ${giftProvider === p ? 'border-amber-500 text-amber-500' : 'border-slate-700 text-slate-500'}`}>
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                <div className="relative">
                                    <input 
                                        value={giftValue} 
                                        onChange={e => setGiftValue(e.target.value)} 
                                        type={showGiftCode ? "text" : "password"}
                                        placeholder={giftType === 'URL' ? "https://..." : "ABCD-1234-..."} 
                                        className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:border-red-500 outline-none pr-8 text-sm" 
                                    />
                                    <button 
                                        onClick={() => setShowGiftCode(!showGiftCode)}
                                        className="absolute right-2 top-2 text-slate-500 hover:text-white"
                                    >
                                        <span className="material-symbols-outlined text-sm">{showGiftCode ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                             </div>
                         )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col min-h-[300px]">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="font-christmas text-xl text-red-300">Live Elf Chat</h3>
                        {connected && <span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}
                    </div>

                    <div className="flex-1 flex flex-col relative">
                        {/* Chat History */}
                        <div className="flex-1 bg-black/20 rounded-lg p-3 overflow-y-auto mb-2 text-sm space-y-2 h-40 border border-white/5 scroll-smooth" ref={scrollRef}>
                            {history.length === 0 && !currentTurn.user && <p className="text-slate-600 italic text-center mt-8 text-xs">
                                Need inspiration? Chat with the Elf!<br/>
                                Or fill the context above and create.
                            </p>}
                            {history.map((h, i) => (
                                <p key={i} className={h.role === 'user' ? 'text-slate-300' : 'text-green-300'}>
                                    <span className="font-bold text-xs opacity-50 block uppercase">{h.role}</span>
                                    {h.text}
                                </p>
                            ))}
                            {currentTurn.user && <p className="text-slate-300 opacity-60"><span className="font-bold text-xs opacity-50 block uppercase">USER</span>{currentTurn.user}</p>}
                            {currentTurn.elf && <p className="text-green-300 opacity-60"><span className="font-bold text-xs opacity-50 block uppercase">ELF</span>{currentTurn.elf}</p>}
                        </div>
                        
                        {/* Voice Controls Only */}
                        <div className="flex justify-center mt-2">
                             <button 
                                onClick={toggleConnection}
                                className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${connected ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'}`}
                            >
                                <span className="material-symbols-outlined">{connected ? 'mic_off' : 'mic'}</span>
                                {connected ? 'End Chat' : 'Start Voice Chat'}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={handleMainAction}
                        disabled={loading}
                        className={`w-full mt-4 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${loading ? 'bg-slate-700 cursor-wait' : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-lg shadow-amber-900/30'}`}
                    >
                        <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>
                            {loading ? 'refresh' : (connected ? 'check_circle' : 'auto_fix_high')}
                        </span>
                        {getActionButtonText()}
                    </button>
                </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="w-full md:w-2/3 flex flex-col items-center justify-center bg-black/20 rounded-2xl border border-white/5 p-4 relative">
                <div className="relative w-[400px] h-[560px] shadow-2xl transition-all duration-500 transform perspective-1000">
                    <div className="w-full h-full bg-white rounded-r-lg rounded-l-sm overflow-hidden relative shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none"></div>
                        {renderPageContent(activePageType)}
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-8 flex gap-4 bg-slate-900/80 p-2 rounded-full border border-white/10 backdrop-blur items-center">
                    <button onClick={() => setActivePage(Math.max(0, activePage - 1))} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        {getPagesList().map((_, i) => (
                             <div key={i} onClick={() => setActivePage(i)} className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${activePage === i ? 'bg-red-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`} />
                        ))}
                    </div>
                    <button onClick={() => setActivePage(Math.min(totalPages - 1, activePage + 1))} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
                
                <div className="flex justify-between w-full max-w-[400px] mt-4 items-center">
                    <p className="text-xs text-slate-500 uppercase tracking-widest">
                        {['Cover Page', 'Letter', 'Photos', 'Gift', 'Back'].filter((_, i) => {
                            // Simple mapping based on known indices in renderPageContent
                            if (i === 2 && (!memory.userImages || memory.userImages.length === 0) && !memory.photoAlbumLink) return false; 
                            return true;
                        })[activePage] || 'Page'}
                    </p>
                    {memory.generatedCardUrl && (
                        <button 
                            onClick={downloadPDF}
                            disabled={generatingPdf}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${generatingPdf ? 'bg-slate-700 text-slate-500' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
                        >
                            <span className="material-symbols-outlined">{generatingPdf ? 'hourglass_empty' : 'download'}</span>
                            {generatingPdf ? 'PDF...' : 'Download PDF'}
                        </button>
                    )}
                </div>
            </div>

            {/* Hidden Container for PDF Rendering */}
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', pointerEvents: 'none' }}>
                <div ref={pdfContainerRef}>
                    {getPagesList().map((pageType, i) => (
                        <div key={i} style={{ width: '400px', height: '560px', overflow: 'hidden', background: 'white' }}>
                            {renderPageContent(pageType)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CardWorkshop;
