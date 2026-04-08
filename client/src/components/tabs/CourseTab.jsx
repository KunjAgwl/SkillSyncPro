import React, { useState } from 'react';

const CourseTab = ({ matchData, roadmap, isRoadmapLoading, fetchRoadmap, targetSkills, setTargetSkills }) => {
  const [feedback, setFeedback] = useState('');
  // Use specific targeted skills if they deep-linked, otherwise default to all missing skills.
  const activeSkills = targetSkills || (matchData?.bestMatch?.missingSkills || []);

  const handleBuildPlan = () => {
    fetchRoadmap(activeSkills, feedback);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-md mx-auto no-scrollbar">
      {/* 🚀 Header Section */}
      <div className="flex flex-col gap-1.5 pt-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-sm">bolt</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Growth Engine</span>
        </div>
        <h2 className="text-3xl font-black text-text-main dark:text-white leading-tight">Skill Boosters</h2>
        <p className="text-[11px] text-text-light font-medium max-w-[80%] uppercase tracking-wider">
          Accelerated roadmaps to bridge your experience gap.
        </p>
      </div>

      {/* 🛠️ Customization Gateway (The "Builder" Home) */}
      {!roadmap && (
        <div className="space-y-6">
          <div className="p-8 rounded-[2.5rem] neu-flat bg-surface-light/50 border border-primary/5 space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-text-main">Customize Your Path</h3>
              <p className="text-[11px] text-text-light font-medium leading-relaxed uppercase tracking-tight">
                Tell the AI about your learning style or time availability to get a better plan!
              </p>
            </div>

            <div className="relative">
               <textarea 
                  className="w-full text-xs font-medium p-5 rounded-3xl neu-pressed bg-transparent border-none focus:ring-1 focus:ring-primary/20 text-text-main h-28 placeholder:text-text-light/50"
                  placeholder="e.g., 'I have 1 hour a day', 'Focus on coding interview questions', 'I am a visual learner'..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
               />
               <span className="absolute bottom-4 right-4 material-symbols-outlined text-text-light/30 text-lg">edit_note</span>
            </div>

            <button 
              onClick={handleBuildPlan}
              disabled={isRoadmapLoading || activeSkills.length === 0}
              className="w-full py-4 rounded-[2rem] bg-primary text-white shadow-xl shadow-primary/30 flex items-center justify-center gap-3 transition-all hover:scale-[0.98] active:scale-95 disabled:opacity-50 group font-black"
            >
              {isRoadmapLoading ? (
                <>
                  <span className="material-symbols-outlined animate-spin">psychology</span>
                  <span className="text-xs uppercase tracking-widest leading-none">Architecting...</span>
                </>
              ) : (
                <>
                  <span className="text-xs uppercase tracking-widest leading-none">Build My Custom Plan</span>
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </>
              )}
            </button>
          </div>

          {/* Prompt for Resume Upload if needed */}
          {activeSkills.length === 0 && (
            <div className="p-10 rounded-[2.5rem] neu-pressed text-center">
               <span className="material-symbols-outlined text-4xl text-text-light/20 mb-3">upload_file</span>
               <p className="text-xs font-bold text-text-light uppercase tracking-widest px-4">
                  Please upload a resume first to identify your skill gaps.
               </p>
            </div>
          )}
        </div>
      )}

      {/* 📈 Active Roadmap View */}
      {roadmap && (
        <div className="space-y-6 animate-slide-up">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-sm font-black text-text-main dark:text-white uppercase tracking-widest flex items-center gap-2">
                 <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                 {roadmap.skill_title}
              </h3>
              <button 
                onClick={() => fetchRoadmap(activeSkills, feedback)}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"
              >
                Refresh
              </button>
           </div>

           <div className="space-y-4">
              {roadmap.steps.map((step, idx) => (
                <div key={idx} className="relative pl-10">
                  {idx !== roadmap.steps.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-[1px] bg-primary/20"></div>
                  )}
                  
                  <div className="absolute left-0 top-0 size-8 rounded-2xl neu-icon flex items-center justify-center text-[10px] font-black text-primary">
                    {step.step}
                  </div>

                  <div className="p-5 rounded-3xl neu-flat bg-surface-light/40 border border-primary/5">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-black text-text-main dark:text-white leading-tight uppercase tracking-tight">{step.title}</h4>
                      <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {step.estimated_time}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-light leading-relaxed">{step.description}</p>
                    
                    <a 
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(roadmap.skill_title + ' ' + step.title)}`}
                      target="_blank"
                      className="mt-4 flex items-center gap-2 text-primary text-[10px] font-black uppercase tracking-widest hover:gap-3 transition-all"
                    >
                      Find Resources <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                    </a>
                  </div>
                </div>
              ))}
           </div>
           
           <div className="flex flex-col gap-4 pt-6">
              <button 
                onClick={() => fetchRoadmap(activeSkills, feedback)}
                className="w-full py-4 rounded-3xl neu-flat text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:bg-primary/5 active:scale-95 transition-all"
              >
                Re-Generate Path
              </button>
              <button 
                onClick={() => { setFeedback(''); setRoadmap(null); setTargetSkills(null); }}
                className="text-[9px] font-black text-text-light uppercase tracking-widest hover:text-primary transition-colors text-center"
              >
                Back to Customizer
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default CourseTab;
