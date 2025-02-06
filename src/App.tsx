import React, { useState } from 'react';
import { ResearchInterface } from './components/ResearchInterface';
import { LandingPage } from './components/LandingPage';

function App() {
  const [showResearch, setShowResearch] = useState(false);

  const handleSignOut = async () => {
    setShowResearch(false);
  };

  if (showResearch) {
    return <ResearchInterface onSignOut={handleSignOut} onBack={() => setShowResearch(false)} />;
  }

  return <LandingPage onAuthClick={() => setShowResearch(true)} />;
}

export default App;