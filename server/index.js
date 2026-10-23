import dotenv from 'dotenv';
import app from './app.js';
import { initDB } from './config/db.js';
import { bootstrapJobs } from './services/bootstrapService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Bootstrap (local / container mode; on AWS Lambda see lambda.js)
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SkillSync Backend Live on http://0.0.0.0:${PORT}`);
  });
  bootstrapJobs().catch((err) => console.error('❌ Job bootstrap failed:', err.message));
}).catch(err => {
  console.error('❌ Failed to bootstrap SkillSync:', err.message);
});
