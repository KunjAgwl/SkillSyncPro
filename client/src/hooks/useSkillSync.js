import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Configure a stable PDF.js worker version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const useSkillSync = () => {
  const [activeTab, setActiveTab] = useState('match');
  const [isUploading, setIsUploading] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [history, setHistory] = useState([]);
  const [allJobs, setAllJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roadmap, setRoadmap] = useState(null);
  const [isRoadmapLoading, setIsRoadmapLoading] = useState(false);
  const [targetSkills, setTargetSkills] = useState(null);

  // 📳 Haptic Helper
  const triggerHaptic = async (style = ImpactStyle.Light) => {
    try {
      await Haptics.impact({ style });
    } catch (e) {
      // Fallback for web/non-capacitor
    }
  };

  // 🌍 BASE URL: Replace with your LIVE VERCEL URL after deployment!
  const BASE_API_URL = 'http://10.30.38.68:5000'; // Or your Vercel URL: https://skillsync.vercel.app

  // Fetch initial data & Heartbeat check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${BASE_API_URL}/`);
        if (response.ok) {
          console.log('💓 SkillSync Backend: CONNECTED');
        } else {
          console.warn('⚠️ SkillSync Backend: REACHABLE BUT ERROR');
        }
      } catch (err) {
        console.error('❌ SkillSync Backend: UNREACHABLE. Is the server running?');
        alert('SkillSync Backend Unreachable. Please make sure you ran "node index.js" in the server folder.');
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
      fetchHistory(); // Refresh the list
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
    console.log('📄 Starting upload for:', file.name);

    try {
      // 1. PDF Parsing
      console.log('🔍 Extracting PDF text...');
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 10) throw new Error('PDF is empty or could not be read.');
      setResumeText(text);

      // 2. Network Request
      const apiUrl = `${BASE_API_URL}/api/upload`;
      console.log('📡 Sending request to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText: text })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }

      // 3. Response Processing
      const data = await response.json();
      console.log('✅ Match successful:', data);
      triggerHaptic(ImpactStyle.Heavy);
      setMatchData(data);
      saveToHistory(data);
    } catch (err) {
      console.error('❌ SkillSync Upload Error:', err);
      alert(`SkillSync Error: ${err.message}\n\nPlease check your server console for more details.`);
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
    // 1. Add user message
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setIsAgentThinking(true);

    try {
      const response = await fetch(`${BASE_API_URL}/api/agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, resumeText })
      });

      const data = await response.json();

      // 2. Add agent response
      const agentMsg = {
        role: 'agent',
        content: data.message,
        thought: data.thought,
        results: data.results || [],
        sql: data.sql
      };
      triggerHaptic(ImpactStyle.Medium);
      setMessages(prev => [...prev, agentMsg]);

    } catch (err) {
      console.error('Agent failure:', err);
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, I had trouble querying the database.", results: [] }]);
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
      console.error('Roadmap fetch error:', err);
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
    triggerHaptic
  };
};

export default useSkillSync;
