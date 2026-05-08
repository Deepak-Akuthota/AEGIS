import React, { useState, useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { AnimatePresence, motion } from 'framer-motion';
import { io } from 'socket.io-client';
import Toggle from '../components/Toggle';
import MessageCard from '../components/MessageCard';
import ClusterCard from '../components/ClusterCard';
import SummaryCard from '../components/SummaryCard';
import { ShieldCheck, ShieldAlert, MessageSquare, X, User, Bot, Coffee, Sun, Moon, ThumbsUp, ThumbsDown, MessageCircle, ArrowRight, CheckCircle, Play, Square, RefreshCcw } from 'lucide-react';

const socket = io('http://localhost:3000');

export default function Dashboard({ onOpenProfile }) {
  const [isActive, setIsActive] = useState(false);
  const [viewState, setViewState] = useState('idle'); // 'idle' | 'zen' | 'digest'
  const [messages, setMessages] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, alerts: 0, blocked: 0, auto: 0, focusTimeSaved: 0 });
  const [summaryModalData, setSummaryModalData] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState(null); // { text: string, index: number }
  const [isSummarizing, setIsSummarizing] = useState(false);
  const lastProcessedId = useRef(null);

  useEffect(() => {
    fetch('http://localhost:3000/api/metrics')
      .then(res => res.json())
      .then(setMetrics)
      .catch(console.error);

    socket.on('new_interception', (data) => {
      // In Zen mode, we don't show cards, but we update metrics
      // We still map it just in case we need it for the digest
      const mappedMsg = {
        id: data.id,
        platform: data.platform.toLowerCase(),
        sender: data.sender,
        message: data.message,
        action: data.decision.verdict === 'escalate' ? 'alert' : (data.decision.auto_reply ? 'auto_reply' : 'blocked'),
        reason: data.decision.reason || "Filtered by AI gatekeeper.",
        timestamp: data.timestamp || new Date().toISOString()
      };
      setMessages(prev => [mappedMsg, ...prev]);
    });

    socket.on('metrics_update', (data) => {
      setMetrics(data);
    });

    return () => {
      socket.off('new_interception');
      socket.off('metrics_update');
    };
  }, []);

  const handleStartDeepWork = async () => {
    setIsActive(true);
    setViewState('zen');
    setMessages([]);
    setSummaryModalData(null);
    try {
      await fetch('http://localhost:3000/api/settings/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true })
      });
    } catch (e) { console.error(e); }
  };

  const handleEndDeepWork = async () => {
    setViewState('digest');
    setIsSummarizing(false); // No longer doing long summary
    try {
      await fetch('http://localhost:3000/api/settings/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false })
      });
      setIsActive(false);
    } catch (e) { console.error(e); }
  };

  const handleFeedback = async (messageObj, isPositive) => {
    if (!isPositive) {
      setFeedbackMessage({ text: messageObj.message, original: messageObj.message });
    } else {
      alert('Aegis confirmed. Logic reinforced!');
    }
  };

  const submitCorrectiveFeedback = async (correction) => {
    try {
      await fetch('http://localhost:3000/api/webhook/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: feedbackMessage.text,
          correction: correction
        })
      });
      setFeedbackMessage(null);
      alert('Aegis has been updated with your correction.');
    } catch (e) { console.error(e); }
  };

  return (
    <div className={cn(
      "min-h-screen bg-background relative overflow-hidden transition-colors duration-1000",
      viewState === 'zen' ? "bg-[#020202]" : "bg-background"
    )}>
      
      {/* Background Glows */}
      <AnimatePresence>
        {viewState !== 'zen' && (
          <>
            <motion.div initial={{opacity:0}} animate={{opacity:0.1}} exit={{opacity:0}} className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue rounded-full blur-[120px] pointer-events-none" />
            <motion.div initial={{opacity:0}} animate={{opacity:0.1}} exit={{opacity:0}} className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple rounded-full blur-[120px] pointer-events-none" />
          </>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-8 py-12 relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center border border-white/5">
              <ShieldCheck className={cn("w-7 h-7 transition-colors", viewState === 'zen' ? "text-accent-blue" : "text-white")} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Aegis</h1>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">{viewState} mode</p>
              </div>
            </div>
          </div>
          
          <button onClick={onOpenProfile} className="glass p-3.5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/10">
            <User className="w-5 h-5 text-white/70" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 flex-grow overflow-hidden pb-8">
          
          {/* Main Action Area (Left/Center) */}
          <div className="lg:col-span-8 flex flex-col items-center justify-center relative bg-white/[0.02] rounded-[40px] border border-white/[0.05] overflow-hidden min-h-[500px]">
            
            {/* STATE 1: IDLE */}
            {viewState === 'idle' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center space-y-12 px-12 flex flex-col items-center justify-center"
              >
                <div className="space-y-6">
                  <h2 className="text-6xl font-black text-white tracking-tighter italic leading-none">
                    READY TO <span className="text-accent-blue">FOCUS?</span>
                  </h2>
                  <p className="text-lg text-white/40 max-w-lg mx-auto leading-relaxed">
                    Activate Zen Mode to shield your cognitive flow. All non-critical notifications will be handled by Aegis AI.
                  </p>
                </div>
                
                <button 
                  onClick={handleStartDeepWork}
                  className="group relative px-16 py-8 bg-accent-blue rounded-[32px] text-white font-black text-xl tracking-widest flex items-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(88,166,255,0.3)] hover:shadow-[0_25px_60px_rgba(88,166,255,0.4)]"
                >
                  <Play className="w-6 h-6 fill-current" />
                  ENABLE DEEP WORK
                  <div className="absolute -inset-1 bg-accent-blue blur-2xl opacity-20 group-hover:opacity-40 transition-opacity rounded-full -z-10" />
                </button>
              </motion.div>
            )}

            {/* STATE 2: ZEN */}
            {viewState === 'zen' && (
              <div className="relative flex flex-col items-center w-full h-full justify-center">
                {/* Ripple Animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 4, repeat: Infinity, delay: i * 1.3, ease: "easeOut" }}
                      className="absolute w-64 h-64 border border-accent-blue/20 rounded-full"
                    />
                  ))}
                </div>

                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="w-full text-center space-y-16 relative z-10 flex flex-col items-center justify-center"
                >
                  <div className="space-y-6">
                    <div className="w-28 h-28 rounded-full glass flex items-center justify-center mx-auto mb-10 border border-accent-blue/20 shadow-[0_0_40px_rgba(88,166,255,0.15)]">
                      <Moon className="w-12 h-12 text-accent-blue animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-[0.3em] uppercase italic">Zen Mode</h2>
                    <p className="text-white/30 font-medium italic text-lg">Your flow is protected. Silence is golden.</p>
                  </div>

                  <button 
                    onClick={handleEndDeepWork}
                    className="px-10 py-5 glass hover:bg-white/10 rounded-2xl text-white/50 font-bold flex items-center gap-4 transition-all border border-white/5 hover:border-accent-red/30 hover:text-accent-red group"
                  >
                    <Square className="w-5 h-5 fill-current group-hover:animate-pulse" />
                    END SESSION
                  </button>
                </motion.div>
              </div>
            )}

            {/* STATE 3: DIGEST */}
            {viewState === 'digest' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }}
                className="w-full h-full flex flex-col p-12 space-y-10"
              >
                <div className="flex justify-between items-end">
                  <div className="space-y-3">
                    <h2 className="text-5xl font-black text-white italic tracking-tighter">WELCOME BACK.</h2>
                    <p className="text-white/40 font-bold uppercase tracking-[0.3em] text-[10px]">Aegis intercepted {messages.length} messages for you</p>
                  </div>
                  <button onClick={() => setViewState('idle')} className="glass p-4 rounded-2xl hover:bg-white/10 transition-all border border-white/5">
                    <RefreshCcw className="w-5 h-5 text-white/50" />
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-white/20" />
                      </div>
                      <p className="text-white/30 font-medium italic">No messages were intercepted during this session.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={msg.id} 
                        className="glass p-6 rounded-[24px] border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all hover:bg-white/[0.03]"
                      >
                        <div className="flex gap-5 items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                            msg.action === 'alert' ? "bg-accent-red/10 border-accent-red/20 text-accent-red" : "bg-white/5 border-white/5 text-white/40"
                          )}>
                            {msg.action === 'alert' ? <ShieldAlert className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-black text-white/90">{msg.sender}</span>
                              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{msg.platform}</span>
                            </div>
                            <p className="text-sm text-white/60 line-clamp-2 leading-relaxed">{msg.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-6">
                          <button onClick={() => handleFeedback(msg, true)} className="p-3 hover:bg-white/10 rounded-xl text-white/20 hover:text-green-400 transition-all border border-transparent hover:border-green-400/20">
                            <ThumbsUp className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleFeedback(msg, false)} className="p-3 hover:bg-white/10 rounded-xl text-white/20 hover:text-accent-red transition-all border border-transparent hover:border-accent-red/20">
                            <ThumbsDown className="w-5 h-5" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
                
                <button 
                  onClick={() => setViewState('idle')}
                  className="w-full py-6 bg-white/[0.03] hover:bg-white/[0.08] text-white/40 hover:text-white rounded-[24px] font-black transition-all border border-white/5 flex items-center justify-center gap-3 tracking-[0.2em] uppercase text-xs"
                >
                  Return to Dashboard <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            )}

          </div>

          {/* Sidebar Stats (Right) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <SummaryCard metrics={metrics} sessionSummary={summaryModalData} isDeepWork={isActive} />
          </div>
        </div>
      </main>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setFeedbackMessage(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-xl glass p-10 rounded-[40px] border border-white/10 space-y-8 shadow-[0_30px_100px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-3xl bg-accent-red/10 flex items-center justify-center border border-accent-red/20">
                  <ShieldAlert className="w-8 h-8 text-accent-red" />
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white italic italic leading-none">CORRECTION</h3>
                  <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-2">Aegis missed the context here</p>
                </div>
              </div>

              <div className="p-6 glass-pressed rounded-2xl italic text-lg text-white/70 border border-white/5">
                "{feedbackMessage.text}"
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Your instruction for the future</label>
                <textarea 
                  autoFocus
                  placeholder="e.g. This is my teammate Sai, his messages about 'deployment' are always urgent."
                  className="w-full h-40 glass-pressed rounded-3xl p-8 text-white/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/30 border border-white/5 resize-none transition-all text-sm leading-relaxed"
                  id="correctionInput"
                />
              </div>

              <div className="flex gap-4">
                <button onClick={() => setFeedbackMessage(null)} className="flex-1 py-5 glass hover:bg-white/10 rounded-2xl text-white/40 font-bold transition-all border border-white/5">Discard</button>
                <button 
                  onClick={() => submitCorrectiveFeedback(document.getElementById('correctionInput').value)}
                  className="flex-1 py-5 bg-accent-blue hover:bg-blue-600 text-white rounded-2xl font-black tracking-widest transition-all shadow-[0_10px_30px_rgba(88,166,255,0.3)]"
                >
                  UPDATE AEGIS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}} />
    </div>
  );
}
