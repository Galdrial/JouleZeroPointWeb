# Analisi Completa — Joule: Zero Point

## Context

Analisi esaustiva del progetto full-stack (Vue 3 + Express + MongoDB) d'esame start2impact.
Richiesta: leggere tutti i file, dare un giudizio e identificare migliorie.
Il `CONTEXT.md` in root è stato predisposto per salvare il contesto al termine della sessione.

L'esplorazione è stata fatta in parallelo da 3 agent Explore su: backend, frontend, infra/docs.

---

## Giudizio complessivo

Il progetto è **conforme al 100% ai requisiti d'esame** (auth, REST API, SPA, test, docs) e mostra buona architettura (separazione responsabilità, moderne dipendenze, GDPR export, PWA, rate limiting, helmet, caching card).

**Voto sintetico**: Backend **6.2/10**, Frontend **7.0/10**, Infra **7.5/10** — penalizzato da **criticità di sicurezza** e da due view monolitiche.

**Punti forti**:
- Architettura e naming coerenti; stack moderno (Vue 3.5, Express 5, Mongoose 9)
- Sicurezza di base implementata (helmet, mongo-sanitize, hpp, bcrypt, JWT, validator, rate-limit)
- Caching card lato service, code splitting, PWA, SSE streaming con protezione prompt injection
- Documentazione tecnica (`docs/TECHNICAL_DEEP_DIVE.md`) e compliance matrix completi
- Docker multi-stage, CI presente

**Debolezze principali**:
- Secrets reali nel filesystem (`backend/.env`) + MongoDB esposto in Docker
- Endpoint AI `POST /terminal/chat` pubblico senza auth
- Token JWT in `localStorage` + `CSP` con `unsafe-eval`
- `DeckbuilderView.vue` (2896 righe) e `HomeView.vue` (1447 righe) monolitici
- Coverage test insufficiente (~15% backend, ~35% frontend)
- nginx senza gzip, security headers, cache

---

## File critici identificati

### Backend
- [backend/.env](backend/.env) — **ruotare tutti i secrets**
- [backend/src/routes/terminalRoutes.ts:25](backend/src/routes/terminalRoutes.ts#L25) — aggiungere `protect`
- [backend/src/services/aiService.ts:280](backend/src/services/aiService.ts#L280) — try/catch su `JSON.parse`
- [backend/src/controllers/authController.ts:123-129](backend/src/controllers/authController.ts#L123-L129) — user enumeration
- [backend/src/app.ts:86](backend/src/app.ts#L86) — CSP `unsafe-eval`
- [backend/src/controllers/deckController.ts:36](backend/src/controllers/deckController.ts#L36) — regex injection
- [backend/src/models/User.ts:53-55](backend/src/models/User.ts#L53-L55) — TTL mancante sui token
- [backend/src/middleware/authMiddleware.ts:15](backend/src/middleware/authMiddleware.ts#L15) — bounds check split header

### Frontend
- [frontend/src/stores/auth.ts:11](frontend/src/stores/auth.ts#L11) — token in localStorage
- [frontend/src/utils/api.ts:30](frontend/src/utils/api.ts#L30) — `x-user` non sanitizzato
- [frontend/src/views/DeckbuilderView.vue](frontend/src/views/DeckbuilderView.vue) — 2896 righe da splittare
- [frontend/src/views/HomeView.vue](frontend/src/views/HomeView.vue) — 1447 righe
- [frontend/src/stores/notificationStore.ts:41-43](frontend/src/stores/notificationStore.ts#L41-L43) — timeout leak

### Infrastruttura
- [docker-compose.yml](docker-compose.yml) — MongoDB esposto `27017`, no healthcheck, no restart
- [frontend/nginx.conf](frontend/nginx.conf) — no gzip, no security headers, no cache
- [.github/workflows/ci.yml](.github/workflows/ci.yml) — no docker build, no lint
- [info.txt](info.txt) — 186KB di materiale didattico da rimuovere
- [users.sqlite](users.sqlite) — schema SQLite vuoto, non dovrebbe essere in root
- [crontab.bak](crontab.bak) — path hardcoded, script backup non nel repo

---

## Problemi per severity

### 🔴 Critici (fix immediato — sicurezza)

| # | Area | File:riga | Problema | Fix |
|---|------|-----------|----------|-----|
| 1 | Secrets | `backend/.env` | OpenAI key, Mongo URI, SMTP pass, JWT secret reali sul filesystem (già in `.gitignore`, ma da ruotare) | Ruotare OpenAI, MongoDB Atlas, IONOS SMTP |
| 2 | Auth | `routes/terminalRoutes.ts:25` | `POST /chat` pubblico → abuso OpenAI illimitato | Aggiungere `protect` middleware |
| 3 | DoS | `services/aiService.ts:280` | `JSON.parse(tc.function.arguments)` senza try/catch | Wrap in try/catch con 400 |
| 4 | XSS | `stores/auth.ts:11` | JWT in `localStorage` | Spostare in cookie httpOnly+Secure+SameSite (richiede modifiche BE) |
| 5 | Auth | `controllers/authController.ts:123-129` | User enumeration (404 vs 401) | Risposta identica "Credenziali non valide" |
| 6 | XSS | `app.ts:86` | CSP con `unsafe-eval` + `unsafe-inline` | Rimuovere in prod, gate via NODE_ENV |
| 7 | Injection | `controllers/deckController.ts:36`, `services/aiService.ts:162` | Regex input-controlled (ReDoS/bypass) | Escape `[.*+?^${}()|[\]\\]` |
| 8 | Docker | `docker-compose.yml:33` | MongoDB `27017:27017` esposto pubblicamente | `127.0.0.1:27017:27017` o rimuovere |
| 9 | Nginx | `frontend/nginx.conf` | No gzip, no security headers, no cache | Aggiungere config completa |
| 10 | XSS | `utils/api.ts:30` | `x-user` header non sanitizzato | `DOMPurify.sanitize(username)` o validazione |

### 🟠 Alti

- `User.ts:53-55` — TTL index mancante su verificationToken/resetPasswordToken (token persistono in DB)
- `authController.ts:242-272` — reset password non chiede old password
- `DeckbuilderView.vue` (2896 righe) — splittare in 4 componenti (Dashboard/Editor/Exporter/Stats)
- `HomeView.vue` (1447 righe) — estrarre Hero/NewsGrid/DeckGallery
- `notificationStore.ts:41-43` — timeout non puliti su unmount (leak)
- `routes/cardRoutes.ts:29` — admin key in header invece di JWT role
- `.github/workflows/ci.yml` — mancano Docker build step, lint, coverage
- `docker-compose.yml` — mancano `restart: unless-stopped` e healthcheck su tutti i servizi
- `frontend/Dockerfile` + compose — `VITE_API_URL` non propagato via env_file al build
- `deckController.ts:142` — cards array senza validazione schema/lunghezza
- `newsController.ts:131` — `getAdminNews` senza paginazione

### 🟡 Medi

- 40+ `any` type nel frontend (API, viste)
- `Deck.ts:10,35` — `cards: any[]` Mixed, nessuno schema
- `Deck.ts:56` — array `votes: [String]` senza limite
- `parentDeckId` salvato come stringa invece di ObjectId (`deckController.ts:285`)
- Inconsistenza status HTTP (204 vs 200+JSON per DELETE)
- Duplicazione `vClickOutside` directive in 2 view → estrarre in `utils/directives.ts`
- Keyboard navigation/focus management assente
- ARIA labels insufficienti (solo ~21 occorrenze)
- Console.log/error in production (11 punti frontend, `seoController.ts:54` backend)
- Magic numbers (`DECK_SIZE = 40` hardcoded)
- `emailService.ts:60,103` — URL reset password loggato in plaintext
- Coverage test ~15% backend, ~35-40% frontend
- Register route modifica `to.query` in `beforeEnter` (anti-pattern)
- Nessuna log rotation Winston
- `authMiddleware.ts:15` — split token senza bounds check
- Mongo query di update profilo non valida unique username (`authController.ts:297`)

### 🟢 Bassi

- `sqlite3` dep inutilizzata; `@types/qs` in `dependencies` anziché devDeps
- Nessun `engines` in `package.json` (Node version)
- Express 5.x ancora giovane (valutare downgrade a ^4.18 per stabilità)
- `info.txt` 186KB di materiale didattico (già in gitignore, rimuovere dal filesystem)
- `users.sqlite` schema vuoto nella root (rimuovere)
- `crontab.bak` path hardcoded + script backup non committati
- README manca sezione Requirements e Troubleshooting
- LICENSE proprietaria OK, ma manca contatto per licensing commerciale
- `.gitignore` non esclude `backend/dist/` e `dist/` in root
- Font contrast su alcune combinazioni (magenta `#ff003c` su dark) sotto WCAG AAA
- Nessun dark/light mode toggle (solo dark hardcoded)
- `setTimeout` in HomeView per stagger visibility → usare `requestAnimationFrame`/IntersectionObserver

---

## Piano di intervento suggerito (a fasi)

### Fase 1 — Hardening sicurezza (1-2 giorni)
Interventi a basso rischio, alto impatto:
1. Ruotare tutti i secrets esposti (OpenAI, Mongo, SMTP) — azione esterna
2. Proteggere `/terminal/chat` con `protect`
3. Try/catch su `JSON.parse` in aiService
4. Unificare messaggio errore login (anti user-enumeration)
5. Escape regex input in search (deckController, aiService)
6. CSP: gate `unsafe-eval`/`unsafe-inline` dietro NODE_ENV
7. MongoDB bind a `127.0.0.1` in docker-compose
8. TTL index sui token utente

### Fase 2 — Infra & deploy (mezza giornata)
1. nginx: gzip, security headers (X-Frame-Options, X-Content-Type, Referrer-Policy), cache assets/index
2. docker-compose: `restart: unless-stopped` + healthcheck per ogni servizio
3. `env_file` per frontend + build-arg `VITE_API_URL`
4. CI: aggiungere job `docker build` e `eslint`
5. Log rotation Winston (`maxsize`, `maxFiles`)
6. Rimuovere `info.txt`, `users.sqlite`, `crontab.bak` dal filesystem + `backend/dist/` in gitignore

### Fase 3 — Refactor architetturale (2-3 giorni)
1. Splittare `DeckbuilderView.vue` → `DeckDashboard`/`DeckEditor`/`DeckExporter`/`DeckStatsPanel`
2. Splittare `HomeView.vue` → `HeroSection`/`NewsGrid`/`DeckGallery`
3. Estrarre `vClickOutside` in `utils/directives.ts`
4. Token JWT → cookie httpOnly (richiede refactor auth BE+FE)
5. Tipizzare `any` → interfacce (`SavedDeck`, `PublicDeck`, `ApiError`)
6. Error response standardizzata `ApiError { success, error, code, details }`
7. Validazione schema cards in deck (Zod/express-validator)

### Fase 4 — Qualità & accessibilità (ongoing)
1. Alzare coverage test backend a 60%+ (deckController, newsController, AI injection detection)
2. Alzare coverage frontend (DeckbuilderView logic, CardsView filtering)
3. ARIA labels + keyboard navigation + focus management
4. Rimuovere console.log in production (build-time stripping via vite)
5. Costanti domain (`DECK_SIZE`, limiti) in `constants/`
6. README: sezioni Requirements + Troubleshooting
7. Dark/light mode toggle con `prefers-color-scheme`

---

## Proposta contenuto `CONTEXT.md` (fine sessione)

```markdown
# Context

## Architettura
Full-stack Vue 3.5 (Vite + Pinia + Vue Router) + Express 5 + Mongoose 9 (MongoDB Atlas).
Deploy Docker Compose (backend, frontend, mongodb). PWA abilitata. AI Terminal via OpenAI + SSE.
Cloudinary per asset news. Winston dual-channel logging.

## Decisioni prese
- JWT stateless con `Authorization: Bearer`
- Caching in-memory card con TTL 600s (cardService)
- SSoT Google Sheets → TSV sync per catalogo card
- SEO: sitemap dinamico + robots.txt
- GDPR: export dati utente (Art. 20), privacy versioning
- Rate limit globale + limiter dedicato `/auth`

## File principali
- Backend: `app.ts`, `routes/*.ts`, `controllers/*.ts`, `services/aiService.ts`, `models/User.ts`, `models/Deck.ts`
- Frontend: `views/DeckbuilderView.vue` (da splittare), `stores/auth.ts`, `utils/api.ts`
- Infra: `docker-compose.yml`, `frontend/nginx.conf`, `.github/workflows/ci.yml`

## Prossimi step
(Dipende dalla fase scelta — vedi plan `vorrei-che-analizzassi-tutti-wobbly-starlight.md`)
```

---

## Verifica (per ciascuna fase)

- **Fase 1**: audit manuale (header auth su /terminal/chat), `npm test` backend, test fuzz su regex search, `openssl s_client` per CSP preview in browser
- **Fase 2**: `docker compose up --build`, `curl -I` per header nginx/gzip, `docker inspect` healthcheck
- **Fase 3**: `npm run test` + `npm run test:e2e`, `npm run build` size budget, review coverage
- **Fase 4**: `npm run test:coverage`, Lighthouse accessibility score >90, axe-core CI

---

## Scope concordato con l'utente

Risposta dell'utente:
- **Nessuna modifica al codice** in questa sessione — solo analisi diagnostica.
- **Unica azione operativa**: scrivere il contenuto proposto in `CONTEXT.md` nella root.

### Azione da eseguire all'uscita del plan mode

1. Sovrascrivere [CONTEXT.md](CONTEXT.md) con il blocco proposto sopra (sezione "Proposta contenuto `CONTEXT.md`"), che consolida architettura, decisioni prese, file principali e rimanda a questo piano per i prossimi step.

Nessun altro file verrà toccato. I refactor (Fase 1/2/3/4) restano documentati qui come riferimento per sessioni future.
