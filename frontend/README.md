# Joule Zero Point - Frontend

Vue 3 + Vite + TypeScript client for Joule: Zero Point. Features a fully decentralized, client-side export engine for PDF architecture.

## Quick Start (Local)

Prerequisites: Node.js 24.x with npm 10+.

1. Prepare backend environment:

```bash
cp ../backend/.env.example ../backend/.env
```

2. In `../backend/.env`, configure at least:

- `MONGODB_URI`
- `OPENAI_API_KEY`
- `JWT_SECRET`

3. Install dependencies:

```bash
cd ../backend && npm install
cd ../frontend && npm install
```

4. Start backend and frontend in separate terminals:

```bash
cd ../backend && npm start
cd ../frontend && npm run dev --host
```

Default frontend URL: `http://localhost:5174`

## Build and Preview

```bash
npm run build
npm run preview
```

## Test Commands

```bash
npm run test
npm run test:coverage
npm run test:e2e
```

## Notes

- API traffic is proxied through Vite (`/api` -> backend on port `3000`) during local development.
- **Client-side Synthesis**: All PDF and Tabletop Simulator (TTS) assets are generated in-memory using `jsPDF` and `JSZip`. This ensures zero server load and enhanced user privacy.
- Chat-related backend tuning variables (optional):
  - `CHAT_MAX_MESSAGE_LENGTH` (default: `1200`)
  - `CHAT_RATE_WINDOW_MS` (default: `60000`)
  - `CHAT_RATE_MAX_REQUESTS` (default: `12`)
