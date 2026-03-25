require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Autenticazione (Gestione Costruttori)
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);

// Terminale del Punto Zero (AI Oracolo)
const chatbotRoutes = require('./chatbot');
app.use('/api', chatbotRoutes);

const GOOGLE_SHEETS_CSV_URL = process.env.SHEETS_URL || 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4otsaVBcLkcGI4zdD8aBJn0nRah9mUrEG0BprARIMF0WdocEkPsBkK0n4v-Sdf70KnBGmI95nS7EG/pub?gid=1051449153&single=true&output=tsv';

function parseCSV(fileContent) {
  const lines = fileContent.split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map(h => h.trim());
  const cards = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = line.split('\t').map(v => v.trim());
    const data = {};
    headers.forEach((header, index) => {
      data[header] = values[index];
    });

    const cost_et = data['Costo_ET'] ? parseInt(data['Costo_ET'], 10) : null;
    const pep = data['PEP'] ? parseInt(data['PEP'], 10) : null;
    const rp = data['RP'] ? parseInt(data['RP'], 10) : null;

    const id = parseInt(data['ID'], 10);
    const card = {
      id: id,
      name: data['Nome'],
      type: data['Tipo'],
      status: data['Stato'],
      cost_et: isNaN(cost_et) ? null : cost_et,
      pep: isNaN(pep) ? null : pep,
      rp: isNaN(rp) ? null : rp,
      rarity: data['Rarità'],
      effect: data['Effetto'],
      role: data['Ruolo'],
      image_url: `/assets/cards/${String(id).padStart(3, '0')}_${(data['Nome'] || '').replace(/,/g, '').replace(/ /g, '_')}.png`
    };
    
    if (data['Nome']) {
      cards.push(card);
    }
  }
  return cards;
}

const fs = require('fs');
const path = require('path');
const DECKS_FILE = path.join(__dirname, 'decks.json');

app.get('/api/cards', async (req, res) => {
  try {
    const response = await axios.get(GOOGLE_SHEETS_CSV_URL);
    const liveCards = parseCSV(response.data);
    res.json(liveCards);
  } catch (error) {
    console.error('Errore nel fetch delle carte da Google Sheets:', error);
    res.status(500).json({ error: 'Errore durante la lettura della Matrice Dati (Server Error)' });
  }
});

// Gestione Mazzi
app.get('/api/decks', (req, res) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    const data = fs.readFileSync(DECKS_FILE, 'utf8');
    let decks = JSON.parse(data);
    
    // Filtro per creatore (obbligatorio per i mazzi privati)
    if (creator) {
      decks = decks.filter(d => d.creator === creator);
    }
    
    // Filtro ricerca testuale
    if (q) {
      const query = q.toLowerCase();
      decks = decks.filter(d => d.name.toLowerCase().includes(query));
    }
    
    // Filtro per Costruttore
    if (costruttoreId) {
      const cid = parseInt(costruttoreId);
      decks = decks.filter(d => d.costruttoreId === cid);
    }
    
    const total = decks.length;
    
    // Paginazione
    const start = (parseInt(page) - 1) * parseInt(limit);
    const end = start + parseInt(limit);
    const paginatedDecks = decks.slice(start, end);
    
    res.json({
      decks: paginatedDecks,
      total: total
    });
  } catch (error) {
    res.status(500).json({ error: 'Errore caricamento mazzi' });
  }
});

app.post('/api/decks', (req, res) => {
  try {
    const newDeck = req.body;
    let decks = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf8'));
    
    if (newDeck.id) {
       // Aggiornamento esistente
       decks = decks.map(d => d.id === newDeck.id ? newDeck : d);
    } else {
       // Nuovo mazzo
       newDeck.id = Date.now();
       decks.push(newDeck);
    }
    
    fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
    res.json(newDeck);
  } catch (error) {
    console.error('Errore salvataggio mazzo:', error);
    res.status(500).json({ error: 'Errore salvataggio mazzo' });
  }
});

app.delete('/api/decks/user/:username', (req, res) => {
  try {
    const { username } = req.params;
    let decks = JSON.parse(fs.readFileSync(DECKS_FILE, 'utf8'));
    decks = decks.filter(d => d.creator !== username);
    fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2));
    res.json({ message: `Tutti i mazzi di ${username} rimosse con successo.` });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante la pulizia dei dati mazzi' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Punto Zero] Backend Server in ascolto sulla porta ${PORT}`);
});
