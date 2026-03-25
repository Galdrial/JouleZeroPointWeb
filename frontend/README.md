# Joule Zero Point - Frontend

## Setup locale rapido

1. Crea il file environment backend:

```bash
cp ../backend/.env.example ../backend/.env
```

2. Apri `../backend/.env` e imposta almeno:

- `OPENAI_API_KEY`
- `ASSISTANT_ID`
- `JWT_SECRET`

3. Installa dipendenze:

```bash
cd ../backend && npm install
cd ../frontend && npm install
```

4. Avvia backend e frontend in due terminali separati:

```bash
cd ../backend && node server.js
cd ../frontend && npm run dev --host
```

## Variabili chat opzionali

Nel file `../backend/.env` puoi regolare:

- `CHAT_MAX_MESSAGE_LENGTH` (default: `1200`)
- `CHAT_RATE_WINDOW_MS` (default: `60000`)
- `CHAT_RATE_MAX_REQUESTS` (default: `12`)
