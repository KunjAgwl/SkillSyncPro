import React from 'react';

const ITEMS = [
  { tab: 'match', icon: 'cloud_upload', label: 'Match Resume' },
  { tab: 'discovery', icon: 'manage_search', label: 'Job Directory' },
  { tab: 'courses', icon: 'school', label: 'Skill Boosters' },
  { tab: 'resume', icon: 'article', label: 'Resume Lab' },
  { tab: 'agent', icon: 'smart_toy', label: 'AI Agent' },
  { tab: 'profile', icon: 'history', label: 'Scan History' },
];

// Desktop-only navigation (the phone layout uses BottomNav)
const Sidebar = ({ activeTab, setActiveTab, triggerHaptic }) => (
  <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col gap-8 p-6">
    <div className="flex items-center gap-3 px-2 pt-2">
      <div className="size-12 flex items-center justify-center rounded-full neu-flat text-primary">
        <span className="material-symbols-outlined text-[24px]">work_history</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Matcher</span>
        <h1 className="text-lg font-extrabold text-text-main dark:text-white leading-tight">SkillSync Pro</h1>
      </div>
    </div>

    <nav className="flex flex-col gap-3">
      {ITEMS.map(({ tab, icon, label }) => {
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            onClick={() => {
              if (!active) {
                triggerHaptic();
                setActiveTab(tab);
              }
            }}
            className={`flex items-center gap-4 rounded-2xl px-5 py-3.5 text-sm font-bold transition-all duration-200 ${
              active
                ? 'neu-pressed text-primary'
                : 'neu-button text-text-light hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">{icon}</span>
            {label}
          </button>
        );
      })}
    </nav>

    <p className="mt-auto px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-text-light/50">
      Career Intelligence Engine
    </p>
  </aside>
);

export default Sidebar;
