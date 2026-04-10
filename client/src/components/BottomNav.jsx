import React from 'react';

const NavIcon = ({ name, active, onClick, filled = false }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-1 transition-colors duration-300 ${active ? 'text-primary' : 'text-text-light hover:text-primary'}`}
  >
    <span className={`material-symbols-outlined text-[26px] ${filled ? 'filled' : ''}`}>
      {name}
    </span>
    {active && <div className="size-1 rounded-full bg-primary shadow-[0_0_8px_rgba(226,185,110,0.8)]"></div>}
  </button>
);

const BottomNav = ({ activeTab, setActiveTab, triggerHaptic }) => {
  const handleNavClick = (tab) => {
    if (activeTab !== tab) {
      triggerHaptic(); // Vibrate slightly on tab switch!
      setActiveTab(tab);
    }
  };

  return (
    <div className="fixed bottom-8 left-0 right-0 px-6 z-50">
      <nav className="mx-auto w-full max-w-sm rounded-full neu-flat px-8 py-5 flex items-center justify-between">
        <NavIcon name="article" active={activeTab === 'resume'} onClick={() => handleNavClick('resume')} />
        <NavIcon name="manage_search" active={activeTab === 'discovery'} onClick={() => handleNavClick('discovery')} />
        
        <div className="relative">
           <button 
             onClick={() => handleNavClick('match')}
             className={`size-14 -mt-16 rounded-full bg-primary text-white shadow-[0_10px_20px_rgba(226,185,110,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all ${activeTab === 'match' ? 'scale-110 ring-4 ring-primary/20' : ''}`}
           >
             <span className="material-symbols-outlined text-[30px] font-bold">add</span>
           </button>
        </div>

        <NavIcon name="school" active={activeTab === 'courses'} onClick={() => handleNavClick('courses')} />
        <NavIcon name="smart_toy" active={activeTab === 'agent'} onClick={() => handleNavClick('agent')} />
      </nav>
    </div>
  );
};

export default BottomNav;
