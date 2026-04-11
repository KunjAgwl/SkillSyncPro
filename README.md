<div align="center">

<!-- 🌟 MAGNIFICENT HERO SECTION 🌟 -->
<br />
<img src="C:\Users\KUNJ%20AGARWAL\.gemini\antigravity\brain\aef8b070-9371-4acd-a5d5-319da04fb9c2\signature_avdhi_kunj_1775890557295.png" width="450px" />
<br />
<p align="center">
  <img src="https://raw.githubusercontent.com/andreasbm/readme/master/assets/lines/cloudy.png" width="100%">
</p>

<br />

![SkillSync Branding](C:\Users\KUNJ%20AGARWAL\.gemini\antigravity\brain\aef8b070-9371-4acd-a5d5-319da04fb9c2\skillsync_branding_preview_1775890335438.png)

# 💎 SkillSync 
### *Career Intelligence Engine*

[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Backend-Express-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![Turso](https://img.shields.io/badge/Database-Turso-00A98F?style=for-the-badge&logo=sqlite)](https://turso.tech/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

**SkillSync** is a premium, AI-powered Career Intelligence Engine that bridges the gap between your talent and the industry's most relevant opportunities. Designed with a **Neumorphic (Soft UI)** aesthetic, it offers a tactile, modern experience for job seekers and career builders.

</div>

---

## ✨ Key Features

### 🎯 Precision Matching
- **Semantic Vector Search**: Uses **3072-dimensional embeddings** to match your resume against thousands of jobs based on *meaning*, not just keywords.
- **Skill Boosting**: Dynamically adjust weights for specific skills to see how "upskilling" changes your compatibility in real-time.

### 🤖 Agentic Career Coach
- **AI Concierge**: An interactive agent that understands your professional profile.
- **Deep Insights**: Ask why you were matched, what's missing, or how to pivot your career path.

### 🗺️ Intelligent Roadmaps
- **Gap Analysis**: Identifies exactly which skills are keeping you from your dream job.
- **Curated Learning**: Generates structured milestones, specific resources, and realistic timelines to bridge those gaps.

### 📝 Resume Optimization
- **Context-Aware Rewriting**: Automatically rewrites your resume bullet points to better align with specific job descriptions.
- **Impact Maximization**: Focuses on quantifying achievements and highlighting relevant tech stacks.

### 📱 PWA & Mobile Native
- **Cross-Platform**: Built with **Capacitor** for a seamless mobile experience.
- **Haptic Feedback**: Tactile responses for every major interaction, creating a premium "app-like" feel.

---

## 🎨 Design Philosophy: Neumorphism

SkillSync embraces the **Neumorphic** design trend, focusing on soft shadows, organic shapes, and a "tactile" interface.

- **Primary Accent**: `#E2B96E` (Champagne Gold)
- **Atmospheric Shadows**: Dual-tone shadows that create depth on a light or dark canvas.
- **Interactive States**: Buttons that "press" into the UI and cards that float with elegance.

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    User((User)) -->|Upload Resume| Frontend[React PWA]
    Frontend -->|POST /upload| Backend[Express API]
    Backend -->|Text Chunking| Gemini[Google Gemini AI]
    Gemini -->|3072D Vector| Backend
    Backend -->|Vector Search| Turso[(Turso LibSQL)]
    Turso -->|Top 15 Matches| Backend
    Backend -->|JSON Payload| Frontend
```

---

## 🛠️ Tech Stack

- **Frontend**: Vite + React + Tailwind CSS (Custom Neumorphic Utilities)
- **Backend**: Node.js + Express.js
- **Database**: Turso (LibSQL) with Native Vector Support
- **AI**: Google Gemini Pro (Text & Embeddings)
- **Mobile**: Capacitor.js
- **Icons**: Google Material Symbols

---

## 🚀 Getting Started

Check out the detailed documentation for each layer:

- 🏗️ **[Backend Guide](BACKEND.md)**: Routes, Services, and AI Pipelines.
- 🗄️ **[Database Guide](DB_ARCHITECTURE.md)**: Vector schema and SQL indexing.

