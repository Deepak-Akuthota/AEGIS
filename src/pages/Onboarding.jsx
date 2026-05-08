import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User, Users, Briefcase, Heart, ArrowRight, ArrowLeft, Check } from 'lucide-react';

const steps = [
  { id: 'identity', title: 'Identity', icon: User, subtitle: 'Tell us who you are' },
  { id: 'teammates', title: 'Teammates', icon: Users, subtitle: 'Whose messages matter?' },
  { id: 'projects', title: 'Projects', icon: Briefcase, subtitle: 'What are you building?' },
  { id: 'hobbies', title: 'Interests', icon: Heart, subtitle: 'What distractions should we block?' },
];

export default function Onboarding({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    identity: '',
    core_teammates: '',
    active_projects: '',
    recreation_and_hobbies: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Process comma separated strings into arrays/objects
    const teammates = formData.core_teammates.split(',').map(s => s.trim()).filter(Boolean);
    const projectsArray = formData.active_projects.split(',').map(s => s.trim()).filter(Boolean);
    const projects = {};
    projectsArray.forEach(p => projects[p] = "Active project");
    const hobbies = formData.recreation_and_hobbies.split(',').map(s => s.trim()).filter(Boolean);

    const profile = {
      identity: formData.identity,
      core_teammates: teammates,
      active_projects: projects,
      recreation_and_hobbies: hobbies,
      learned_slang: [] // Initialize empty
    };

    try {
      const res = await fetch('http://localhost:3000/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        localStorage.setItem('aegis_onboarding_complete', 'true');
        onComplete();
      }
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue rounded-full blur-[120px] opacity-10 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-purple rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl glass rounded-3xl overflow-hidden shadow-2xl relative z-10"
      >
        {/* Progress Bar */}
        <div className="h-1.5 w-full bg-white/5 flex">
          {steps.map((_, idx) => (
            <div 
              key={idx}
              className={`h-full flex-1 transition-all duration-500 ${idx <= currentStep ? 'bg-accent-blue' : 'bg-transparent'}`}
            />
          ))}
        </div>

        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center border border-white/10">
              <StepIcon className="w-6 h-6 text-accent-blue" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{steps[currentStep].title}</h2>
              <p className="text-white/50 text-sm">{steps[currentStep].subtitle}</p>
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider">Your Professional Identity</label>
                    <textarea 
                      placeholder="e.g. Senior Backend Dev working on Nexus API..."
                      className="w-full h-32 glass-pressed rounded-xl p-4 text-white/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 border border-white/5 resize-none"
                      value={formData.identity}
                      onChange={(e) => setFormData({...formData, identity: e.target.value})}
                    />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider">Core Teammates (Comma separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Aditya, Deepak, Sarah..."
                      className="w-full glass-pressed rounded-xl p-4 text-white/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 border border-white/5"
                      value={formData.core_teammates}
                      onChange={(e) => setFormData({...formData, core_teammates: e.target.value})}
                    />
                    <p className="text-xs text-white/40 italic">Aegis will treat these names with higher priority.</p>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider">Active Projects (Comma separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Aegis, Nexus, IHMS..."
                      className="w-full glass-pressed rounded-xl p-4 text-white/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 border border-white/5"
                      value={formData.active_projects}
                      onChange={(e) => setFormData({...formData, active_projects: e.target.value})}
                    />
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-white/70 uppercase tracking-wider">Hobbies/Distractions (Comma separated)</label>
                    <input 
                      type="text"
                      placeholder="e.g. Valorant, F1, Elden Ring..."
                      className="w-full glass-pressed rounded-xl p-4 text-white/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 border border-white/5"
                      value={formData.recreation_and_hobbies}
                      onChange={(e) => setFormData({...formData, recreation_and_hobbies: e.target.value})}
                    />
                    <p className="text-xs text-white/40 italic">Aegis will filter out conversations about these topics during Deep Work.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/5">
            <button 
              onClick={handleBack}
              disabled={currentStep === 0}
              className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${currentStep === 0 ? 'text-white/20' : 'text-white/60 hover:text-white transition-colors'}`}
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>

            <button 
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-3 bg-accent-blue hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-3 transition-all shadow-[0_0_20px_rgba(88,166,255,0.3)] disabled:opacity-50"
            >
              {currentStep === steps.length - 1 ? (isSubmitting ? 'Saving...' : 'Finish Setup') : 'Next'}
              {currentStep === steps.length - 1 ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Brand Footer */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 text-white/20">
        <ShieldCheck className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Aegis Secure Onboarding</span>
      </div>
    </div>
  );
}
