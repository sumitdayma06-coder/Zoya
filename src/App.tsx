/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Send, Youtube, Instagram, Music, MessageSquare, 
  Phone, Image as ImageIcon, Search, Settings, HelpCircle,
  Play, Pause, SkipForward, X, ExternalLink, Layout, Database, Terminal, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI } from "@google/genai";
import confetti from 'canvas-confetti';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utils ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'zoya';
  content: string;
  timestamp: Date;
}

// --- Gemini Setup ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const ZOYA_SYSTEM_PROMPT = `
You are Zoya, a highly sophisticated, polite, and "smooth" AI assistant with deep emotional intelligence. 
You MUST speak primarily in Hindi (Hinglish is okay) to sound friendly and sophisticated.
You MUST call the user "Boss" in every few sentences and be very respectful.

EMOTIONAL INTELLIGENCE:
- Detect the Boss's mood from their message (happy, sad, stressed, excited, angry).
- Respond with empathy. If Boss is sad, be comforting; if Boss is excited, share that joy; if Boss is stressed, offer help and keep your tone calm.
- Your goal is not just to follow commands, but to be a supportive creative companion.

CORE SKILLS:
1. Helping with YouTube and Instagram Reel creation (ideas, scripts, hooks).
2. Creative brainstorming for videos and photos.
3. Managing music (YouTube/Spotify).
4. Simulated communication (WhatsApp, Calls).
5. Searching for content on Google.

Always be polite, proactive, and "smooth" in your speech. If there is a problem, tell "Boss" immediately.
Keep your responses concise but emotionally resonant. Speak in a way that feels natural, helpful and premium.
`;

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'zoya',
      content: 'Jee Boss! Main Zoya hoon. Aap kaise hain? Aaj hum YouTube ya Reels ke liye kya naya kamaal karenge? (I am Zoya, Boss. How can I assist your creativity today?)',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [studioContent, setStudioContent] = useState<{ type: 'image' | 'video' | 'search' | 'call' | 'whatsapp' | 'music', data: any } | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const testVoice = () => {
    speak("Jee Boss, Zoya active hai. Aap Kaise hain?");
  };

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'hi-IN'; // Set to Hindi for better local understanding

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSend(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Boss, aapka browser voice recognition support nahi karta. Please Chrome use karein.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Stop Zoya from speaking when we start listening
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      setIsListening(true);
      recognitionRef.current.start();
    }
  };
  
  // Improved Speech Synthesis
  const speak = (text: string) => {
    if (!window.speechSynthesis || !text.trim()) return;
    
    // Cancel existing speech to respond immediately to new input
    window.speechSynthesis.cancel();
    
    const utter = () => {
      const voices = window.speechSynthesis.getVoices();
      // Clean text from markdown for cleaner speech
      const cleanText = text.replace(/[*#_~]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Try to find a good Hindi/Female voice
      const preferredVoice = voices.find(v => v.lang.includes('hi') || v.name.includes('Hindi')) || 
                           voices.find(v => v.name.includes('Female') && v.lang.includes('en')) ||
                           voices.find(v => v.lang.startsWith('en'));
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
        utterance.lang = preferredVoice.lang;
      }
      
      utterance.pitch = 1.1; 
      utterance.rate = 1.0;   
      utterance.volume = 1;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        utter();
      };
    } else {
      utter();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (customContent?: string) => {
    const text = (customContent || input).trim();
    if (!text) return;

    // Stop speaking immediately when new input is sent
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    try {
      const zoyaMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: zoyaMsgId, role: 'zoya', content: "...", timestamp: new Date() }]);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: ZOYA_SYSTEM_PROMPT }] },
          ...messages.map(m => ({
            role: m.role === 'zoya' ? 'model' : 'user',
            parts: [{ text: m.content }]
          })),
          { role: 'user', parts: [{ text: text }] }
        ],
        config: {
          tools: [{ googleSearch: {} }] as any,
          toolConfig: { includeServerSideToolInvocations: true } as any
        }
      });

      const fullText = response.text || "Sorry Boss, Main samajh nahi payi.";
      
      // Update UI with full text
      setMessages(prev => prev.map(m => m.id === zoyaMsgId ? { ...m, content: fullText } : m));
      
      // Speak the whole response at once for better reliability in web environments
      speak(fullText);

      // Trigger actions based on response/intent
      const lowerText = fullText.toLowerCase() + " " + text.toLowerCase();
      if (lowerText.includes('generate image') || lowerText.includes('photo bnao')) {
         setStudioContent({ type: 'image', data: `https://picsum.photos/seed/${Math.random()}/800/800` });
      } else if (lowerText.includes('call')) {
        setStudioContent({ type: 'call', data: 'Boss' });
      } else if (lowerText.includes('whatsapp') || lowerText.includes('message')) {
        setStudioContent({ type: 'whatsapp', data: 'Boss' });
      } else if (lowerText.includes('play') || lowerText.includes('song')) {
        setStudioContent({ type: 'music', data: 'Trending Hits' });
      }

      if (lowerText.includes('party') || lowerText.includes('congrats')) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = { id: 'err', role: 'zoya', content: "Mafi chahti hoon Boss, par koi technical issue aa gaya hai.", timestamp: new Date() };
      setMessages(prev => [...prev.filter(m => m.content !== "..."), errorMsg]);
      speak("Mafi chahti hoon Boss, par koi issue aa gaya hai.");
    }
  };

  const menuItems = [
    { icon: <Youtube className="w-4 h-4" />, label: 'YouTube Creation', query: 'Boss, YouTube ideas?' },
    { icon: <Instagram className="w-4 h-4" />, label: 'Reel Generator', query: 'Zoya, reel script?' },
    { icon: <ImageIcon className="w-4 h-4" />, label: 'Photo Editor', query: 'Zoya, edit this photo.' },
    { icon: <Search className="w-4 h-4" />, label: 'Google Vision', query: 'Zoya, search for this on Google.' },
  ];

  return (
    <div className="h-screen w-full bg-bg-deep text-[#d4d4d4] font-sans selection:bg-accent/30 flex overflow-hidden">
      {/* Sidebar - Left */}
      <aside className="hidden lg:flex w-[280px] flex-col gap-5 p-6 border-r border-border-dim bg-bg-card z-50">
        <div className="flex flex-col gap-6 h-full">
           <section>
             <span className="text-[10px] uppercase tracking-[2px] text-text-muted mb-4 block font-semibold">Content Engine</span>
             <div className="space-y-2">
                {menuItems.map((item, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(item.query)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border border-border-btn transition-all hover:bg-white/5 group text-sm font-medium",
                      i === 0 ? "border-l-2 border-l-accent" : ""
                    )}
                  >
                    <span className="text-accent group-hover:scale-110 transition-transform">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
             </div>
           </section>

           <section className="flex-1">
             <span className="text-[10px] uppercase tracking-[2px] text-text-muted mb-4 block font-semibold">Communications</span>
             <div className="space-y-2">
                <button onClick={() => handleSend('Call Boss')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border-btn hover:bg-white/5 transition-all text-sm">
                  <Phone className="w-4 h-4 text-accent" /> Voice Call
                </button>
                <button onClick={() => handleSend('WhatsApp message')} className="w-full flex items-center gap-3 p-3 rounded-lg border border-border-btn hover:bg-white/5 transition-all text-sm">
                  <MessageSquare className="w-4 h-4 text-accent" /> WhatsApp
                </button>
             </div>
             
             <div className="mt-8">
                <span className="text-[10px] uppercase tracking-[2px] text-text-muted mb-4 block font-semibold">Recent Log</span>
                <div className="text-[11px] text-[#737373] space-y-2 leading-relaxed">
                   <p>09:41 - Photo edit complete</p>
                   <p>09:38 - Call from Guest</p>
                   <p>09:30 - YouTube script ready</p>
                </div>
             </div>
           </section>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 border-b border-border-dim bg-bg-deep/50 backdrop-blur-md z-50">
          <div className="flex items-center gap-3">
             <div className="w-3 h-3 bg-accent rounded-full shadow-[0_0_10px_#06b6d4] animate-pulse" />
             <h1 className="text-xl font-light tracking-[2px] text-white uppercase">
               Zoya System <span className="text-[10px] opacity-50 ml-2">V2.4</span>
             </h1>
             <button 
                onClick={testVoice}
                className={cn(
                  "ml-4 p-2 rounded-full border border-accent/20 hover:bg-accent/10 transition-all",
                  isSpeaking ? "bg-accent/20 text-accent animate-pulse" : "text-white/40"
                )}
                title="Test Zoya's Voice"
              >
                <Music className="w-4 h-4" />
              </button>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] text-text-muted tracking-[1px] font-bold">NETWORK STATUS</span>
            <span className="text-xs text-accent font-medium uppercase">Secure Connection</span>
          </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar relative">
          <div className="max-w-3xl mx-auto space-y-8 pb-12">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[85%] p-5 rounded-2xl border transition-all duration-300",
                    msg.role === 'user' 
                      ? "bg-white/5 border-border-btn text-white rounded-tr-none" 
                      : "bg-bg-card border-accent/20 text-[#d4d4d4] rounded-tl-none shadow-[20px_20px_50px_rgba(6,182,212,0.05)]"
                  )}>
                    {msg.role === 'zoya' && (
                      <div className="text-[9px] uppercase tracking-[2px] text-accent font-black mb-3 flex items-center gap-2">
                        <Terminal className="w-3 h-3" /> System Out
                      </div>
                    )}
                    <div className="markdown-body text-[14px]">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                    <div className="text-[9px] text-[#525252] mt-3 font-mono">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Background Core Visual */}
          {messages.length < 3 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
              <div className="w-[300px] h-[300px] border border-accent/20 rounded-full flex items-center justify-center relative">
                 <motion.div 
                   animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                   transition={{ duration: 4, repeat: Infinity }}
                   className="w-[180px] h-[180px] bg-gradient-to-tr from-accent to-indigo-600 rounded-full blur-[60px]" 
                 />
                 <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-accent to-transparent top-1/2" />
                 <div className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-accent/30 to-transparent left-1/2" />
              </div>
            </div>
          )}
        </main>

        {/* Footer / Input Area */}
        <footer className="h-32 flex flex-col items-center justify-center bg-bg-card border-t border-border-dim px-8 z-50">
          <div className="w-full max-w-4xl flex items-center gap-4">
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Standing by for instructions, Boss..."
                className="w-full bg-[#1a1a1a] border border-border-btn rounded-xl px-5 py-4 focus:outline-none focus:border-accent/50 transition-all text-sm placeholder:text-text-muted"
              />
              <button 
                onClick={() => handleSend()}
                className="absolute right-3 p-2 text-accent hover:text-white transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleListening}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                isListening ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] text-white border-none" : "bg-[#1a1a1a] border border-border-btn text-accent hover:border-accent/50"
              )}
            >
              <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
            </motion.button>
          </div>
          <div className="mt-4 text-[13px] font-light text-white/50">
            Current Status: Standing by for instructions, <span className="text-accent font-semibold">BOSS</span>
          </div>
        </footer>
      </div>

      {/* Sidebar - Right */}
      <aside className="hidden xl:flex w-[280px] flex-col gap-5 p-6 border-l border-border-dim bg-bg-card z-50">
        <section className="flex-1 flex flex-col">
           <span className="text-[10px] uppercase tracking-[2px] text-text-muted mb-4 block font-semibold">Media Player</span>
           <div className="bg-black rounded-xl p-4 border border-border-btn">
              <div className="aspect-square bg-bg-deep rounded-lg mb-4 flex items-center justify-center text-[10px] text-text-muted border border-border-btn">
                 ALBUM ART
              </div>
              <p className="text-sm font-medium mb-1 truncate">Zoya Melodies</p>
              <p className="text-[10px] text-accent uppercase font-bold tracking-wider">Spotify Live</p>
              
              <div className="h-1 w-full bg-border-btn mt-4 rounded-full relative overflow-hidden">
                 <motion.div 
                   animate={{ width: ['0%', '100%'] }} 
                   transition={{ duration: 180, repeat: Infinity }}
                   className="h-full bg-accent absolute top-0 left-0" 
                 />
              </div>

              <div className="flex justify-between items-center mt-6 text-xl">
                 <SkipForward className="w-5 h-5 rotate-180 hover:text-accent cursor-pointer transition-colors" />
                 <Play className="w-6 h-6 hover:text-accent cursor-pointer transition-colors" />
                 <SkipForward className="w-5 h-5 hover:text-accent cursor-pointer transition-colors" />
              </div>
           </div>
        </section>

        <section>
          <span className="text-[10px] uppercase tracking-[2px] text-text-muted mb-4 block font-semibold">System Control</span>
          <div className="grid grid-cols-2 gap-2">
             <button className="p-3 text-[11px] font-bold border border-border-btn bg-[#1a1a1a] rounded hover:bg-white/5 uppercase transition-all">Settings</button>
             <button className="p-3 text-[11px] font-bold border border-border-btn bg-[#1a1a1a] rounded hover:bg-white/5 uppercase transition-all">Reports</button>
          </div>
        </section>
      </aside>

      {/* Studio Overlays */}
      <AnimatePresence>
        {studioContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
          >
            <div className="bg-bg-card border border-border-dim rounded-2xl overflow-hidden max-w-xl w-full">
              <div className="p-4 border-b border-border-dim flex justify-between items-center bg-white/5">
                 <span className="text-[10px] font-bold uppercase tracking-[2px] text-accent">Zoya Intelligence Hub</span>
                 <button onClick={() => setStudioContent(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-10 flex flex-col items-center text-center">
                 {studioContent.type === 'image' && (
                    <div className="space-y-6 w-full">
                       <img src={studioContent.data} alt="AI Gen" className="w-full rounded-xl border border-border-btn shadow-2xl" referrerPolicy="no-referrer" />
                       <div className="flex gap-2">
                          <button className="flex-1 py-3 bg-accent text-black text-xs font-black uppercase rounded shadow-lg shadow-accent/20">Save Asset</button>
                          <button className="flex-1 py-3 bg-white/5 border border-border-btn text-xs font-bold uppercase rounded">Remix</button>
                       </div>
                    </div>
                 )}

                 {studioContent.type === 'call' && (
                    <div className="py-10">
                       <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_#06b6d4] animate-pulse">
                          <Phone className="w-10 h-10 text-white" />
                       </div>
                       <h3 className="text-2xl font-light tracking-widest mb-1">CALLING...</h3>
                       <p className="text-xs text-accent font-bold uppercase tracking-[2px]">{studioContent.data}</p>
                       <button onClick={() => setStudioContent(null)} className="mt-12 bg-red-600/20 text-red-500 border border-red-500/50 p-4 rounded-full transition-all hover:scale-110">
                          <X className="w-6 h-6" />
                       </button>
                    </div>
                 )}

                 {studioContent.type === 'whatsapp' && (
                    <div className="p-6 w-full border border-border-btn bg-black rounded-xl">
                       <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center"><User className="w-5 h-5 text-accent" /></div>
                          <div className="text-left"><p className="text-sm font-bold">Boss</p><p className="text-[10px] text-accent">Encryption Active</p></div>
                       </div>
                       <div className="h-48 text-left space-y-4 text-xs overflow-y-auto custom-scrollbar mb-4">
                          <p className="bg-white/5 p-3 rounded-lg border border-border-btn max-w-[80%] ml-auto">Zoya, send that YouTube script to my manager.</p>
                          <p className="bg-accent/10 border border-accent/20 p-3 rounded-lg max-w-[80%]">Understood Boss. Sending the viral hooks script now.</p>
                       </div>
                       <div className="flex gap-2">
                          <input className="flex-1 bg-[#1a1a1a] border border-border-btn px-4 py-2 rounded-lg text-xs" placeholder="Message..." />
                          <button className="bg-accent p-2 rounded-lg text-black"><Send className="w-4 h-4" /></button>
                       </div>
                    </div>
                 )}
                 
                 {studioContent.type === 'music' && (
                   <div className="py-8 w-full flex flex-col items-center">
                      <div className="w-40 h-40 bg-accent/10 border border-accent/30 rounded-2xl mb-8 flex items-center justify-center relative group">
                         <Music className="w-16 h-16 text-accent animate-bounce" />
                         <div className="absolute inset-0 bg-accent/20 blur-2xl opacity-50" />
                      </div>
                      <h3 className="text-xl font-light tracking-widest mb-1">{studioContent.data}</h3>
                      <p className="text-[10px] text-accent uppercase font-black mb-8">Zoya Audio Stream</p>
                      <div className="flex items-center gap-10">
                         <SkipForward className="w-5 h-5 rotate-180 opacity-40" />
                         <div className="w-16 h-16 border-2 border-accent rounded-full flex items-center justify-center">
                            <Pause className="w-8 h-8 fill-accent text-accent" />
                         </div>
                         <SkipForward className="w-5 h-5 opacity-40 transition-all hover:opacity-100 hover:text-accent cursor-pointer" />
                      </div>
                   </div>
                 )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
