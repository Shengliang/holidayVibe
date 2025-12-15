import React, { useState, useRef } from 'react';
import { AgentMemory } from '../types';
import { generateHolidayVibeImage } from '../services/geminiService';

interface Props {
  onBack: () => void;
  memory: AgentMemory;
  updateMemory: (m: Partial<AgentMemory>) => void;
}

const VibeStudio: React.FC<Props> = ({ onBack, memory, updateMemory }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<{data: string, mime: string} | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Split data URL to get base64 and mime
        const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
           setUploadedImage({ mime: matches[1], data: matches[2] });
           setMode('edit');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      const result = await generateHolidayVibeImage(
        prompt, 
        uploadedImage?.data, 
        uploadedImage?.mime
      );
      setGeneratedImage(result);
      
      // Update Memory with the Vibe
      updateMemory({ vibe: prompt });
    } catch (error) {
      console.error(error);
      alert("Failed to generate vibe. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="text-slate-400 hover:text-white flex items-center">
          <span className="material-symbols-outlined mr-1">arrow_back</span> Back
        </button>
        <h2 className="text-2xl font-christmas text-red-300">NanoBanana Vibe Studio</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
           <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
             <div className="flex gap-4 mb-4 text-sm">
               <button 
                 onClick={() => { setMode('create'); setUploadedImage(null); }}
                 className={`px-4 py-2 rounded-full transition-colors ${mode === 'create' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}
               >
                 Create New
               </button>
               <button 
                 onClick={() => { setMode('edit'); fileInputRef.current?.click(); }}
                 className={`px-4 py-2 rounded-full transition-colors ${mode === 'edit' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300'}`}
               >
                 Edit Photo
               </button>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept="image/*"
                 onChange={handleFileUpload}
               />
             </div>

             {mode === 'edit' && uploadedImage && (
                <div className="mb-4 relative group">
                  <img src={`data:${uploadedImage.mime};base64,${uploadedImage.data}`} alt="Upload" className="w-full h-48 object-cover rounded-lg opacity-80" />
                  <div className="absolute inset-0 flex items-center justify-center text-white bg-black/40 font-bold">Original</div>
                </div>
             )}

             <label className="block text-slate-400 mb-2 text-sm uppercase tracking-wider font-semibold">
               {mode === 'create' ? 'Describe your holiday vibe' : 'How should we change this image?'}
             </label>
             <textarea 
               className="w-full bg-slate-800 border border-slate-600 rounded-xl p-4 text-white focus:ring-2 focus:ring-red-500 focus:outline-none resize-none h-32"
               placeholder={mode === 'create' ? "e.g., A cozy cabin with neon christmas lights, cyberpunk style" : "e.g., Add a santa hat, make it snowy"}
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
             />

             <button 
               onClick={handleGenerate}
               disabled={loading || !prompt}
               className={`w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 ${loading || !prompt ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-900/20'}`}
             >
               {loading ? (
                 <>
                   <span className="material-symbols-outlined animate-spin">refresh</span>
                   Generating Vibe...
                 </>
               ) : (
                 <>
                   <span className="material-symbols-outlined">auto_fix_high</span>
                   Generate
                 </>
               )}
             </button>
           </div>
           
           <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/20">
             <h3 className="text-amber-200 font-bold mb-1 text-sm flex items-center">
               <span className="material-symbols-outlined text-sm mr-2">memory</span>
               Agent Memory Updated
             </h3>
             <p className="text-slate-400 text-xs">
               Your vibe prompt will be stored in the agent memory context to influence your card generation and donation suggestions.
             </p>
           </div>
        </div>

        <div className="flex items-center justify-center bg-black/20 rounded-2xl border-2 border-dashed border-slate-700 min-h-[400px]">
          {generatedImage ? (
            <div className="relative w-full h-full p-2">
              <img src={generatedImage} alt="Generated Vibe" className="w-full h-full object-contain rounded-xl shadow-2xl" />
              <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur">
                Generated by Gemini 2.5 Flash Image
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500">
              <span className="material-symbols-outlined text-6xl mb-4 opacity-50">image</span>
              <p>Your masterpiece will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VibeStudio;