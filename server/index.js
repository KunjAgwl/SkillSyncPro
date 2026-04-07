import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

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
}).catch(err => {
  console.error('❌ Failed to bootstrap SkillSync:', err.message);
});
