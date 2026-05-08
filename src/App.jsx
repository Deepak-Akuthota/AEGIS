import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';

function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const completed = localStorage.getItem('aegis_onboarding_complete');
    if (!completed) {
      setShowOnboarding(true);
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  return (
    <>
      {showOnboarding ? (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      ) : showProfile ? (
        <Profile onBack={() => setShowProfile(false)} />
      ) : (
        <Dashboard onOpenProfile={() => setShowProfile(true)} />
      )}
    </>
  );
}

export default App;
