import React from 'react';

const MatchTab = ({ 
  isUploading, 
  handleFileUpload, 
  matchData, 
  setActiveTab, 
  boostSpecificSkill, 
  triggerHaptic,
  optimizeResume
}) => {
  return (
    <div className="space-y-8 animate-fade-in relative lg:space-y-0 lg:grid lg:grid-cols-[340px_1fr] lg:gap-8 lg:items-start">
      
      {/* Hero Profile / Upload Section */}
      <section className="relative w-full rounded-[2.5rem] p-8 neu-flat overflow-hidden lg:sticky lg:top-10">
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="size-20 rounded-full neu-flat flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[40px] text-primary">
              {isUploading ? 'sync' : 'cloud_upload'}
            </span>
          </div>
          
          <h2 className="text-2xl font-extrabold text-text-main dark:text-white mb-2 leading-tight">
            {isUploading ? 'Analyzing Resume...' : 'Find Your Path'}
          </h2>
          <p className="text-sm text-text-light dark:text-gray-400 max-w-[220px] mb-6">
            Upload your PDF resume to see AI-powered job matches and skill gaps.
          </p>

          <label className="w-full">
            <div 
              onClick={() => !isUploading && triggerHaptic()}
              className={`cursor-pointer flex items-center justify-center gap-2 px-8 py-4 rounded-full neu-button text-primary font-bold text-sm tracking-wide ${isUploading ? 'opacity-50' : ''}`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isUploading ? 'hourglass_top' : 'add_circle'}
              </span>
              {isUploading ? 'Processing...' : 'Upload Resume'}
            </div>
            <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </section>

      {/* Results Section */}
      <section className="flex flex-col gap-4 pb-10">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-extrabold text-text-main dark:text-white">Top Matches</h3>
          <span className="material-symbols-outlined text-text-light">sort</span>
        </div>

        {matchData ? (
          <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-1 xl:grid-cols-2 lg:gap-6">
            {matchData.allMatches?.map((match, idx) => (
              <div key={idx} className="rounded-[2rem] p-6 neu-flat space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <h4 className="font-bold text-lg text-text-main dark:text-white">{match.title}</h4>
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">{match.company}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full neu-pressed text-[#4caf50] text-[10px] font-black uppercase">
                    {match.matchScore}% 
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => optimizeResume(match.description)}
                    className="flex-1 py-3 rounded-2xl neu-button text-[10px] font-black text-primary uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                    AI Optimizer
                  </button>
                  <button 
                    onClick={() => {
                      triggerHaptic();
                      setActiveTab('courses');
                    }}
                    className="size-12 rounded-2xl neu-button flex items-center justify-center text-text-light hover:text-primary transition-all"
                  >
                    <span className="material-symbols-outlined">school</span>
                  </button>
                </div>

                <p className="text-xs text-text-light dark:text-gray-400 line-clamp-2">
                   {match.description || "No description provided."}
                </p>

                <div className="space-y-4 pt-2">
                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Matched Skills</p>
                      <div className="flex flex-wrap gap-2">
                         {match.matchedSkills?.map(s => (
                           <span key={s} className="px-3 py-1.5 rounded-lg neu-pressed text-[10px] text-text-main dark:text-gray-300 font-bold border border-primary/10">
                             {s}
                           </span>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-2">
                      <p className="text-[10px] font-black text-text-light uppercase tracking-widest">Skills to Build</p>
                      <div className="flex flex-wrap gap-2">
                         {match.missingSkills?.map(s => (
                           <button 
                             key={s} 
                             onClick={() => boostSpecificSkill(s)}
                             className="px-3 py-1.5 rounded-xl neu-button text-[10px] text-primary font-bold hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1 group"
                           >
                             <span className="material-symbols-outlined text-[12px] opacity-0 group-hover:opacity-100 transition-opacity">bolt</span>
                             {s}
                           </button>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full rounded-[2rem] p-10 neu-pressed flex flex-col items-center justify-center gap-3 text-center">
            <span className="material-symbols-outlined text-[48px] text-text-light/30">find_in_page</span>
            <p className="text-sm text-text-light font-medium italic">Your dream job is waiting. Upload a resume to start searching.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default MatchTab;
