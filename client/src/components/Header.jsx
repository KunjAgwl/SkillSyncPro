import React from 'react';

const Header = () => {
  return (
    <header className="flex items-center justify-between px-6 pt-10 pb-6">
      <div className="flex items-center gap-4">
        <div className="size-12 flex items-center justify-center rounded-full neu-flat text-primary">
          <span className="material-symbols-outlined text-[24px]">work_history</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Matcher</span>
          <h1 className="text-xl font-extrabold text-text-main dark:text-white leading-tight">SkillSync Pro</h1>
        </div>
      </div>
      <button className="size-12 rounded-full neu-button flex items-center justify-center">
        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
           <span className="material-symbols-outlined text-[20px]">person</span>
        </div>
      </button>
    </header>
  );
};

export default Header;
