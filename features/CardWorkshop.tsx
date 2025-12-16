
import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { AgentMemory } from '../types';
import { generateCardText, generateHolidayVibeImage, generateHolidayBackground, HolidayLiveAgent } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface WorkshopHandle {
    triggerGeneration: () => Promise<void>;
}

interface Props {
    memory: AgentMemory;
    updateMemory: (m: Partial<AgentMemory>) => void;
    onStatusChange: (status: { loading: boolean, connected: boolean }) => void;
}

type GiftType = 'URL' | 'CODE';
type GiftProvider = 'APPLE' | 'GOOGLE' | 'AMAZON';

const CardWorkshop = forwardRef<WorkshopHandle, Props>(({ memory, updateMemory, onStatusChange }, ref) => {
    // UI State
    const [activePage, setActivePage] = useState(0);
    const [leftTab, setLeftTab] = useState<'settings' | 'chat'>('settings');
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
    // Sync context with default card theme
    const [contextInput, setContextInput] = useState("Theme: 2025 Career & AI Advancements. Focus: Resilience, Work-Life Balance, and New Beginnings for graduates and veterans.");
    const [giftValue, setGiftValue] = useState(memory.giftUrl || '');
    
    // Album State
    const [albumLink, setAlbumLink] = useState(memory.photoAlbumLink || '');
    const [albumQrUrl, setAlbumQrUrl] = useState<string | null>(null);
    
    // Image Selection State (Index of the image to use as Cover Reference)
    const [coverImageIndex, setCoverImageIndex] = useState<number | null>(null);

    // Upload State
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Live Agent State
    const [connected, setConnected] = useState(false);
    const [history, setHistory] = useState<{role: 'user' | 'elf', text: string}[]>([]);
    const [currentTurn, setCurrentTurn] = useState<{user: string, elf: string}>({ user: '', elf: '' });
    
    // Refs for Agent logic
    const agentRef = useRef<HolidayLiveAgent | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const pdfContainerRef = useRef<HTMLDivElement>(null);
    
    // Accumulator Ref to handle high-frequency WebSocket updates safely
    const currentTurnAccumulator = useRef<{user: string, elf: string}>({ user: '', elf: '' });

    // Helper Ref to access the latest generateAssets function from within the stable agent callback
    const generateAssetsRef = useRef<() => Promise<void>>(async () => {});

    // Notify parent of status changes
    useEffect(() => {
        onStatusChange({ loading, connected });
    }, [loading, connected, onStatusChange]);

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
    }, [history, currentTurn, leftTab]);

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

        await Promise.all(Array.from(files).map(readFile));
        const currentImages = memory.userImages || [];
        updateMemory({ userImages: [...currentImages, ...newImages] });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        const currentImages = memory.userImages || [];
        if (coverImageIndex === index) setCoverImageIndex(null);
        if (coverImageIndex !== null && index < coverImageIndex) setCoverImageIndex(coverImageIndex - 1);
        
        updateMemory({ userImages: currentImages.filter((_, i) => i !== index) });
    };

    const toggleConnection = async () => {
        if (connected) {
            await handleDisconnect();
        } else {
            setLeftTab('chat'); // Switch to chat tab automatically
            agentRef.current = new HolidayLiveAgent();
            
            // Reset accumulator
            currentTurnAccumulator.current = { user: '', elf: '' };
            setCurrentTurn({ user: '', elf: '' });

            agentRef.current.onTranscriptUpdate = (input, output, turnComplete) => {
                const acc = currentTurnAccumulator.current;
                // Live API sends text chunks, accumulate them
                acc.user += input;
                acc.elf += output;
                
                // Force update UI with current accumulated text
                setCurrentTurn({ user: acc.user, elf: acc.elf });

                if (turnComplete) {
                    // Capture current state values before resetting
                    const finalUser = acc.user.trim();
                    const finalElf = acc.elf.trim();

                    if (finalUser || finalElf) {
                        setHistory(prev => {
                            const newItems: {role: 'user' | 'elf', text: string}[] = [];
                            if (finalUser) newItems.push({ role: 'user', text: finalUser });
                            if (finalElf) newItems.push({ role: 'elf', text: finalElf });
                            return [...prev, ...newItems];
                        });
                    }
                    
                    // Reset accumulator and UI for next turn
                    acc.user = '';
                    acc.elf = '';
                    setCurrentTurn({ user: '', elf: '' });
                }
            };

            agentRef.current.onGenerateTrigger = () => {
                console.log("Trigger received from Agent Tool Call");
                // Call the latest generateAssets function via Ref to ensure we have latest history
                if (generateAssetsRef.current) {
                    handleDisconnect(); 
                    generateAssetsRef.current();
                }
            };

            try {
                const initial = `
                    Current Form Data:
                    - Recipient: ${recipient}
                    - Sender: ${sender}
                    - Theme/Context: ${contextInput}
                    - Message Draft: ${memory.cardMessage || "(Empty)"}
                    Use this information to guide the conversation.
                `.trim();
                
                await agentRef.current.connect(initial);
                setConnected(true);
            } catch(e) {
                alert("Connection failed. Check permissions.");
            }
        }
    };

    const handleClearDefaults = () => {
        // Reset Local State UI inputs immediately
        setRecipient('');
        setSender('');
        setDate(new Date().toISOString().split('T')[0]);
        setContextInput(''); // Explicitly clear the long default string
        setGiftValue('');
        setAlbumLink('');
        setIncludeGift(false);
        setCoverImageIndex(null);
        setQrCodeDataUrl(null);
        setAlbumQrUrl(null);
        setHistory([]); // Explicitly clear history
        
        // Reset Global Memory (clears Preview)
        updateMemory({
            recipientName: '',
            senderName: '',
            date: new Date().toISOString().split('T')[0],
            cardMessage: '',
            generatedCardUrl: null,
            generatedBackgroundUrl: null,
            giftUrl: null,
            photoAlbumLink: '',
            conversationContext: '',
            userImages: []
        });

        // Reset View to Cover
        setActivePage(0);
    };

    const generateAssets = async () => {
        if (connected) await handleDisconnect();

        setLoading(true);
        setGenerationStatus("Creating magic...");
        try {
            let context = `Theme/Requirements: ${contextInput}\n`;
            // Crucial: This function reads the latest 'history' from component state
            // because generateAssets is recreated on every render and stored in generateAssetsRef
            context += history.map(h => `${h.role}: ${h.text}`).join('\n');
            
            console.log("Generating with Context:", context); // Debug log

            if (!context.trim() && !contextInput.trim()) {
                 context = "A standard festive holiday card."; 
            }

            const updates: Partial<AgentMemory> = { conversationContext: context };
            
            setGenerationStatus("Writing your message...");
            const textData = await generateCardText(context, recipient, sender);
            updates.cardMessage = textData.text;
            
            setGenerationStatus("Painting the cover...");
            const selectedImage = coverImageIndex !== null ? memory.userImages?.[coverImageIndex] : undefined;
            
            const imageUrl = await generateHolidayVibeImage(
                context, 
                selectedImage?.data, 
                selectedImage?.mime
            );
            updates.generatedCardUrl = imageUrl;

            setGenerationStatus("Designing themed stationery...");
            const bgUrl = await generateHolidayBackground(context);
            updates.generatedBackgroundUrl = bgUrl;

            updates.recipientName = recipient;
            updates.senderName = sender;
            updates.date = date;
            updates.giftUrl = includeGift ? giftValue : null;
            updates.photoAlbumLink = albumLink;
            
            updateMemory(updates);
            setActivePage(1); 

        } catch (e) {
            console.error(e);
            alert("Card generation failed. Please try again.");
        } finally {
            setLoading(false);
            setGenerationStatus("");
        }
    };

    // Update the Ref on every render so the Agent callback always has the fresh function with fresh state closures
    useEffect(() => {
        generateAssetsRef.current = generateAssets;
    });

    useImperativeHandle(ref, () => ({
        triggerGeneration: generateAssets
    }));

    const getPagesList = () => {
        const pages = [0, 1];
        if ((memory.userImages && memory.userImages.length > 0) || memory.photoAlbumLink) {
            pages.push(2); 
        }
        pages.push(3); 
        pages.push(4); 
        return pages;
    };

    const createPDFDoc = async () => {
        if (!pdfContainerRef.current) return null;
        const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [400, 560] });
        const pages = pdfContainerRef.current.children;
        
        if (pages.length === 0) return null;

        for (let i = 0; i < pages.length; i++) {
            const pageElement = pages[i] as HTMLElement;
            const canvas = await html2canvas(pageElement, {
                scale: 2,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#fffbf0', // Set explicit background to avoid transparency issues
                logging: false
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            if (i > 0) doc.addPage();
            doc.addImage(imgData, 'JPEG', 0, 0, 400, 560);
        }
        return doc;
    };

    const getSafeFilename = () => {
        // Create a safe, compatible filename without special characters
        const safeRecipient = (recipient || 'friend').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        return `card_${safeRecipient}.pdf`;
    };

    const downloadPDF = async () => {
        setGeneratingPdf(true);
        try {
            const doc = await createPDFDoc();
            if (doc) doc.save(getSafeFilename());
        } catch (e) {
            console.error("PDF Generation failed:", e);
            alert("Could not generate PDF.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const sharePDF = async () => {
        setGeneratingPdf(true);
        let doc: jsPDF | null = null;
        const filename = getSafeFilename();

        // 1. Prepare Title and Body for Email
        const title = `Holiday Card for ${recipient}`;
        const bodyText = `Hi ${recipient},\n\nI created a personalized holiday card for you! (See attached)\n\nWarmly,\n${sender}`;

        try {
            doc = await createPDFDoc();
            if (!doc) return;
            
            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], filename, { type: 'application/pdf', lastModified: Date.now() });
            
            const shareData = {
                files: [file],
                title: title,
                text: bodyText,
            };

            // 2. Attempt Native Share
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                     await navigator.share(shareData);
                } catch (shareError: any) {
                    // If user cancels, we just stop. If it's a real error, we throw to fallback.
                    if (shareError.name !== 'AbortError') throw shareError;
                }
            } else {
                throw new Error("Web Share API not supported for files");
            }

        } catch (e: any) {
            console.warn("Share failed or not supported, falling back to download+mailto:", e);
            
            // 3. Fallback: Download & Prompt Email
            if (doc) {
                // Save the file so the user has it locally
                doc.save(filename);
                
                // Wait briefly for download to initiate
                setTimeout(() => {
                    const subject = encodeURIComponent(title);
                    // Updated body to instruct user to attach the file
                    const fallbackBody = encodeURIComponent(`Hi ${recipient},\n\nI created a holiday card for you!\n\n(I have downloaded the card as "${filename}" to my device. Please see the attached PDF.)\n\nWarmly,\n${sender}`);
                    const mailto = `mailto:?subject=${subject}&body=${fallbackBody}`;
                    
                    if (confirm(`Sharing didn't work directly, so I downloaded "${filename}" to your device.\n\nWould you like to open your email app now? (You'll need to attach the downloaded file manually)`)) {
                        window.location.href = mailto;
                    }
                }, 800);
            } else {
                alert("Could not generate PDF.");
            }
        } finally {
            setGeneratingPdf(false);
        }
    };

    const renderPageContent = (pageType: number) => {
        const bgStyle: React.CSSProperties = memory.generatedBackgroundUrl ? {
            backgroundImage: `url(${memory.generatedBackgroundUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#fffbf0' 
        } : { backgroundColor: '#fffbf0' };
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
            case 2: // Photos
                return (
                    <div className="w-full h-full text-slate-800 flex flex-col relative" style={bgStyle}>
                         <div className={`w-full h-full p-6 flex flex-col items-center justify-center ${overlayClass}`}>
                             <div className="grid grid-cols-2 gap-4 w-full h-full overflow-hidden content-center">
                                {memory.userImages?.map((img, i) => {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-full min-h-[600px] overflow-hidden">
            {/* Left Panel: Tabs Container */}
            <div className="lg:col-span-1 flex flex-col bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden relative">
                
                {/* Tab Header */}
                <div className="flex border-b border-white/5 bg-slate-900/50 shrink-0 z-20">
                    <button 
                        onClick={() => setLeftTab('settings')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${leftTab === 'settings' ? 'bg-slate-800 text-red-400 border-b-2 border-red-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className="material-symbols-outlined text-lg">tune</span>
                        Settings
                    </button>
                    <button 
                        onClick={() => setLeftTab('chat')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${leftTab === 'chat' ? 'bg-slate-800 text-green-400 border-b-2 border-green-500' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <span className="material-symbols-outlined text-lg">graphic_eq</span>
                        Live Chat
                        {connected && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1"></span>}
                    </button>
                </div>

                {/* Tab Content Wrapper */}
                <div className="flex-1 relative flex flex-col min-h-0 bg-slate-900/20">
                    
                    {/* SETTINGS VIEW - Standard Block Flow, Hidden if not active */}
                    <div className={`flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 ${leftTab === 'settings' ? 'flex' : 'hidden'}`}>
                        
                        {/* Clear Defaults Header */}
                        <div className="flex justify-between items-center mb-2">
                             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Card Details</h3>
                             <button 
                                onClick={handleClearDefaults}
                                className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                             >
                                <span className="material-symbols-outlined text-sm">restart_alt</span>
                                Start Fresh
                             </button>
                        </div>

                        {/* People */}
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-3">
                            <div>
                                <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Recipient</label>
                                <input value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-red-500 outline-none transition-colors" placeholder="Name" />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">From</label>
                                    <input value={sender} onChange={e => setSender(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-sm focus:border-red-500 outline-none transition-colors" placeholder="Your Name" />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Date</label>
                                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-[10px] focus:border-red-500 outline-none transition-colors" />
                                </div>
                            </div>
                        </div>

                        {/* Photos */}
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                            <label className="block text-slate-500 text-[10px] uppercase font-bold mb-2 flex justify-between">
                                <span>Photos (Select Cover Ref)</span>
                                <span className="text-[10px]">{memory.userImages?.length || 0}</span>
                            </label>
                            <div className="grid grid-cols-4 gap-2 mb-2">
                                {memory.userImages?.map((img, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setCoverImageIndex(coverImageIndex === idx ? null : idx)}
                                        className={`relative aspect-square rounded-lg overflow-hidden group cursor-pointer transition-all border-2 ${coverImageIndex === idx ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <img src={`data:${img.mime};base64,${img.data}`} className="w-full h-full object-cover" alt="thumbnail" />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                            className="absolute top-0 right-0 p-1 bg-black/60 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all rounded-bl"
                                        >
                                            <span className="material-symbols-outlined text-[10px]">close</span>
                                        </button>
                                        {coverImageIndex === idx && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 backdrop-blur-[1px]">
                                                <span className="material-symbols-outlined text-white drop-shadow-md text-sm">check_circle</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square bg-slate-800 hover:bg-slate-700 rounded-lg border border-dashed border-slate-600 flex items-center justify-center text-slate-400 transition-all hover:text-white"
                                >
                                    <span className="material-symbols-outlined text-lg">add</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                            </div>
                            <input 
                                value={albumLink} 
                                onChange={e => setAlbumLink(e.target.value)} 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-[10px] focus:border-red-500 outline-none" 
                                placeholder="Google Photos / Album Link" 
                            />
                        </div>

                        {/* Context */}
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                            <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Theme / Context</label>
                            <textarea 
                                value={contextInput} 
                                onChange={e => setContextInput(e.target.value)} 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-red-500 outline-none text-xs h-20 resize-none leading-relaxed" 
                                placeholder="e.g. A cyberpunk christmas with neon lights..." 
                            />
                        </div>

                        {/* Letter */}
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                            <label className="block text-slate-500 text-[10px] uppercase font-bold mb-1">Letter Content</label>
                            <textarea 
                                value={memory.cardMessage || ""} 
                                onChange={e => updateMemory({ cardMessage: e.target.value })} 
                                className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-red-500 outline-none text-xs h-24 resize-none leading-relaxed" 
                                placeholder="Generated message will appear here..." 
                            />
                        </div>
                        
                        {/* Gift */}
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5">
                             <div className="flex items-center gap-2 mb-2">
                                <input 
                                    type="checkbox" 
                                    id="includeGift" 
                                    checked={includeGift} 
                                    onChange={e => setIncludeGift(e.target.checked)}
                                    className="accent-red-500"
                                />
                                <label htmlFor="includeGift" className="text-slate-300 text-xs font-bold cursor-pointer select-none">Include Gift</label>
                             </div>
                             {includeGift && (
                                 <div className="animate-fade-in space-y-2">
                                    <div className="flex gap-1">
                                        <button onClick={() => setGiftType('URL')} className={`flex-1 text-[10px] py-1 rounded ${giftType === 'URL' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>Link</button>
                                        <button onClick={() => setGiftType('CODE')} className={`flex-1 text-[10px] py-1 rounded ${giftType === 'CODE' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-400'}`}>Code</button>
                                    </div>
                                    <div className="relative">
                                        <input 
                                            value={giftValue} 
                                            onChange={e => setGiftValue(e.target.value)} 
                                            type={showGiftCode ? "text" : "password"}
                                            placeholder={giftType === 'URL' ? "https://..." : "ABCD-1234"} 
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-red-500 outline-none pr-8 text-xs" 
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

                    {/* CHAT VIEW - Standard Block Flow, Hidden if not active */}
                    <div className={`flex-1 flex flex-col min-h-0 ${leftTab === 'chat' ? 'flex' : 'hidden'}`}>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar" ref={scrollRef}>
                            {history.length === 0 && !currentTurn.user && (
                                <div className="text-center mt-12 space-y-4 opacity-50">
                                    <span className="material-symbols-outlined text-6xl text-slate-600">mic</span>
                                    <p className="text-slate-400 text-xs px-6">
                                        Tap the mic below to brainstorm ideas with our AI Elf.
                                    </p>
                                </div>
                            )}
                            {history.map((h, i) => (
                                <div key={i} className={`flex flex-col ${h.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm ${h.role === 'user' ? 'bg-slate-700 text-slate-200 rounded-br-sm' : 'bg-green-900/30 border border-green-500/20 text-green-100 rounded-bl-sm'}`}>
                                        {h.text}
                                    </div>
                                    <span className="text-[9px] text-slate-500 mt-1 uppercase font-bold">{h.role}</span>
                                </div>
                            ))}
                            {currentTurn.user && (
                                 <div className="flex flex-col items-end opacity-70">
                                    <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-slate-700 text-slate-200 rounded-br-sm border border-slate-500/50">
                                        {currentTurn.user}
                                    </div>
                                 </div>
                            )}
                            {currentTurn.elf && (
                                 <div className="flex flex-col items-start opacity-70">
                                    <div className="max-w-[85%] rounded-2xl p-3 text-sm bg-green-900/30 text-green-100 rounded-bl-sm border border-green-500/20">
                                        {currentTurn.elf}
                                    </div>
                                 </div>
                            )}
                         </div>

                         <div className="p-4 bg-slate-900/80 border-t border-white/5 flex items-center justify-center gap-4 shrink-0">
                             <button 
                                onClick={toggleConnection}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${connected ? 'bg-red-500 border-red-400 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}
                                title={connected ? "Stop Chat" : "Start Voice Chat"}
                            >
                                <span className="material-symbols-outlined text-2xl text-white">
                                    {connected ? 'mic_off' : 'mic'}
                                </span>
                            </button>
                            
                            <button 
                                onClick={generateAssets}
                                disabled={loading}
                                className={`h-12 px-6 rounded-full font-bold transition-all text-sm flex items-center gap-2 shadow-lg ${
                                    loading 
                                        ? 'bg-slate-700 text-slate-400 cursor-wait' 
                                        : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-amber-900/30'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${loading ? 'animate-spin' : ''}`}>
                                    {loading ? 'refresh' : 'auto_fix_high'}
                                </span>
                                {loading ? 'Creating...' : 'Create Card'}
                            </button>
                         </div>
                    </div>

                    {/* Loading Overlay for Left Panel */}
                    {loading && (
                         <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                             <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                             <h3 className="font-christmas text-2xl text-amber-300 mb-2">{generationStatus}</h3>
                             <p className="text-xs text-slate-400">The elves are working hard!</p>
                         </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Card Preview */}
            <div className="lg:col-span-1 flex flex-col items-center justify-center relative bg-black/20 rounded-2xl border border-white/5">
                 <div className="relative w-full max-w-[400px] aspect-[400/560] shadow-2xl transition-all duration-500">
                    <div className="w-full h-full bg-white rounded-r-lg rounded-l-sm overflow-hidden relative shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-black/20 to-transparent z-20 pointer-events-none"></div>
                        {renderPageContent(activePageType)}
                    </div>
                </div>

                {/* Pagination */}
                <div className="mt-6 flex gap-4 bg-slate-900/60 p-2 rounded-full border border-white/10 backdrop-blur items-center z-10">
                    <button onClick={() => setActivePage(Math.max(0, activePage - 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-2 px-2">
                        {getPagesList().map((_, i) => (
                             <div key={i} onClick={() => setActivePage(i)} className={`w-2 h-2 rounded-full cursor-pointer transition-all ${activePage === i ? 'bg-red-500 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`} />
                        ))}
                    </div>
                    <button onClick={() => setActivePage(Math.min(totalPages - 1, activePage + 1))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
                
                <div className="flex justify-between w-full max-w-[400px] mt-4 items-center px-2">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                        {['Cover Page', 'Letter', 'Photos', 'Gift', 'Back'][activePage] || 'Page'}
                    </p>
                    {memory.generatedCardUrl && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={sharePDF}
                                disabled={generatingPdf}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${generatingPdf ? 'bg-slate-800 text-slate-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}
                                title="Share PDF"
                            >
                                <span className="material-symbols-outlined text-sm">share</span>
                                Share
                            </button>
                            <button 
                                onClick={downloadPDF}
                                disabled={generatingPdf}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${generatingPdf ? 'bg-slate-800 text-slate-500' : 'bg-green-600 hover:bg-green-500 text-white shadow-lg'}`}
                            >
                                <span className="material-symbols-outlined text-sm">{generatingPdf ? 'hourglass_empty' : 'download'}</span>
                                {generatingPdf ? 'PDF...' : 'Download'}
                            </button>
                        </div>
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
});

export default CardWorkshop;
