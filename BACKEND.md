# SkillSync Backend Documentation

The SkillSync backend is a robust node.js server designed to power a modern, agentic job-matching ecosystem. It leverages advanced AI models for semantic searching, roadmap generation, and automated resume optimization, all while maintaining a high-performance edge database using Turso (LibSQL).

---

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: [Express.js (v5)](https://expressjs.com/)
- **Database**: [Turso / LibSQL](https://turso.tech/) (SQLite for the Edge)
- **AI Integration**: Google Gemini API (via custom services)
- **Vector Search**: Native LibSQL Vector Indexing (3072 dimensions)
- **Middleware**: 
  - `cors`: Cross-Origin Resource Sharing
  - `express.json()`: JSON payload parsing
  - Custom Request Logger: Detailed console logging for requests and payloads

---

## 📂 Architecture Overview

The backend follows a modular service-oriented architecture:

```text
server/
├── config/        # Database and configuration setup
├── routes/        # API endpoint definitions
├── services/      # Core business logic and AI agents
├── scripts/       # Data seeding and migration scripts
└── index.js       # Entry point and middleware assembly
```

---

## 📡 API Endpoints

### 1. Resume & Matching
- **`POST /api/upload`**
  - **Purpose**: Processes resume text and finds the top 15 matching jobs.
  - **Logic**: Uses `matchService.js` to generate embeddings and perform a vector search in Turso.
  - **Payload**: `{ "resumeText": "..." }`

### 2. Job Discovery
- **`GET /api/jobs`**
  - **Purpose**: Retrieve all jobs or search via keyword.
  - **Query Params**: `?q=search_term`
- **`GET /api/history`**
  - **Purpose**: Fetch the last 50 processed scans.
- **`POST /api/history`**
  - **Purpose**: Persist a scan result (summary, top match, score).

### 3. Agentic & AI Features
- **`POST /api/agent`**
  - **Purpose**: Interactive agentic chat. Allows users to ask questions like "Why am I a 60% match?" or "What should I change in my resume?".
  - **Service**: `agentService.js`

- **`POST /api/roadmap`**
  - **Purpose**: Generates a structured learning roadmap (Milestones, Resources, Timeline) based on missing skills.
  - **Service**: `aiService.js`

- **`POST /api/optimize`**
  - **Purpose**: Rewrites specific sections of a resume to better align with a target job description.
  - **Service**: `aiService.js`

---

## 🧠 Core Services

### `matchService.js`
Responsible for the "Hybrid Match" pipeline:
1. Converts resume text into a **3072-dimension vector**.
2. Executes a `vector_top_k` query against the `jobs_idx`.
3. Calculates detailed compatibility metrics.

### `aiService.js`
The engine for generative features:
- **Roadmap Generation**: Creates JSON-structured learning paths.
- **Resume Optimization**: Analyzes job descriptions and suggests impactful changes to resume bullet points.

### `agentService.js`
Orchestrates complex multi-turn logic where the AI acts as a "Career Coach," utilizing the context of both the resume and the database to provide personalized advice.

---

## 🗄 Database Schema

The backend interacts primarily with two tables:

1. **`jobs`**: Stores job titles, descriptions, and their corresponding AI vectors.
   - *Key Column*: `embedding F32_BLOB(3072)`
2. **`scan_history`**: Audit log of all resume matches performed.
   - *Key Columns*: `resume_summary`, `top_match_title`, `match_score`, `created_at`.

> [!NOTE]
> For detailed SQL structure and migration logic, see [DB_ARCHITECTURE.md](file:///c:/Users/KUNJ%20AGARWAL/Desktop/dbms%20app/DB_ARCHITECTURE.md).

---

## 🚀 Getting Started

### Prerequisites
- Node.js installed.
- A Turso database URL and Auth Token.
- A Gemini API Key.

### Environment Setup
Create a `.env` file in the `server/` directory:
```env
PORT=5000
TURSO_DATABASE_URL=your_url
TURSO_AUTH_TOKEN=your_token
GEMINI_API_KEY=your_key
```

### Running the Server
```bash
# Install dependencies
npm install

# Start in development mode (with --watch)
npm run dev

# Start in production mode
npm start
```

The API will be live at `http://localhost:5000`.
