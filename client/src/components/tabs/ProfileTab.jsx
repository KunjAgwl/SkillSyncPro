import React from 'react';

const ProfileTab = ({ history }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
          <div className="size-24 rounded-full neu-flat flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[48px]">account_circle</span>
          </div>
          <div>
             <h2 className="text-xl font-black text-text-main dark:text-white">Profile History</h2>
             <p className="text-xs text-text-light font-bold tracking-widest uppercase mt-1">Scan Legacy</p>
          </div>
       </div>

       <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-5">
          <h3 className="text-sm font-black text-text-light uppercase tracking-widest px-2 lg:col-span-full">Recent Scans</h3>
          {history.map((item) => (
            <div key={item.id} className="p-4 rounded-3xl neu-flat flex items-center justify-between">
               <div className="flex-1 pr-4">
                  <p className="text-[10px] text-primary font-black uppercase">{new Date(item.created_at).toLocaleDateString()}</p>
                  <h4 className="font-bold text-sm text-text-main dark:text-white truncate max-w-[180px] lg:max-w-md">{item.top_match_title}</h4>
                  <p className="text-[10px] text-text-light italic">{item.resume_summary}</p>
               </div>
               <div className="size-12 rounded-2xl neu-pressed flex flex-col items-center justify-center leading-none">
                  <span className="text-xs font-black text-[#4caf50]">{item.match_score}</span>
                  <span className="text-[6px] font-bold text-text-light uppercase">Match</span>
               </div>
            </div>
          ))}
          {history.length === 0 && <p className="text-center text-text-light italic lg:col-span-full">No matching history yet.</p>}
       </div>
    </div>
  );
};

export default ProfileTab;
