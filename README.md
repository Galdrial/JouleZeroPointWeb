# JOULE: ZERO POINT

<p align="center">
  <img src="frontend/public/favicon.webp" width="128" alt="Joule: Zero Point Logo" />
</p>

<p align="center">
  <strong>"In the Zero Point, time is a weapon. Master the energy, shape reality."</strong><br />
  <em>A Cyberpunk Strategic Card Game with Advanced LLM Integration.</em>
</p>

<p align="center">
  <a href="https://www.joulezeropoint.com/">🌐 www.joulezeropoint.com</a>
</p>

---

## 🌌 Overview

**Joule: Zero Point** is more than just a card game: it is an immersive experience set in a dystopian future where the laws of physics have collapsed. Each player takes on the role of a **Constructor**, manipulating the flow of time across three distinct zones: **Past, Present, and Future**.

The beating heart of the project is the **Zero Point Terminal**, an AI-powered neural interface that assists players with lore retrieval, card statistics, and real-time rule arbitration.

---

## 🧪 Tech Stack

The project follows a **Decoupled Modern Web App** architecture:

### Frontend

- **Framework:** Vue 3 (Composition API)
- **Build Engine:** Vite + TypeScript
- **State Management:** Pinia
- **API Client:** Axios
- **Interface:** Vanilla CSS (Custom Design System with Cyberpunk/Dark Mode aesthetics)
- **Utilities:** Marked (Markdown Rendering), DOMPurify (HTML Sanitization)

### Backend

- **Runtime:** Node.js & Express
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI Engine:** OpenAI SDK (Gemini/GPT Integration)
- **Security:** Helmet, Rate Limiter, CORS Policy, NoSQL Injection Sanitizer
- **Logging:** Winston

---

## ✨ Key Features

- 🖥️ **Zero Point Terminal:** An AI-based Referee (LLM-driven) that dynamically responds to player queries while remaining in-character.
- 🎴 **Fragment Database:** A comprehensive library with advanced filters to explore the Set 5.0 cards.
- 🛠️ **Intuitive Deckbuilder:** Create, save, and manage your tactical decks directly from the browser.
- 📜 **Official Documentation:** Integrated Rulebook 5.0 and centralized communication hub (News & Lore).
- 🔐 **Identity System:** Secure authentication (JWT), email verification, and password recovery.

---

## 🚀 Local Installation

To run Joule on your local machine:

### 1. Cloning

```bash
git clone https://github.com/your-username/JouleZeroPointDev.git
cd JouleZeroPointDev
```

### 2. Backend Configuration

```bash
cd backend
npm install
# Create a .env file based on .env.example
npm run dev
```

### 3. Frontend Configuration

```bash
cd ../frontend
npm install
# Create a .env file with VITE_API_URL=http://localhost:3000/api/v1
npm run dev
```

---

## 🛡️ Resilience Architecture

Joule is engineered to handle the unstable nature of AI integrations:

- **Context Guard:** Automatic history truncation to prevent exceeding token limits.
- **Safety Post-Audit:** Outbound analysis to prevent "Prompt Leaks".
- **Recovery UX:** Integrated **Retry** mechanism that preserves user input upon communication error.

---

## 🚢 Deployment

The project is configured for:

- **Frontend:** Vercel / Netlify
- **Backend:** Render / Railway
- **Database:** MongoDB Atlas

---

## 📚 Documentation & Contribution Standards

- Contributor guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Language policy: English for code comments, docs, commits, and PRs.
- Comment policy: explain **why**, avoid redundant line-by-line commentary.

---

## 👤 Author

- **Simone Camerano** - _Design, Mechanics, and Lead Development_
- Registered on **Patamu Registry**, deposit number 284864.

---

<p align="center">
  <em>"Chaos is a weapon. Use it."</em>
</p>
