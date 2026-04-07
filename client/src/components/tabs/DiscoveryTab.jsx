import React from 'react';

const DiscoveryTab = ({ searchQuery, setSearchQuery, fetchDiscoverJobs, allJobs }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col gap-2">
         <h2 className="text-2xl font-black text-text-main dark:text-white">Job Directory</h2>
         <div className="relative mt-2">
            <input 
              type="text"
              placeholder="Search titles or companies..."
              className="w-full p-4 pl-12 rounded-2xl bg-surface-light dark:bg-surface-dark neu-pressed border-none focus:ring-0 text-sm"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                fetchDiscoverJobs(e.target.value);
              }}
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">search</span>
         </div>
      </div>

      <div className="space-y-4">
         {allJobs.map((job) => (
           <div key={job.id} className="p-5 rounded-3xl neu-flat flex flex-col gap-2">
              <h4 className="font-bold text-text-main dark:text-white">{job.title}</h4>
              <p className="text-xs font-bold text-primary uppercase tracking-widest">{job.company}</p>
              <p className="text-xs text-text-light line-clamp-2 mt-1">{job.description}</p>
           </div>
         ))}
         {allJobs.length === 0 && <p className="text-center text-text-light italic mt-10">No jobs found.</p>}
      </div>
    </div>
  );
};

export default DiscoveryTab;
