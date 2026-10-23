import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Configure a stable PDF.js worker version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const useSkillSync = () => {
  const [activeTab, setActiveTab] = useState('match');
  const [isUploading, setIsUploading] = useState(false);
  const [matchData, setMatchData] = useState(() => {
    const saved = localStorage.getItem('ss_matchData');
    return saved ? JSON.parse(saved) : null;
  });
  const [resumeText, setResumeText] = useState(() => {
    return localStorage.getItem('ss_resumeText') || '';
  });
  const [history, setHistory] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roadmap, setRoadmap] = useState(null); // Roadmaps are session-specific
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  const [targetSkills, setTargetSkills] = useState(null);
  const [optimizationData, setOptimizationData] = useState(() => {
    const saved = localStorage.getItem('ss_optimizationData');
    return saved ? JSON.parse(saved) : null;
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // 💾 PERSISTENCE SYNC
  useEffect(() => {
    if (matchData) localStorage.setItem('ss_matchData', JSON.stringify(matchData));
    if (resumeText) localStorage.setItem('ss_resumeText', resumeText);
    if (optimizationData) localStorage.setItem('ss_optimizationData', JSON.stringify(optimizationData));
  }, [matchData, resumeText, optimizationData]);

  // 📳 Haptic Helper
  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {}
  };

  // Same-origin: CloudFront routes /api/* to the AWS Lambda API (override with VITE_API_URL for local dev)
  const BASE_API_URL = import.meta.env.VITE_API_URL ?? '';

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${BASE_API_URL}/api/history`);
        if (response.ok) console.log('💓 SkillSync Backend: CONNECTED');
      } catch (err) {
        console.error('❌ SkillSync Backend: UNREACHABLE');
      }
    };

    checkConnection();
    fetchHistory();
    fetchDiscoverJobs();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/history`);
      const data = await response.json();
      setHistory(data);
    } catch (err) { console.error('History fetch error:', err); }
  };

  const fetchDiscoverJobs = async (query = '') => {
    try {
      const response = await fetch(`${BASE_API_URL}/api/jobs?q=${query}`);
      const data = await response.json();
      setAllJobs(data);
    } catch (err) { console.error('Jobs fetch error:', err); }
  };

  const saveToHistory = async (match) => {
    try {
      await fetch(`${BASE_API_URL}/api/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeSummary: match.parsedSkills.slice(0, 5).join(', '),
          topMatchTitle: match.bestMatch.title,
          topMatchCompany: match.bestMatch.company,
          matchScore: match.bestMatch.matchScore
        })
      });
      fetchHistory();
    } catch (err) { console.error('History save error:', err); }
  };

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map(item => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    triggerHaptic(ImpactStyle.Medium);
    setIsUploading(true);
    
    // Clear old data for fresh start
    setOptimizationData(null);
    localStorage.removeItem('ss_optimizationData');

    try {
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 10) throw new Error('PDF is empty or could not be read.');
      setResumeText(text);

      const response = await fetch(`${BASE_API_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text })
      });

      const data = await response.json();
      triggerHaptic(ImpactStyle.Heavy);
      setMatchData(data);
      saveToHistory(data);
    } catch (err) {
      console.error('❌ Upload Error:', err);
      alert(`SkillSync Error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const [messages, setMessages] = useState([
    { role: 'agent', content: "Hello! I am your SkillSync Agent. Ask me anything about our jobs!", results: [] }
  ]);
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  const sendMessageToAgent = async (prompt) => {
    if (!prompt.trim()) return;
    triggerHaptic(ImpactStyle.Light);
    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setIsAgentThinking(true);

    try {
      const response = await fetch(`${BASE_API_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, resumeText })
      });
      const data = await response.json();
      triggerHaptic(ImpactStyle.Medium);
      setMessages(prev => [...prev, {
        role: 'agent',
        content: data.message,
        thought: data.thought,
        results: data.results || [],
        sql: data.sql
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, I had trouble querying the database." }]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  const fetchRoadmap = async (missingSkills, userFeedback = '') => {
    if (!missingSkills || missingSkills.length === 0) return;
    triggerHaptic(ImpactStyle.Medium);
    setIsRoadmapLoading(true);
    try {
      const response = await fetch(`${BASE_API_URL}/api/roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missingSkills, userFeedback, resumeText })
      });
      const data = await response.json();
      setRoadmap(data);
      triggerHaptic(ImpactStyle.Heavy);
    } catch (err) {
      console.error('Roadmap error:', err);
    } finally {
      setIsRoadmapLoading(false);
    }
  };

  const boostSpecificSkill = (skill) => {
    triggerHaptic(ImpactStyle.Light);
    setRoadmap(null);
    setTargetSkills([skill]);
    setActiveTab('courses');
  };

  const optimizeResume = async (jobDescription) => {
    if (!resumeText || !jobDescription) return;
    triggerHaptic(ImpactStyle.Medium);
    setIsOptimizing(true);
    try {
      const response = await fetch(`${BASE_API_URL}/api/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, jobDescription })
      });
      const data = await response.json();
      setOptimizationData(data);
      triggerHaptic(ImpactStyle.Heavy);
      setActiveTab('resume');
    } catch (err) {
      console.error('Optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    isUploading,
    matchData,
    resumeText,
    history,
    allJobs,
    searchQuery,
    setSearchQuery,
    fetchDiscoverJobs,
    handleFileUpload,
    messages,
    sendMessageToAgent,
    isAgentThinking,
    roadmap,
    isRoadmapLoading,
    fetchRoadmap,
    boostSpecificSkill,
    targetSkills,
    setTargetSkills,
    triggerHaptic,
    optimizeResume,
    optimizationData,
    isOptimizing,
    setOptimizationData
  };
};

export default useSkillSync;
