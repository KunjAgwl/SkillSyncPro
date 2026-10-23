import React, { useState, useRef, useEffect } from 'react';

const AgentTab = ({ messages, sendMessageToAgent, isAgentThinking, triggerHaptic }) => {
  const [input, setInput] = useState('');
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentThinking]);

  const handleSend = () => {
    if (!input.trim()) return;
    triggerHaptic();
    sendMessageToAgent(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-280px)] lg:h-[calc(100vh-140px)] lg:max-w-3xl lg:mx-auto lg:w-full animate-fade-in relative">
      
      {/* Messaging Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-20 no-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            
            {/* Agent Thought (Reasoning) */}
            {msg.thought && (
              <div className="flex items-center gap-1 mb-1 ml-4 opacity-50">
                <span className="material-symbols-outlined text-[10px]">psychology</span>
                <p className="text-[9px] font-bold uppercase tracking-tighter italic">{msg.thought}</p>
              </div>
            )}

            <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-3xl ${
              msg.role === 'user' 
                ? 'neu-button text-primary font-medium' 
                : 'neu-flat text-text-main dark:text-gray-200'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>

            {msg.results && msg.results.length > 0 ? (
              <div className="mt-4 w-full space-y-3">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest pl-2">AI Results Found</p>
                <div className="flex flex-col gap-2">
                  {msg.results.slice(0, 3).map((res, j) => {
                    // Try to extract standard job fields
                    const jobTitle = res.title || res.top_match_title;
                    const jobCompany = res.company || res.top_match_company;

                    // If it's a standard job return, render the beautiful Job Card
                    if (jobTitle || jobCompany) {
                      return (
                        <div key={j} className="p-3 rounded-2xl neu-flat bg-surface-light/30 border border-primary/5 hover:border-primary/20 transition-all">
                           <p className="text-xs font-bold text-text-main">{jobTitle || 'Database Entry'}</p>
                           {jobCompany && <p className="text-[10px] text-text-light mt-0.5">{jobCompany}</p>}
                        </div>
                      );
                    }

                    // Otherwise, render generic Database rows beautifully (e.g., for COUNT(*) queries)
                    const genericEntries = Object.entries(res).filter(([k]) => k !== 'description');
                    return (
                      <div key={j} className="p-3 rounded-2xl neu-flat bg-surface-light/30 border border-primary/5 flex flex-wrap gap-2">
                         {genericEntries.map(([key, val], idx) => (
                           <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/5">
                             <span className="text-[9px] text-text-light font-bold uppercase tracking-wider">{key}:</span>
                             <span className="text-xs text-text-main font-medium">{String(val)}</span>
                           </div>
                         ))}
                      </div>
                    );
                  })}
                  {msg.results.length > 3 && (
                    <p className="text-[10px] text-center text-text-light italic">And {msg.results.length - 3} more...</p>
                  )}
                </div>
              </div>
            ) : msg.sql ? (
              <div className="mt-4 w-full space-y-3">
                 <p className="text-[10px] font-black text-text-light uppercase tracking-widest pl-2">AI Results Found</p>
                 <div className="p-3 rounded-2xl neu-flat bg-surface-light/30 border border-primary/5">
                    <p className="text-xs font-bold text-text-light italic">No matching records found in the database.</p>
                 </div>
              </div>
            ) : null}
          </div>
        ))}
        
        {isAgentThinking && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="p-4 rounded-3xl neu-flat bg-primary/5 text-primary">
              <span className="material-symbols-outlined animate-spin text-sm">sync</span>
              <span className="ml-2 text-xs font-bold uppercase tracking-widest">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={chatEndRef} />
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-2 left-0 right-0 px-2">
        <div className="flex items-center gap-3 p-2 rounded-full neu-flat bg-surface-light dark:bg-surface-dark">
          <input 
            type="text" 
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-2 text-sm text-text-main placeholder:text-text-light"
            placeholder="Talk to SkillSync Intelligence..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            disabled={isAgentThinking}
            className="size-10 rounded-full bg-primary text-white shadow-[0_4px_12px_rgba(226,185,110,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentTab;
