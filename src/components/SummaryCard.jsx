import React, { useEffect } from 'react';
import { ShieldAlert, ShieldX, Activity, Bot, Clock } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';

function AnimatedNumber({ value }) {
  const spring = useSpring(0, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current));
  
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export default function SummaryCard({ messages, metrics, sessionSummary, isDeepWork }) {
  const total = metrics?.total || 0;
  const alerted = metrics?.alerts || 0;
  const blocked = metrics?.blocked || 0;
  const autoReplied = metrics?.auto || 0;
  const focusTimeSaved = metrics?.focusTimeSaved || 0;

  return (
    <div className="glass p-6 rounded-2xl flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-blue" />
          Session Summary
        </h3>
        <p className="text-xs text-white/50 mt-1">
          {isDeepWork ? 'Real-time metrics for current deep work session' : 'Last session performance overview'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-pressed rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
          <span className="text-3xl font-bold text-white"><AnimatedNumber value={total} /></span>
          <span className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">Total</span>
        </div>
        
        <div className="glass-pressed rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden border border-accent-red/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent-red/50" />
          <span className="text-3xl font-bold text-accent-red"><AnimatedNumber value={alerted} /></span>
          <span className="text-xs text-accent-red/70 font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Alerts
          </span>
        </div>

        <div className="glass-pressed rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden border border-accent-muted/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent-muted/50" />
          <span className="text-3xl font-bold text-accent-muted"><AnimatedNumber value={blocked} /></span>
          <span className="text-xs text-accent-muted/70 font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
            <ShieldX className="w-3 h-3" /> Blocked
          </span>
        </div>

        <div className="glass-pressed rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden border border-accent-blue/10">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent-blue/50" />
          <span className="text-3xl font-bold text-accent-blue"><AnimatedNumber value={autoReplied} /></span>
          <span className="text-xs text-accent-blue/70 font-medium uppercase tracking-wider mt-1 flex items-center gap-1">
            <Bot className="w-3 h-3" /> Auto
          </span>
        </div>
      </div>

      <div className="glass-pressed rounded-xl p-5 border border-accent-purple/20 flex items-center justify-between relative overflow-hidden group hover:border-accent-purple/40 transition-colors duration-300">
        <div className="absolute -inset-4 bg-accent-purple/5 blur-xl group-hover:bg-accent-purple/10 transition-colors" />
        <div className="relative z-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent-purple">Focus Time Saved</span>
          <div className="text-2xl font-bold text-white mt-1 flex items-end gap-1">
            <AnimatedNumber value={focusTimeSaved} /> <span className="text-sm font-medium text-white/50 mb-1">mins</span>
          </div>
        </div>
        <div className="w-12 h-12 rounded-full glass-pressed border border-accent-purple/30 flex items-center justify-center relative z-10 shadow-[0_0_15px_rgba(138,43,226,0.3)]">
          <Clock className="w-6 h-6 text-accent-purple" />
        </div>
      </div>

      <div className="glass-pressed p-4 rounded-xl border border-white/5">
        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Bot className="w-3.5 h-3.5" /> {isDeepWork ? 'Real-time AI Synthesis' : 'Final Session Synthesis'}
        </h4>
        <div className="text-sm text-white/60 leading-relaxed italic whitespace-pre-wrap">
          {isDeepWork ? (
             `Currently blocking ${blocked + autoReplied} interruptions. ${alerted > 0 ? `Alerted you to ${alerted} critical issue(s).` : 'No critical issues detected.'} Focus quality remains high.`
          ) : (
            sessionSummary || "Switch Deep Work off to see a full synthesis of missed messages."
          )}
        </div>
      </div>
    </div>
  );
}
