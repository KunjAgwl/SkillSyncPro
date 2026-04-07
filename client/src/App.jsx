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
    isAgentThinking
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
          />
        )}

        {activeTab === 'discovery' && (
          <DiscoveryTab 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            fetchDiscoverJobs={fetchDiscoverJobs} 
            allJobs={allJobs} 
          />
        )}

        {activeTab === 'courses' && (
          <CourseTab matchData={matchData} />
        )}

        {activeTab === 'profile' && (
          <ProfileTab history={history} />
        )}

        {activeTab === 'agent' && (
          <AgentTab 
            messages={messages} 
            sendMessageToAgent={sendMessageToAgent} 
            isAgentThinking={isAgentThinking} 
          />
        )}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
