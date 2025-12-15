import React, { useState, useRef, useEffect } from 'react';
import { generateVeoVideo } from '../services/geminiService';

const VeoMemories: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [image, setImage] = useState<{data: string, mime: string} | null>(null);
  const [prompt, setPrompt] = useState("A cinematic holiday movie scene with slow motion snow");
  const [generating, setGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
        const hasKey = await aistudio.hasSelectedApiKey();
        setApiKeyReady(hasKey);
    }
  };

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio) {
        await aistudio.openSelectKey();
        setApiKeyReady(true); // Optimistic update per instructions
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const reader = new FileReader();
       reader.onloadend = () => {
           const res = reader.result as string;
           const matches = res.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
           if (matches) setImage({ mime: matches[1], data: matches[2] });
       };
       reader.readAsDataURL(file);
    }
  };

  const generate = async () => {
     if (!image) return;
     setGenerating(true);
     setVideoUrl(null);
     try {
         // Re-check key just in case or force refresh logic if needed (handled by service getting fresh instance)
         const url = await generateVeoVideo(prompt, image.data, image.mime);
         setVideoUrl(url);
     } catch (e: any) {
         console.error(e);
         if (e.message?.includes("Requested entity was not found")) {
             setApiKeyReady(false); // Reset to force re-selection
             alert("Please select a paid API Key project to use Veo.");
         } else {
             alert("Video generation failed. Veo can be busy, try again!");
         }
     } finally {
         setGenerating(false);
     }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center">
          <span className="material-symbols-outlined mr-1">arrow_back</span> Back
        </button>
        <h2 className="text-2xl font-christmas text-purple-300">Veo Video Memories</h2>
      </div>

      {!apiKeyReady ? (
          <div className="flex flex-col items-center justify-center h-64 bg-slate-900/50 rounded-xl border border-white/5">
              <span className="material-symbols-outlined text-4xl text-yellow-500 mb-4">key</span>
              <p className="text-slate-300 mb-4">Veo requires a paid project API Key.</p>
              <button onClick={handleSelectKey} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full">
                  Select API Key
              </button>
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-500 mt-4 hover:underline">
                  Billing Documentation
              </a>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                  <div 
                    onClick={() => fileRef.current?.click()}
                    className={`h-48 rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-800/50 transition-colors ${image ? 'border-purple-500 bg-purple-900/10' : ''}`}
                  >
                      {image ? (
                          <img src={`data:${image.mime};base64,${image.data}`} className="h-full w-full object-contain rounded-lg p-2" alt="Source" />
                      ) : (
                          <>
                            <span className="material-symbols-outlined text-3xl text-slate-500">add_photo_alternate</span>
                            <span className="text-slate-500 text-sm mt-2">Upload Source Photo</span>
                          </>
                      )}
                      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={handleUpload} />
                  </div>

                  <div>
                      <label className="text-xs text-slate-400 uppercase tracking-wider font-bold">Magic Prompt</label>
                      <input 
                        type="text" 
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full mt-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 focus:ring-1 focus:ring-purple-500 outline-none" 
                      />
                  </div>

                  <button 
                    onClick={generate}
                    disabled={generating || !image}
                    className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 ${generating || !image ? 'bg-slate-700 text-slate-500' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-900/30'}`}
                  >
                     {generating ? 'Dreaming up Video...' : 'Generate with Veo'}
                  </button>
                  {generating && <p className="text-xs text-center text-purple-300 animate-pulse">This usually takes about a minute...</p>}
              </div>

              <div className="bg-black rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] border border-slate-700">
                  {videoUrl ? (
                      <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
                  ) : (
                      <div className="text-slate-600 flex flex-col items-center">
                          <span className="material-symbols-outlined text-4xl mb-2">movie</span>
                          <span className="text-sm">Video output area</span>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default VeoMemories;