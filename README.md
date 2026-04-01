# JOULE: ZERO POINT

<p align="center">
  <img src="frontend/public/favicon.webp" width="128" alt="Joule: Zero Point Logo" />
</p>

<p align="center">
  <strong>"Nel Punto Zero, il tempo è un'arma. Padroneggia l'energia, modella la realtà."</strong><br />
  <em>Un Gioco di Carte Cyberpunk & Strategia Temporale con Integrazione LLM Avanzata.</em>
</p>

---

## 🌌 Overview

**Joule: Zero Point** è più di un semplice gioco di carte: è un'esperienza immersiva ambientata in un futuro distopico dove le leggi della fisica sono collassate. Ogni giocatore assume il ruolo di un **Costruttore**, manipolando il flusso del tempo in tre zone distinte: **Passato, Presente e Futuro**.

Il cuore pulsante del progetto è il **Terminale Punto Zero**, un'interfaccia neurale alimentata da intelligenza artificiale che assiste i giocatori nel recupero di lore, statistiche delle carte e risoluzione di dispute arbitrali in tempo reale.

---

## 🧪 Tech Stack

Il progetto segue un'architettura **Decoupled Modern Web App**:

### Frontend
- **Framework:** Vue 3 (Composition API)
- **Engine:** Vite + TypeScript
- **Store:** Pinia
- **Gestore API:** Axios
- **Interfaccia:** Vanilla CSS (Design System personalizzato con estetica Cyberpunk/Dark Mode)
- **Utility:** Marked (Markdown Rendering), DOMPurify (Sane HTML)

### Backend
- **Runtime:** Node.js & Express
- **Database:** MongoDB Atlas (Mongoose ODM)
- **AI Engine:** OpenAI SDK (Integrazione Gemini/GPT)
- **Sicurezza:** Helmet, Rate Limiter, CORS Policy, NoSQL Injection Sanitizer
- **Logging:** Winston

---

## ✨ Caratteristiche Principali

- 🖥️ **Terminale Punto Zero:** Un Arbitro IA (LLM-based) che risponde dinamicamente alle queries dei giocatori rimanendo in-character.
- 🎴 **Database Frammenti:** Una libreria completa con filtri avanzati per esplorare le carte del Set 5.0.
- 🛠️ **Deckbuilder Intuitivo:** Crea, salva e gestisci i tuoi mazzi tattici direttamente dal browser.
- 📜 **Hub Documentale:** Regolamento ufficiale 5.0 integrato e archivio news.
- 🔐 **Sistema di Identità:** Autenticazione sicura (JWT), verifica email e recupero password.

---

## 🚀 Installazione Locale

Per far girare Joule sulla tua macchina locale:

### 1. Clonazione
```bash
git clone https://github.com/tuo-username/JouleZeroPointDev.git
cd JouleZeroPointDev
```

### 2. Configurazione Backend
```bash
cd backend
npm install
# Crea un file .env partendo da .env.example
npm run dev
```

### 3. Configurazione Frontend
```bash
cd ../frontend
npm install
# Crea un file .env con VITE_API_URL=http://localhost:3000/api/v1
npm run dev
```

---

## 🛡️ Architettura della Resilienza

Joule è progettato per gestire scenari instabili tipici dell'IA:
- **Context Guard:** Troncamento automatico della cronologia per non eccedere i limiti di token.
- **Safety Post-Audit:** Analisi in uscita per prevenire "Prompt Leaks".
- **UX di Recupero:** Meccanismo di **Retry** integrato che preserva l'input in caso di errore.

---

## 🚢 Deployment

Il progetto è configurato per:
- **Frontend:** Vercel / Netlify
- **Backend:** Render / Railway
- **Database:** MongoDB Atlas

---

## 👤 Autore
- **Simone Camerano** - *Design, Meccaniche e Sviluppo*
- Progetto depositato su **Patamu Registry**, numero deposito 284864.

---

<p align="center">
  <em>"Il caos è un'arma. Usalo."</em>
</p>
