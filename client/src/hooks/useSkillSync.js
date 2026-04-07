import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

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

  // Fetch initial data & Heartbeat check
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const host = window.location.hostname || 'localhost';
        const response = await fetch(`http://${host}:5000/`);
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
      const response = await fetch(`http://${window.location.hostname}:5000/api/history`);
      const data = await response.json();
      setHistory(data);
    } catch (err) { console.error('History fetch error:', err); }
  };

  const fetchDiscoverJobs = async (query = '') => {
    try {
      const response = await fetch(`http://${window.location.hostname}:5000/api/jobs?q=${query}`);
      const data = await response.json();
      setAllJobs(data);
    } catch (err) { console.error('Jobs fetch error:', err); }
  };

  const saveToHistory = async (match) => {
    try {
      await fetch(`http://${window.location.hostname}:5000/api/history`, {
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

    setIsUploading(true);
    console.log('📄 Starting upload for:', file.name);

    try {
      // 1. PDF Parsing
      console.log('🔍 Extracting PDF text...');
      const text = await extractTextFromPDF(file);
      if (!text || text.length < 10) throw new Error('PDF is empty or could not be read.');
      setResumeText(text);

      // 2. Network Request
      const host = window.location.hostname || 'localhost';
      const apiUrl = `http://${host}:5000/api/upload`;
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

    // 1. Add user message
    const userMsg = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMsg]);
    setIsAgentThinking(true);

    try {
      const host = window.location.hostname || 'localhost';
      const response = await fetch(`http://${host}:5000/api/agent`, {
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
      setMessages(prev => [...prev, agentMsg]);

    } catch (err) {
      console.error('Agent failure:', err);
      setMessages(prev => [...prev, { role: 'agent', content: "Sorry, I had trouble querying the database.", results: [] }]);
    } finally {
      setIsAgentThinking(false);
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
    isAgentThinking
  };
};

export default useSkillSync;
