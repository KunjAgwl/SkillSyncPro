import React, { useState, useEffect } from 'react';
import useSkillSync from './hooks/useSkillSync';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MatchTab from './components/tabs/MatchTab';
import DiscoveryTab from './components/tabs/DiscoveryTab';
import CourseTab from './components/tabs/CourseTab';
import ResumeTab from './components/tabs/ResumeTab';
import ProfileTab from './components/tabs/ProfileTab';
import AgentTab from './components/tabs/AgentTab';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const {
    activeTab,
    setActiveTab,
    isUploading,
    matchData,
    history,
    allJobs,
    searchQuery,
    setSearchQuery,
    fetchDiscoverJobs,
    handleFileUpload,
    messages,
    sendMessageToAgent,
    isAgentThinking,
    roadmap,
    isRoadmapLoading,
    fetchRoadmap,
    boostSpecificSkill,
    targetSkills,
    setTargetSkills,
    triggerHaptic,
    optimizeResume,
    optimizationData,
    isOptimizing,
    setOptimizationData
  } = useSkillSync();

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  // 🎭 SPLASH SCREEN
  if (showSplash) {
    return (
      <div className="fixed inset-0 z-[1000] bg-surface-light dark:bg-surface-dark flex flex-col items-center justify-center overflow-hidden select-none">
        {/* 🌌 Background Atmosphere */}
        <div className="absolute top-[15%] left-[-15%] size-[400px] rounded-full bg-primary/8 blur-[100px]"></div>
        <div className="absolute bottom-[15%] right-[-10%] size-[350px] rounded-full bg-primary/12 blur-[80px]"></div>

        {/* 💎 CENTER: Logo + Title */}
        <div className="relative flex flex-col items-center gap-10">
          
          {/* Floating Neumorphic Icon */}
          <div className="animate-scale-up">
            <div className="animate-float">
              <div className="size-36 rounded-[2.5rem] neu-flat flex items-center justify-center relative overflow-hidden">
                <span className="material-symbols-outlined text-[72px] text-primary drop-shadow-[0_2px_8px_rgba(226,185,110,0.3)]">work_history</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-flare"></div>
              </div>
            </div>
          </div>

          {/* Title Block */}
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-5xl font-black tracking-tighter italic text-text-main dark:text-white animate-title-reveal">
              Skill<span className="text-primary">Sync</span><span className="text-primary/30">.</span>
            </h1>
            <div className="h-[2px] w-20 bg-gradient-to-r from-transparent via-primary/50 to-transparent animate-line-grow"></div>
            <p className="text-[9px] font-black text-text-light dark:text-gray-500 uppercase tracking-[0.5em] animate-subtitle-reveal">
              Career Intelligence Engine
            </p>
          </div>
        </div>

        {/* ❤️ NEUMORPHIC SIGNATURE CARD */}
        <div className="fixed bottom-12 left-6 right-6 flex justify-center animate-signature">
          <div className="px-8 py-4 rounded-[1.5rem] neu-pressed flex items-center gap-3 relative overflow-hidden">
            {/* Subtle shimmer across the card */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-flare"></div>
            
            <p className="text-[11px] font-semibold text-text-light/50 dark:text-gray-500 uppercase tracking-[0.2em] relative z-10">
              Made with
            </p>
            
            {/* Heart in its own tiny neumorphic circle */}
            <div className="size-8 rounded-full neu-flat flex items-center justify-center relative z-10">
              <span className="text-[14px] animate-heartbeat inline-block">❤️</span>
            </div>
            
            <p className="text-[11px] font-semibold text-text-light/50 dark:text-gray-500 uppercase tracking-[0.2em] relative z-10">
              by
            </p>
            
            <p className="text-[12px] font-black text-text-main dark:text-white uppercase tracking-[0.25em] relative z-10">
              Avdhi and Kunj
            </p>

            {/* Golden accent line at bottom */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[2px] bg-primary/30 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 📱 MAIN APP
  return (
    <>
      <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden pb-40">
        <Header onProfileClick={() => {
          triggerHaptic();
          setActiveTab('profile');
        }} />

        <main className="flex-1 px-6">
          {activeTab === 'match' && (
            <MatchTab 
              isUploading={isUploading} 
              handleFileUpload={handleFileUpload} 
              matchData={matchData} 
              setActiveTab={setActiveTab} 
              boostSpecificSkill={boostSpecificSkill}
              triggerHaptic={triggerHaptic}
              optimizeResume={optimizeResume}
              optimizationData={optimizationData}
              isOptimizing={isOptimizing}
              setOptimizationData={setOptimizationData}
            />
          )}

          {activeTab === 'discovery' && (
            <DiscoveryTab 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery} 
              fetchDiscoverJobs={fetchDiscoverJobs} 
              allJobs={allJobs} 
              triggerHaptic={triggerHaptic}
            />
          )}

          {activeTab === 'courses' && (
            <CourseTab 
              matchData={matchData} 
              roadmap={roadmap} 
              isRoadmapLoading={isRoadmapLoading} 
              fetchRoadmap={fetchRoadmap} 
              targetSkills={targetSkills}
              setTargetSkills={setTargetSkills}
              triggerHaptic={triggerHaptic}
            />
          )}

          {activeTab === 'resume' && (
            <ResumeTab 
              optimizationData={optimizationData} 
              isOptimizing={isOptimizing}
              triggerHaptic={triggerHaptic}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab history={history} />
          )}

          {activeTab === 'agent' && (
            <AgentTab 
              messages={messages} 
              sendMessageToAgent={sendMessageToAgent} 
              isAgentThinking={isAgentThinking} 
              triggerHaptic={triggerHaptic}
            />
          )}
        </main>
      </div>

      {/* 🔑 BottomNav is OUTSIDE the scrollable container — renders independently */}
      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        triggerHaptic={triggerHaptic}
      />
    </>
  );
};

export default App;
