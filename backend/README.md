# Joule Zero Point - Backend

Backend Express per autenticazione, gestione mazzi e Terminale AI.

## Setup locale

1. Crea il file env:

```bash
cp .env.example .env
```

2. Compila le variabili minime in `.env`:

- `OPENAI_API_KEY`
- `ASSISTANT_ID`
- `JWT_SECRET`

3. Installa dipendenze e avvia:

```bash
npm install
node server.js
```

Server di default: `http://localhost:3000`

## Variabili ambiente

Obbligatorie:

- `OPENAI_API_KEY`
- `ASSISTANT_ID`
- `JWT_SECRET`

Opzionali:

- `PORT` (default `3000`)
- `SHEETS_URL` (override sorgente carte)
- `CHAT_MAX_MESSAGE_LENGTH` (default `1200`)
- `CHAT_RATE_WINDOW_MS` (default `60000`)
- `CHAT_RATE_MAX_REQUESTS` (default `12`)

## API principali

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/search?q=...&current=...`
- `DELETE /api/auth/account/:username`

### Carte

- `GET /api/cards`

### Mazzi

- `GET /api/decks`
- `POST /api/decks`
- `DELETE /api/decks/:id`
- `DELETE /api/decks/user/:username`

### Community

- `GET /api/public-decks`
- `POST /api/decks/:id/vote`
- `POST /api/decks/:id/import`

### Terminale AI

- `POST /api/chat`

Body tipico:

```json
{
  "message": "testo utente",
  "threadId": "thread_xxx_opzionale"
}
```

## Header usati

- `x-user`: richiesto per endpoint che dipendono dall'utente (voto/import/filtro personalizzato).

## Note deploy

- Non committare mai `.env`.
- In produzione imposta le secret nel provider (Render, Railway, VPS, ecc.).
- Ruota `OPENAI_API_KEY` se è stata esposta in log/screenshot.
- Valuta CORS restrittivo (ora è aperto) e rate limit anche a livello reverse proxy.
