import express from 'express';
import { query } from '../config/db.js';
import { processHybridMatch } from '../services/matchService.js';
import { executeAgentRequest } from '../services/agentService.js';
import { generateRoadmap, generateOptimization } from '../services/aiService.js';

const router = express.Router();

// 🟢 Resume Upload & Match
router.post('/upload', async (req, res) => {
  const { resumeText } = req.body;
  if (!resumeText) return res.status(400).json({ error: 'No resume text provided.' });

  try {
    const matchResults = await processHybridMatch(resumeText);
    res.json(matchResults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Job Discovery (Browse/Search)
router.get('/jobs', async (req, res) => {
  const { q } = req.query;
  try {
    let sql = 'SELECT id, title, company, description, skills FROM jobs';
    let args = [];
    if (q) {
      sql += ' WHERE title ILIKE $1 OR company ILIKE $1 OR description ILIKE $1';
      args = [`%${q}%`];
    }
    res.json(await query(sql, args));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Scan History (Retrieval)
router.get('/history', async (req, res) => {
  try {
    res.json(await query('SELECT * FROM scan_history ORDER BY created_at DESC LIMIT 50'));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Scan History (Persistence)
router.post('/history', async (req, res) => {
  const { resumeSummary, topMatchTitle, topMatchCompany, matchScore } = req.body;
  try {
    await query(
      `INSERT INTO scan_history (resume_summary, top_match_title, top_match_company, match_score)
       VALUES ($1, $2, $3, $4)`,
      [resumeSummary, topMatchTitle, topMatchCompany, matchScore]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 Smart Agentic Query
router.post('/agent', async (req, res) => {
  const { prompt, resumeText } = req.body;
  if (!prompt) return res.status(400).json({ error: 'No prompt provided.' });

  try {
    const agentResponse = await executeAgentRequest(prompt, resumeText);
    res.json(agentResponse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 AI Roadmap Generator
router.post('/roadmap', async (req, res) => {
  const { missingSkills, userFeedback, resumeText } = req.body;
  if (!missingSkills || missingSkills.length === 0) {
    return res.status(400).json({ error: 'No missing skills provided.' });
  }

  try {
    const roadmap = await generateRoadmap(missingSkills, userFeedback, resumeText);
    res.json(roadmap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🟢 AI Resume Optimizer
router.post('/optimize', async (req, res) => {
  const { resumeText, jobDescription } = req.body;
  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Resume text and job description are required.' });
  }

  try {
    const optimizedData = await generateOptimization(resumeText, jobDescription);
    res.json(optimizedData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
