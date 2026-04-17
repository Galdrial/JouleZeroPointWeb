<p align="center">
  <img src="frontend/public/favicon.webp" width="96" alt="Joule: Zero Point Logo" />
</p>

<h1 align="center">JOULE: ZERO POINT</h1>

<p align="center">
  <strong>"In the Zero Point, time is a weapon. Master the energy, shape reality."</strong><br />
  <em>A Cyberpunk Strategic Card Game with Advanced LLM Integration.</em>
</p>

<p align="center">
  <a href="https://www.joulezeropoint.com/">
    <img src="https://img.shields.io/badge/🌐_Live-joulezeropoint.com-00f2ff?style=for-the-badge&labelColor=0a0e1a" alt="Live Site" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?style=flat-square&logo=vuedotjs&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white" alt="OpenAI" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## 🌌 Overview

**Joule: Zero Point** is more than a card game — it's an immersive cyberpunk experience where the laws of physics have collapsed. Each player takes on the role of a **Constructor**, manipulating the flow of time across three distinct zones: **Past, Present, and Future**.

The beating heart of the project is the **Zero Point Terminal**, an AI-powered neural interface that assists players with lore retrieval, card statistics, and real-time rule arbitration — all while staying fully in-character.

---

## 🖼️ Screenshots

### 🏠 Home — The Zero Point Atmosphere
![Home](docs/screenshots/home.webp)

### 🖥️ Zero Point Terminal — AI Neural Interface
![Terminal](docs/screenshots/terminal.webp)

### 🎴 Fragment Database — Card Discovery
![Database](docs/screenshots/database.webp)

### 🛠️ Deckbuilder — Tactical Workshop
![Deckbuilder](docs/screenshots/deckbuilder.webp)

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🖥️ **Zero Point Terminal** | LLM-driven AI referee that responds in-character to player queries |
| 🎴 **Fragment Database** | Full card library with advanced type/stat filters |
| 🛠️ **Deckbuilder** | Create, save, and share tactical decks with Constructor hero |
| 📜 **Rulebook & Lore** | Integrated Rulebook 5.0 and News/Lore communication hub |
| 🔐 **Identity System** | JWT auth, email verification, alias management, password recovery |
| 📤 **Deck Export** | Client-side generation of PDFs and TTS kits (no backend dependency) |

---

## 🧪 Tech Stack

### Frontend
- **Framework:** Vue 3 (Composition API) + TypeScript
- **Build Engine:** Vite
- **State Management:** Pinia
- **API Client:** Axios
- **Synthesis Engine:** jsPDF (PDF) & JSZip (TTS)
- **Styling:** Vanilla CSS — custom cyberpunk design system (glassmorphism, dark mode)
- **Utilities:** Marked (Markdown), DOMPurify (sanitization)

### Backend
- **Runtime:** Node.js & Express
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI Engine:** OpenAI SDK (Gemini/GPT integration)
- **Security:** Helmet, Rate Limiter, CORS, NoSQL Injection Sanitizer
- **Logging:** Winston
- **Email:** Nodemailer (SMTP — verification, password reset)

---

## 🚀 Local Installation

### 1. Clone the repository

```bash
git clone https://github.com/Galdrial/JouleZeroPointWeb.git
cd JouleZeroPointWeb
```

### 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env   # Fill in your keys (see .env.example)
npm run dev
```

### 3. Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

> The frontend Vite proxy is pre-configured to forward `/api` calls to `http://localhost:3000`. No extra config needed for local dev.

---

## 🔐 Environment Variables

Copy `backend/.env.example` and fill in the required values:

| Variable | Description |
|---|---|
| `PORT` | Backend server port (default: `3000`) |
| `JWT_SECRET` | Secret key for signing JWTs |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `OPENAI_API_KEY` | OpenAI API key for the AI Terminal |
| `ASSISTANT_ID` | OpenAI Assistant ID |
| `SMTP_HOST / USER / PASS` | SMTP credentials for transactional email |
| `FRONTEND_URL` | Base URL for email links (e.g. `https://joulezeropoint.com`) |
| `ADMIN_KEY` | Secret key for admin news management |

---

## 🛡️ AI Resilience Architecture

The Zero Point Terminal is engineered for stability under unstable AI conditions:

- **Context Guard:** Automatic history truncation to prevent token limit overflows
- **Safety Post-Audit:** Outbound response analysis to prevent prompt leaks / out-of-character replies
- **Recovery UX:** Integrated Retry mechanism that preserves user input on communication error
- **Rate Limiting:** Per-IP request throttling to prevent AI API abuse

---

## 🚢 Deployment

| Layer | Platform |
|---|---|
| Frontend | Vercel (auto-deploy on `main`) |
| Backend | DigitalOcean (self-managed, Docker-ready) |
| Database | MongoDB Atlas |
| Media | Cloudinary |

---

## 📚 Contributing

- Contributor guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Language policy: **English** for all code comments, docs, commits, and PRs
- Comment policy: explain **why**, not what the code does line-by-line

---

## 👤 Author

**Simone Camerano** — Design, Mechanics & Lead Development

> Joule: Zero Point is registered on the **Patamu Registry** (deposit #284864).

---

<p align="center">
  <em>"Chaos is a weapon. Use it."</em>
</p>
