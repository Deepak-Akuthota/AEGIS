import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, User, Users, Briefcase, Heart, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function Profile({ onBack }) {
  const [formData, setFormData] = useState({
    identity: '',
    core_teammates: '',
    active_projects: '',
    recreation_and_hobbies: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Fetch current profile
    fetch('http://localhost:3000/api/settings/profile')
      .then(res => res.json())
      .then(data => {
        setFormData({
          identity: data.identity || '',
          core_teammates: (data.core_teammates || []).join(', '),
          active_projects: Object.keys(data.active_projects || {}).join(', '),
          recreation_and_hobbies: (data.recreation_and_hobbies || []).join(', '),
        });
      })
      .catch(err => console.error('Failed to load profile', err));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    
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
    };

    try {
      const res = await fetch('http://localhost:3000/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save profile', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors font-bold uppercase tracking-widest text-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-accent-blue" />
            <h1 className="text-xl font-bold text-white">Aegis Profile</h1>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          {/* Identity Section */}
          <section className="glass p-8 rounded-3xl border border-white/5 space-y-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl glass-pressed flex items-center justify-center border border-white/5">
                <User className="w-5 h-5 text-accent-blue" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Who are you?</h2>
                <p className="text-sm text-white/40">This helps the AI understand your role.</p>
              </div>
            </div>
            
            <textarea 
              value={formData.identity}
              onChange={(e) => setFormData({...formData, identity: e.target.value})}
              className="w-full h-32 glass-pressed rounded-2xl p-6 text-white/90 focus:outline-none focus:ring-2 focus:ring-accent-blue/50 border border-white/5 resize-none transition-all"
              placeholder="e.g. Senior Backend Dev working on Nexus API..."
            />
          </section>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Users className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold text-white">Teammates</h3>
              </div>
              <input 
                type="text"
                value={formData.core_teammates}
                onChange={(e) => setFormData({...formData, core_teammates: e.target.value})}
                className="w-full glass-pressed rounded-xl p-4 text-white/90 border border-white/5 focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                placeholder="Comma separated names..."
              />
            </div>

            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <Briefcase className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold text-white">Projects</h3>
              </div>
              <input 
                type="text"
                value={formData.active_projects}
                onChange={(e) => setFormData({...formData, active_projects: e.target.value})}
                className="w-full glass-pressed rounded-xl p-4 text-white/90 border border-white/5 focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                placeholder="Comma separated names..."
              />
            </div>

            <div className="glass p-8 rounded-3xl border border-white/5 space-y-6 md:col-span-2">
              <div className="flex items-center gap-4 mb-2">
                <Heart className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold text-white">Interests & Hobbies</h3>
              </div>
              <input 
                type="text"
                value={formData.recreation_and_hobbies}
                onChange={(e) => setFormData({...formData, recreation_and_hobbies: e.target.value})}
                className="w-full glass-pressed rounded-xl p-4 text-white/90 border border-white/5 focus:outline-none focus:ring-1 focus:ring-accent-blue/50"
                placeholder="Comma separated hobbies (F1, Valorant, etc.)..."
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-8">
            <button 
              onClick={() => {
                localStorage.removeItem('aegis_onboarding_complete');
                window.location.reload();
              }}
              className="px-6 py-4 text-accent-red hover:bg-accent-red/10 rounded-2xl font-bold transition-all border border-accent-red/20"
            >
              Logout & Reset
            </button>

            <div className="flex items-center gap-6">
              {saveSuccess && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 text-accent-blue font-bold text-sm"
                >
                  <CheckCircle2 className="w-5 h-5" /> Profile updated!
                </motion.div>
              )}
              
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-10 py-4 bg-accent-blue hover:bg-blue-500 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-[0_0_30px_rgba(88,166,255,0.3)] disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
                <Save className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
