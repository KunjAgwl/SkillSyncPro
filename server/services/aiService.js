import { embedText, generateText, extractJSON } from './bedrock.js';

export const generateEmbedding = async (text) => {
  try {
    return await embedText(text);
  } catch (err) {
    console.error('❌ AI Embedding Service Error:', err.message);
    throw err;
  }
};

export const generateRefinement = async (resumeText, topJobs) => {
  try {
    const refinementPrompt = `
      [SYSTEM: JSON BRAIN ONLY. NO DISCOURSE. RESPONSE MUST BE A VALID JSON OBJECT.]
      
      ROLE: You are a Senior Technical Recruiter & Data Parser.
      TASK: 
      1. Extract all technical skills (languages, frameworks, DBs, tools) from the Resume.
      2. Analyze each job in the 'Jobs List' with these CRITERIA:
         - Technical Alignment (70% weight): Are core stack requirements met?
         - Experience Maturity (30% weight): Does the user meet/exceed required years?
      3. For each match, provide:
         - 'matched_skills': Skills found in BOTH resume and job.
         - 'missing_skills': Critical skills in job but NOT in resume.
         - 'match_score': Integer (0-100) based on weighted criteria.

      TARGET JSON SCHEMA:
      {
        "user_skills": ["List found skills"],
        "matches": [
          { "id": "integer", "matched_skills": [], "missing_skills": [], "match_score": 0-100 }
        ]
      }

      DATA TO MAP:
      Resume: ${resumeText}
      Jobs List:
      ${topJobs.map((j) => `[ID: ${j.id}] ${j.title} at ${j.company}: ${j.description}`).join('\n')}
      
      [FINAL REMINDER: ZERO TEXT OUTSIDE JSON. BEGIN NOW.]
    `;

    const aiText = await generateText(refinementPrompt, 'You are a professional technical recruiter. Return responses ONLY in valid JSON format.');
    return extractJSON(aiText);
  } catch (err) {
    console.error('❌ AI Refinement Error:', err.message);
    throw err;
  }
};

/**
 * AI SKILL BOOSTER - Generates a 5-step learning roadmap for missing skills
 */
export const generateRoadmap = async (missingSkills, userFeedback = '', resumeText = '') => {
  try {
    if (!missingSkills || missingSkills.length === 0) return null;

    const roadmapPrompt = `
      [SYSTEM: JSON BRAIN ONLY]
      ROLE: You are an expert Technical Mentor.
      TASK: Create a 5-step learning roadmap to master these missing skills: ${missingSkills.join(', ')}.
      
      USER RESUME CONTEXT:
      ${resumeText ? resumeText.substring(0, 1000) + '...' : 'No resume context provided.'}
      
      USER CONSTRAINTS/FEEDBACK: "${userFeedback || 'None provided'}"
      
      RULES:
      1. Each step must have a 'title', 'description', and 'estimated_time'.
      2. Steps must be in logical order (beginner to advanced).
      3. CRITICAL: Tailor the 'estimated_time' and 'description' based on the USER CONSTRAINTS and their existing RESUME CONTEXT.
      4. Return ONLY a JSON object.

      SCHEMA:
      {
        "skill_title": "Mastering ${missingSkills[0]} & More",
        "steps": [
          { "step": 1, "title": "...", "description": "...", "estimated_time": "..." }
        ]
      }
    `;

    return extractJSON(await generateText(roadmapPrompt, 'You are an expert technical mentor. Return responses ONLY in valid JSON format.'));
  } catch (err) {
    console.error('❌ Roadmap Error:', err.message);
    return null;
  }
};

/**
 * RESUME OPTIMIZER - Tailors a resume for a specific job description
 */
export const generateOptimization = async (resumeText, jobDescription) => {
  try {
    const optimizationPrompt = `
      [SYSTEM: JSON BRAIN ONLY]
      ROLE: You are an expert Resume Writer & Career Coach.
      TASK: Tailor the provided Resume to match the Job Description.
      
      CRITERIA:
      1. Identify keywords from the job description missing in the resume.
      2. Rewrite the professional summary to highlight relevant experience.
      3. For each major experience block, provide 3 "high-impact" bullet points using the STAR method (Situation, Task, Action, Result).
      
      USER RESUME: ${resumeText}
      TARGET JOB: ${jobDescription}

      SCHEMA:
      {
        "role_title": "Optimized Title",
        "new_summary": "Tailored 3-sentence summary",
        "optimized_experience": [
          { "company": "...", "bullets": ["Improved X by Y using Z", "..."] }
        ],
        "keywords_to_add": ["skill1", "skill2"],
        "resume_html": "A professional <html> string. CSS REQUIREMENTS: Use a TWO-COLUMN layout. SIDEBAR (250px, dark surface): Contact Info, Skills badges, Education. MAIN COLUMN: Bold Name, Optimized Title, Pro-Summary (modern italic), Experience blocks with clean dividers. FONTS: Inter, Segoe UI, sans-serif. COLORS: Background #ffffff, Accents #e2b96e (gold). STYLE: High-end minimalist recruiter-ready. Ensure 8.5x11in dimensions."
      }
    `;

    return extractJSON(await generateText(optimizationPrompt, 'You are an expert resume writer. Return responses ONLY in valid JSON format.'));
  } catch (err) {
    console.error('❌ Optimization Error:', err.message);
    return null;
  }
};
