import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, ChevronUp } from 'lucide-react';
import MessageCard from './MessageCard';

export default function ClusterCard({ cluster }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 250, damping: 20 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className="flex flex-col gap-3 group"
    >
      <div 
        onClick={() => setExpanded(!expanded)}
        className="glass p-4 rounded-2xl flex items-center justify-between cursor-pointer group-hover:bg-white/5 transition-colors group-hover:border-white/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full glass-pressed flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-accent-muted" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white/90">
              {cluster.messages.length} messages regarding {cluster.topic}
            </h4>
            <p className="text-xs text-white/50">Automatically clustered to prevent overload</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-semibold px-2 py-1 rounded-full border uppercase tracking-wider border-accent-muted/30 bg-accent-muted/10 text-accent-muted">
            {cluster.action.replace('_', ' ')}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-white/50" /> : <ChevronDown className="w-4 h-4 text-white/50" />}
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: -12 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 0 }}
            exit={{ height: 0, opacity: 0, marginTop: -12 }}
            className="pl-6 border-l-2 border-white/5 ml-4 flex flex-col gap-3 overflow-hidden"
          >
            {cluster.messages.map(msg => (
              <MessageCard key={msg.id} message={msg} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
