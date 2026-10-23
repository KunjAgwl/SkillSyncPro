import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import apiRoutes from './routes/api.js';
import { bootstrapJobs } from './services/bootstrapService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// 📡 Global Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`\n[${new Date().toISOString()}] 📡 ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Payload:`, JSON.stringify(req.body).substring(0, 100) + (JSON.stringify(req.body).length > 100 ? '...' : ''));
  }
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api', apiRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('🚀 SkillSync API: Modular & Agentic - Operational');
});

// Bootstrap
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 SkillSync Backend Live on http://0.0.0.0:${PORT}`);
  });
  bootstrapJobs().catch((err) => console.error('❌ Job bootstrap failed:', err.message));
}).catch(err => {
  console.error('❌ Failed to bootstrap SkillSync:', err.message);
});
