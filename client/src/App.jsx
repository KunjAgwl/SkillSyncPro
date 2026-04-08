import React from 'react';
import useSkillSync from './hooks/useSkillSync';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import MatchTab from './components/tabs/MatchTab';
import DiscoveryTab from './components/tabs/DiscoveryTab';
import CourseTab from './components/tabs/CourseTab';
import ProfileTab from './components/tabs/ProfileTab';

import AgentTab from './components/tabs/AgentTab';

const App = () => {
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
    triggerHaptic
  } = useSkillSync();

  return (
    <div className="relative flex h-full min-h-screen w-full max-w-md mx-auto flex-col overflow-x-hidden pb-32">
      <Header />

      <main className="flex-1 px-6">
        {activeTab === 'match' && (
          <MatchTab 
            isUploading={isUploading} 
            handleFileUpload={handleFileUpload} 
            matchData={matchData} 
            setActiveTab={setActiveTab} 
            boostSpecificSkill={boostSpecificSkill}
            triggerHaptic={triggerHaptic}
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

      <BottomNav 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        triggerHaptic={triggerHaptic}
      />
    </div>
  );
};

export default App;
