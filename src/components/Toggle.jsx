import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export default function Toggle({ active, onChange }) {
  return (
    <div className="flex items-center space-x-4">
      <span className={cn("text-sm font-medium transition-colors duration-300", active ? "text-accent-blue" : "text-white")}>
        Deep Work
      </span>
      <button
        onClick={() => onChange(!active)}
        className={cn(
          "relative inline-flex h-8 w-16 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-accent-blue focus:ring-offset-2 focus:ring-offset-background",
          active ? "glass-pressed border-accent-blue/50" : "glass-pressed border-transparent"
        )}
      >
        <motion.span
          layout
          className={cn(
            "pointer-events-none inline-block h-6 w-6 mt-[3px] ml-[3px] transform rounded-full glass transition duration-300 ease-in-out border-none",
            active ? "translate-x-8 bg-accent-blue/80" : "translate-x-0 bg-white/70"
          )}
        />
      </button>
      <span className={cn("text-sm font-medium transition-colors duration-300", active ? "text-accent-red" : "text-white/50")}>
        {active ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
