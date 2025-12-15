import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { base64ToUint8Array, createPcmBlob, decodeAudioData } from './audioUtils';

// Utility helper to get fresh AI instance (crucial for API Key selection flows)
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateHolidayVibeImage = async (context: string, imageBase64?: string, imageMime?: string) => {
  const ai = getAI();
  const model = "gemini-2.5-flash-image";
  
  const parts: any[] = [];
  
  if (imageBase64 && imageMime) {
      parts.push({
          inlineData: {
              data: imageBase64,
              mimeType: imageMime
          }
      });
      parts.push({ text: `Edit this image. Visual style and theme based on this description: ${context}. Keep the main subject intact.` });
  } else {
      parts.push({ text: `A high quality, festive holiday card background. Visual style and theme based on this description: ${context}. No text on the image.` });
  }

  const response = await ai.models.generateContent({
    model,
    contents: { parts },
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateVeoVideo = async (prompt: string, imageBase64?: string, imageMime?: string) => {
    const ai = getAI();
    const model = 'veo-3.1-fast-generate-preview';

    const request: any = {
        model,
        prompt, 
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: '16:9'
        }
    };

    if (imageBase64 && imageMime) {
        request.image = {
            imageBytes: imageBase64,
            mimeType: imageMime
        };
    }

    let operation = await ai.models.generateVideos(request);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed");

    return `${videoUri}&key=${process.env.API_KEY}`;
};

export const generateCardText = async (context: string, recipient: string) => {
  const ai = getAI();
  
  const prompt = `
    Task: Write a short, heartwarming Christmas card message for ${recipient}.
    
    Context/Style Source:
    "${context}"
    
    Instructions:
    - If the source is a conversation, extract the user's intent and preferred tone.
    - Keep it under 60 words.
    - Be creative and match the requested vibe.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
        tools: [{ googleSearch: {} }] // Use search to find trending holiday greetings if needed
    }
  });
  
  // Also return grounding chunks if any
  const grounding = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return { text: response.text, grounding };
};

// Live API Class
export class HolidayLiveAgent {
  private ai: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private audioContext: AudioContext | null = null;
  private inputContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  
  public onTranscriptUpdate: ((input: string, output: string, turnComplete: boolean) => void) | null = null;

  constructor() {
    this.ai = getAI();
  }

  async connect() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputNode = this.audioContext.createGain();
    outputNode.connect(this.audioContext.destination);

    // Get Mic Stream
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    this.sessionPromise = this.ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      callbacks: {
        onopen: () => {
          this.startAudioStream(stream);
        },
        onmessage: async (message: LiveServerMessage) => {
             // Handle Audio
             const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && this.audioContext) {
                 const buffer = await decodeAudioData(
                     base64ToUint8Array(audioData),
                     this.audioContext,
                     24000,
                     1
                 );
                 this.playAudio(buffer, outputNode);
             }

             // Handle Transcription
             if (this.onTranscriptUpdate) {
               const input = message.serverContent?.inputTranscription?.text || "";
               const output = message.serverContent?.outputTranscription?.text || "";
               const turnComplete = message.serverContent?.turnComplete || false;
               
               if (input || output || turnComplete) {
                 this.onTranscriptUpdate(input, output, turnComplete);
               }
             }
        },
        onclose: () => console.log("Live session closed"),
        onerror: (e) => console.error("Live session error", e)
      },
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: "You are a creative Holiday Card consultant. Your goal is to ask the user questions to help design the perfect Christmas card. Ask about the recipient, the vibe (cozy, funny, elegant), and the message. Keep responses short and conversational.",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
        },
        inputAudioTranscription: {}, 
        outputAudioTranscription: {}
      }
    });

    return this.sessionPromise;
  }

  private startAudioStream(stream: MediaStream) {
    if (!this.inputContext) return;
    
    const source = this.inputContext.createMediaStreamSource(stream);
    const processor = this.inputContext.createScriptProcessor(4096, 1, 1);
    
    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createPcmBlob(inputData);
      
      this.sessionPromise?.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(processor);
    processor.connect(this.inputContext.destination);
  }

  private playAudio(buffer: AudioBuffer, destination: AudioNode) {
     if (!this.audioContext) return;
     
     this.nextStartTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
     const source = this.audioContext.createBufferSource();
     source.buffer = buffer;
     source.connect(destination);
     source.start(this.nextStartTime);
     this.nextStartTime += buffer.duration;
     
     source.onended = () => this.sources.delete(source);
     this.sources.add(source);
  }

  async disconnect() {
    this.audioContext?.close();
    this.inputContext?.close();
    this.sources.forEach(s => s.stop());
    this.sessionPromise = null;
  }
}