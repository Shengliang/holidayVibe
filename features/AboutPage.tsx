
import React, { useState } from 'react';

const AboutPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [copied, setCopied] = useState(false);

  const generateSystemPrompt = () => {
    return `
You are an expert frontend engineer tasked with building a "Holiday Vibe Pipeline" web application using React, Tailwind CSS, and the Google GenAI SDK (v0.21.0+).

**Core Concept:**
A festive, interactive workshop where users create personalized holiday cards using AI. It features a real-time voice assistant ("Elf"), text generation for messages, image generation for cover art, and a PDF export feature.

**Tech Stack:**
- React 18+ (Functional Components, Hooks)
- Tailwind CSS (Styling)
- @google/genai (Gemini 2.5 Flash, Gemini 2.5 Flash Image, Live API)
- jsPDF & html2canvas (PDF Generation)
- Lucide React or Material Symbols (Icons)

**Key Components & Architecture:**

1.  **App.tsx (Entry Point):**
    -   Manages global state (View switching: 'workshop' | 'about').
    -   Initializes default 'AgentMemory' (recipient, sender, date, message, images).
    -   Renders a background snowfall effect.
    -   Displays a header with "Create Card" button.

2.  **types.ts (Data Models):**
    -   \`AgentMemory\`: Stores user inputs (recipientName, senderName, cardMessage, giftUrl, etc.) and generated assets (generatedCardUrl, generatedBackgroundUrl).

3.  **services/geminiService.ts (AI Layer):**
    -   \`generateHolidayVibeImage\`: Uses 'gemini-2.5-flash-image' to create cover art based on context.
    -   \`generateHolidayBackground\`: Uses 'gemini-2.5-flash-image' to create subtle stationery patterns.
    -   \`generateCardText\`: Uses 'gemini-2.5-flash' to write heartwarming messages.
    -   \`HolidayLiveAgent\`: A class managing the 'gemini-2.5-flash-native-audio-preview-09-2025' Live API connection.
        -   Handles WebSockets, AudioContext for PCM streaming (input/output).
        -   Defines a tool \`generate_card\` that the model calls when the user is done brainstorming.

4.  **features/CardWorkshop.tsx (Main UI):**
    -   **Layout:** Split screen. Left side = Controls/Chat. Right side = Live Card Preview.
    -   **Left Panel (Tabs):**
        -   *Settings:* Inputs for Recipient, Sender, Date, Context Theme, Image Uploads, and **Gift Inclusion** (URL or Code).
        -   *Live Chat:* A chat interface showing the transcription history with the AI Elf. Includes a big Microphone toggle button.
    -   **Right Panel (Preview):**
        -   Visualizes the card pages (Cover, Letter, Photo Collage, Gift/QR Code, Back).
        -   Uses \`html2canvas\` and \`jspdf\` to download the card as a PDF.
    -   **State Management:** Syncs local form state with \`AgentMemory\`.

**Privacy & Security Considerations:**
-   **Client-Side Only:** No backend database. All gift codes/links are stored in React state and wiped on refresh.
-   **API Key:** Uses \`process.env.API_KEY\` safely injected by the environment.

**Visual Style:**
-   Dark mode default (Slate 900).
-   Festive accents (Red-500, Amber-400, Green-500).
-   "Mountains of Christmas" font for headers.

**Deliverable:**
Generate the complete code for this application, ensuring all imports and types align with the provided architecture.
    `.trim();
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generateSystemPrompt());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto animate-fade-in mb-10">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
        <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
        Back to Workshop
      </button>

      <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-8">
              <div>
                <h1 className="text-4xl font-christmas text-red-300 mb-4">Holiday Vibe Pipeline</h1>
                <p className="text-xl text-slate-300 mb-6 font-light">
                    An open-source experiment exploring the creative potential of Google's Gemini 2.5 Multimodal API.
                </p>
                <div className="text-slate-300 leading-relaxed space-y-4">
                    <p>
                    This application demonstrates how to build a modern, interactive AI web app using React and the Google GenAI SDK. It features a real-time voice assistant ("Elf Chat") and generative pipelines for text and images.
                    </p>
                </div>
              </div>

              {/* Privacy Section */}
              <div className="bg-slate-900/40 p-6 rounded-xl border-l-4 border-amber-500">
                  <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-500">security</span>
                      Privacy & Gift Security
                  </h2>
                  <p className="text-sm text-slate-300 mb-2">
                      We understand that gift links and redeem codes are sensitive. Here is how this app handles your data:
                  </p>
                  <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                      <li><strong>Client-Side Only:</strong> No backend database. All gift codes, messages, and photos are stored in your browser's memory and wiped when you refresh.</li>
                      <li><strong>No Caching:</strong> We do not cache your gift links or codes. They are passed directly to the QR generator (client-side or public API) and then discarded when you close the tab.</li>
                      <li><strong>QR Generation:</strong> Gift links are converted to QR codes using a standard public API. If you are uncomfortable with this, simply skip the gift section or use a placeholder link until you download the PDF.</li>
                  </ul>
              </div>

              {/* Technical Details */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Under the Hood</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 p-5 rounded-xl border border-white/5">
                    <h3 className="text-lg font-bold text-green-300 mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined">graphic_eq</span>
                      Gemini Live API
                    </h3>
                    <p className="text-sm text-slate-400">
                      Powers the conversational Elf. It uses WebSockets to stream raw PCM audio bi-directionally, allowing for low-latency, interruptible voice interactions.
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
              </div>

              {/* Recreate Section */}
              <div className="p-6 bg-gradient-to-br from-slate-900 to-black rounded-xl border border-slate-700 shadow-xl">
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-blue-400">terminal</span>
                      Build It Yourself
                  </h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Want to recreate this exact application? We've generated a comprehensive system prompt that describes the entire codebase structure, logic, and Gemini integration. Copy it and paste it into Google AI Studio or your favorite coding assistant.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button 
                      onClick={handleCopyPrompt}
                      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
                    >
                      <span className="material-symbols-outlined">{copied ? 'check' : 'content_copy'}</span>
                      {copied ? 'Prompt Copied!' : 'Copy System Prompt'}
                    </button>
                    <a 
                      href="https://github.com/Shengliang/holidayVibe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-200 rounded-lg font-bold transition-all"
                    >
                      <span className="material-symbols-outlined">code</span>
                      Source Code
                    </a>
                  </div>
              </div>
          </div>
          
          <div className="hidden md:block w-72 shrink-0">
               <div className="bg-white p-4 rounded-lg shadow-xl transform rotate-3 hover:rotate-0 transition-transform duration-500 sticky top-4">
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
