import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
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

export default app;
