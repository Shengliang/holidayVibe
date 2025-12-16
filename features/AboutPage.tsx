
import React from 'react';

const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto animate-fade-in">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Workshop
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1">
              <h1 className="text-4xl font-christmas text-red-300 mb-4">Holiday Vibe Pipeline</h1>
              <p className="text-xl text-slate-300 mb-6 font-light">
                  An open-source experiment exploring the creative potential of Google's Gemini 2.5 Multimodal API.
              </p>
              
              <div className="space-y-6 text-slate-300 leading-relaxed">
                <p>
                  This application demonstrates how to build a modern, interactive AI web app using React and the Google GenAI SDK. It features a real-time voice assistant ("Elf Chat") and generative pipelines for text and images.
                </p>

                <h2 className="text-2xl font-bold text-white mt-8 mb-4">Under the Hood</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-5 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-green-300 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined">graphic_eq</span>
                      Gemini Live API
                    </h3>
                    <p className="text-sm text-slate-400">
                      Powers the conversational Elf. It uses WebSockets to stream raw PCM audio bi-directionally, allowing for low-latency, interruptible voice interactions without a backend server.
                    </p>
                  </div>
                  <div className="bg-slate-900/60 p-5 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-amber-300 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined">auto_awesome</span>
                      Gemini 2.5 Flash
                    </h3>
                    <p className="text-sm text-slate-400">
                      Handles the heavy lifting: generating the heartwarming letter content, editing cover art images based on prompts, and designing custom background textures.
                    </p>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-br from-slate-900 to-black rounded-xl border border-slate-700 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-yellow-500">lightbulb</span>
                      Learning Example
                  </h2>
                  <p className="mb-6">
                    We built this to be cloned! If you are a developer looking to integrate Generative AI into your web apps, this project serves as a practical reference for:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-400 mb-6 space-y-1">
                      <li>Handling AudioContext for real-time AI voice streaming.</li>
                      <li>Managing multimodal agent memory/context in React.</li>
                      <li>Using Function Calling to trigger app actions from AI.</li>
                      <li>Generating PDFs from dynamic React components.</li>
                  </ul>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a 
                      href="https://github.com/Shengliang/holidayVibe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-lg font-bold transition-all"
                    >
                      <span className="material-symbols-outlined">code</span>
                      Clone on GitHub
                    </a>
                     <a 
                      href="https://ai.google.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-white transition-all"
                    >
                      <span className="material-symbols-outlined">key</span>
                      Get API Key
                    </a>
                  </div>
                </div>
              </div>
          </div>
          
          <div className="hidden md:block w-72 shrink-0">
               <div className="bg-white p-4 rounded-lg shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
                   <div className="aspect-[4/5] bg-slate-100 rounded border-2 border-slate-200 flex items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
                        <img src="https://storage.googleapis.com/generativeai-downloads/images/gemini-2-5-flash-cover.jpg" className="w-full h-full object-cover" alt="Gemini" onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x400?text=Gemini+2.5'} />
                        <div className="absolute bottom-4 left-4 z-20 text-white">
                            <p className="font-christmas text-2xl">Happy Coding</p>
                            <p className="text-xs uppercase tracking-widest opacity-80">2025 Edition</p>
                        </div>
                   </div>
                   <div className="mt-4 text-center">
                        <p className="font-christmas text-2xl text-red-600">Built with Love</p>
                        <p className="text-xs text-slate-500">and a lot of coffee</p>
                   </div>
               </div>
          </div>
      </div>
    </div>
  );
};

export default AboutPage;
