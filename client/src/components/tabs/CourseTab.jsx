import React from 'react';

const CourseTab = ({ matchData }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="flex flex-col gap-2">
         <h2 className="text-2xl font-black text-text-main dark:text-white">Skill Boosters</h2>
         <p className="text-sm text-text-light italic">Master the skills your top matches require.</p>
       </div>

       <div className="grid grid-cols-1 gap-6">
          {matchData?.bestMatch?.missingSkills?.map((skill, i) => (
            <a 
              key={i} 
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill + ' full course tutorial')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-3xl p-6 neu-flat flex items-center justify-between hover:scale-[1.02] transition-transform"
            >
              <div className="flex items-center gap-4">
                 <div className="size-12 rounded-2xl neu-icon flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined">menu_book</span>
                 </div>
                 <div>
                    <p className="text-xs font-black text-primary uppercase tracking-tighter">YouTube Masterclass</p>
                    <h4 className="font-bold text-text-main dark:text-white">{skill}</h4>
                 </div>
              </div>
              <span className="material-symbols-outlined text-primary group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          )) || (
            <div className="p-10 neu-pressed rounded-[2rem] text-center text-text-light italic">
              Upload a resume first to see personalized course recommendations.
            </div>
          )}
       </div>
    </div>
  );
};

export default CourseTab;
