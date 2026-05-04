import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Toggle from '../components/Toggle';
import MessageCard from '../components/MessageCard';
import ClusterCard from '../components/ClusterCard';
import SummaryCard from '../components/SummaryCard';
import { generateMockMessage } from '../mock/data';
import { ShieldCheck } from 'lucide-react';

const playTone = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'alert') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.02, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch(e) {
    // Ignore audio errors
  }
};

export default function Dashboard() {
  const [isActive, setIsActive] = useState(false);
  const [messages, setMessages] = useState([]);
  const lastProcessedId = useRef(null);

  useEffect(() => {
    let interval;
    if (isActive) {
      interval = setInterval(() => {
        setMessages(prev => [generateMockMessage(), ...prev].slice(0, 50)); // Keep max 50
      }, 3500); // New message every 3.5 seconds
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (messages.length > 0) {
      const newest = messages[0];
      if (newest.id !== lastProcessedId.current) {
        lastProcessedId.current = newest.id;
        playTone(newest.action === 'alert' ? 'alert' : 'normal');
      }
    }
  }, [messages]);

  const clusteredMessages = React.useMemo(() => {
    const clustered = [];
    let currentCluster = null;

    messages.forEach((msg) => {
      if (msg.action !== 'alert' && msg.topic) {
        if (currentCluster && currentCluster.topic === msg.topic) {
          currentCluster.messages.push(msg);
        } else {
          if (currentCluster) {
            clustered.push(currentCluster);
          }
          currentCluster = {
            id: `cluster_${msg.id}`,
            isCluster: true,
            topic: msg.topic,
            action: msg.action,
            messages: [msg]
          };
        }
      } else {
        if (currentCluster) {
          clustered.push(currentCluster);
          currentCluster = null;
        }
        clustered.push(msg);
      }
    });
    if (currentCluster) {
      clustered.push(currentCluster);
    }
    return clustered;
  }, [messages]);

  const focusTimeSaved = messages.filter(m => m.action !== 'alert').length * 2;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Toast Notification */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-8 left-1/2 z-50 glass px-5 py-2.5 rounded-full border border-accent-blue/40 flex items-center gap-3 shadow-[0_0_20px_rgba(88,166,255,0.2)]"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-blue"></span>
            </span>
            <span className="text-sm text-accent-blue font-semibold tracking-wide">Aegis is now filtering interruptions</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Glows */}
      <motion.div 
        animate={{ scale: isActive ? 1.2 : 1, opacity: isActive ? 0.2 : 0.1 }}
        transition={{ duration: 2, ease: "easeInOut" }}
        className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue rounded-full blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{ scale: isActive ? 1.2 : 1, opacity: isActive ? 0.2 : 0.1 }}
        transition={{ duration: 2, ease: "easeInOut", delay: 0.2 }}
        className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple rounded-full blur-[120px] pointer-events-none" 
      />

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Aegis</h1>
              <p className="text-sm text-white/50">Cognitive Gatekeeper</p>
            </div>
          </div>
          
          <div className="glass px-6 py-3 rounded-full">
            <Toggle active={isActive} onChange={setIsActive} />
          </div>
        </header>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow overflow-hidden pb-12">
          
          {/* Left Column: Live Feed */}
          <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-lg font-semibold text-white/90">Live Decision Feed</h2>
              {isActive && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-red"></span>
                  </span>
                  <span className="text-xs text-accent-red font-bold uppercase tracking-widest">AI Monitoring</span>
                </div>
              )}
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-4 pb-4 custom-scrollbar">
              {!isActive && messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 glass-pressed rounded-2xl border-dashed border-white/10 border-2">
                  <ShieldCheck className="w-12 h-12 text-white/20 mb-4" />
                  <p className="text-white/60">System standby. Enable Deep Work to begin filtering.</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {clusteredMessages.map((item) => (
                    item.isCluster && item.messages.length > 1 ? (
                      <ClusterCard key={item.id} cluster={item} />
                    ) : (
                      <MessageCard key={item.id} message={item.isCluster ? item.messages[0] : item} />
                    )
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>

          {/* Right Column: Analytics / Overview */}
          <div className="flex flex-col gap-6">
            <SummaryCard messages={messages} focusTimeSaved={focusTimeSaved} />
          </div>

        </div>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}} />
    </div>
  );
}
