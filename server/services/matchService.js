import { client } from '../config/db.js';
import { generateEmbedding, generateRefinement } from './aiService.js';

export const processHybridMatch = async (resumeText) => {
  try {
    // Step 1: Generate Embedding
    const resumeVector = await generateEmbedding(resumeText);

    // Step 2: Semantic Search (Top 15 Jobs)
    const searchResult = await client.execute({
      sql: `SELECT d.id, d.title, d.company, d.description 
            FROM vector_top_k('jobs_idx', vector(?), 15) AS v
            JOIN jobs AS d ON d.rowid = v.id`,
      args: [JSON.stringify(resumeVector)]
    });

    const topJobs = searchResult.rows;
    if (topJobs.length === 0) throw new Error('No jobs found in database for search.');

    // Step 3: LLM Refinement
    const refinedData = await generateRefinement(resumeText, topJobs);

    // Merge AI refinement with original job data
    const finalMatches = refinedData.matches.map(m => {
      const job = topJobs.find(j => j.id === m.id);
      return {
        ...job,
        matchScore: m.match_score,
        matchedSkills: m.matched_skills,
        missingSkills: m.missing_skills
      };
    }).filter(m => m.title).sort((a, b) => b.matchScore - a.matchScore);

    return {
      parsedSkills: refinedData.user_skills,
      bestMatch: finalMatches[0],
      allMatches: finalMatches
    };

  } catch (err) {
    console.error('❌ Hybrid Matching Engine Error:', err.message);
    throw err;
  }
};
