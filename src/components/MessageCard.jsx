import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ShieldX, Bot, MessageSquare, Flag, CheckCircle2, BrainCircuit, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';

const ConfidenceBar = ({ confidence }) => {
  const percentage = Math.round((confidence || 0) * 100);
  let color = "bg-white/20";
  if (percentage >= 90) color = "bg-accent-red";
  else if (percentage >= 70) color = "bg-accent-blue";
  else color = "bg-white/40";

  return (
    <div className="flex items-center gap-3 mt-1">
      <span className="text-xs font-semibold text-white/50 w-20 uppercase tracking-wider">Confidence</span>
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full", color)}
        />
      </div>
      <span className={cn("text-xs font-mono font-bold w-10 text-right", color.replace('bg-', 'text-'))}>{percentage}%</span>
    </div>
  );
};

export default function MessageCard({ message }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFeedback = async (type) => {
    const feedbackData = {
      type,
      messageId: message.id,
      text: feedbackText,
      originalMessage: message.message
    };

    // If it's a missed alert, we can also prompt for slang logic
    if (type === 'missed_alert') {
      const slangMeaning = window.prompt(`How should Aegis interpret this in the future?\nMessage: "${message.message}"\nExample: "server down"`);
      if (slangMeaning) {
        try {
          await fetch('http://localhost:3000/api/webhook/learn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category: 'learned_slang', newValue: `${message.message} -> ${slangMeaning}` })
          });
        } catch(e) { console.error(e); }
      }
    }

    try {
      // In a real app, we'd log the detailed feedbackText too
      setFeedbackSubmitted(true);
      setTimeout(() => {
        setShowFeedback(false);
        setFeedbackSubmitted(false);
        setFeedbackText('');
      }, 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const getActionStyles = (action) => {
    switch (action) {
      case 'alert':
        return 'border-accent-red/50 bg-accent-red/10 text-accent-red';
      case 'auto_reply':
        return 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue';
      case 'blocked':
      default:
        return 'border-accent-muted/30 bg-accent-muted/10 text-accent-muted';
    }
  };

  const isAlert = message.action === 'alert';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -30, scale: 0.9, x: isAlert ? -10 : 0 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        x: 0,
        boxShadow: isAlert ? ['0px 0px 0px rgba(248,81,73,0)', '0px 0px 20px rgba(248,81,73,0.4)', '0px 0px 10px rgba(248,81,73,0.2)'] : undefined
      }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ 
        duration: 0.4, 
        type: "spring", 
        stiffness: 250, 
        damping: 20,
        boxShadow: { repeat: Infinity, repeatType: 'reverse', duration: 2 }
      }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "glass p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden transition-colors duration-300 cursor-pointer",
        isAlert ? "border-accent-red/40 bg-accent-red/5" : "hover:border-white/20",
        isExpanded && !isAlert && "border-white/20 bg-white/5"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Top Section */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full glass-pressed flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-white/70" />
          </div>
          <div>
            <h4 className="font-semibold text-white/90">{message.sender}</h4>
            <p className="text-xs text-white/50">{message.timestamp ? new Date(message.timestamp).toLocaleTimeString() : 'Just now'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end">
            <span className={cn("text-xs font-semibold px-2 py-1 rounded-full border uppercase tracking-wider", getActionStyles(message.action))}>
              {(message.action || 'blocked').replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Message Content */}
      <div className="mt-1">
        <p className="text-white/80 leading-relaxed text-sm">
          "{message.message}"
        </p>
      </div>

      {/* AI Reasoning Section */}
      <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs border-b border-white/10 pb-2 mb-1">
          <div className="flex items-center gap-1.5 text-accent-blue font-semibold tracking-wide">
            <BrainCircuit className="w-4 h-4" />
            <span>AI REASONING</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowFeedback(!showFeedback);
              }}
              className={cn(
                "text-white/30 hover:text-white/70 transition-colors p-1 rounded-md hover:bg-white/5",
                showFeedback && "text-white/70 bg-white/5"
              )}
              title="Report Feedback"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-start gap-4">
          <p className="text-xs text-white/60 italic flex-1">
            {message.reason || "Decision based on current Deep Work context."}
          </p>
          <div className="text-white/40 p-1 rounded-md shrink-0">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Expandable Deep Analysis Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-pressed p-4 rounded-xl border border-white/5 flex flex-col gap-3 shadow-inner">
                <div className="flex justify-between items-center pb-2 border-b border-white/5">
                  <span className="text-[10px] uppercase tracking-widest text-accent-blue/80 font-bold">Deep Analysis</span>
                </div>
                
                <div className="grid grid-cols-[80px_1fr] gap-y-2 text-xs">
                  <span className="text-white/40 font-semibold uppercase tracking-wider">Intent:</span>
                  <span className="text-white/90 capitalize">{message.intent?.replace('_', ' ') || 'Neutral'}</span>
                  
                  <span className="text-white/40 font-semibold uppercase tracking-wider mt-1">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {message.keywords?.map((kw, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 text-[10px] font-mono border border-white/5">
                        {kw}
                      </span>
                    )) || <span className="text-white/40 italic">None detected</span>}
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-white/5">
                  <ConfidenceBar confidence={message.confidence || 0.85} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {message.auto_reply_text && (
          <div className="glass-pressed p-2 rounded-md mt-1">
            <p className="text-xs text-accent-blue/80 flex items-center gap-2">
              <Bot className="w-3 h-3" />
              Auto-replied: "{message.auto_reply_text}"
            </p>
          </div>
        )}

        {/* Feedback Area */}
        <AnimatePresence>
          {showFeedback && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="glass-pressed p-4 rounded-lg flex flex-col gap-3">
                {feedbackSubmitted ? (
                  <div className="flex items-center gap-2 text-xs text-accent-blue/80 justify-center py-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Feedback recorded. Thank you!</span>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-white/60 font-medium">Help Aegis improve its decision-making:</p>
                    
                    <textarea 
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Explain why this decision was wrong..."
                      className="w-full h-20 bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white/80 focus:outline-none focus:ring-1 focus:ring-accent-blue/50 resize-none"
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleFeedback('missed_alert')}
                        className="text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-white/70 py-2 px-2 rounded-md transition-colors border border-white/5"
                      >
                        Missed Alert
                      </button>
                      <button 
                        onClick={() => handleFeedback('should_block')}
                        className="text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:bg-white/10 text-white/70 py-2 px-2 rounded-md transition-colors border border-white/5"
                      >
                        Should Block
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
