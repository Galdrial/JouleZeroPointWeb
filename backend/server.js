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
const FRIENDS_FILE = path.join(__dirname, 'friends.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Utility helper to read/write JSON files
const readJSON = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

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
    
    // Filtro per creatore
    if (creator) {
      decks = decks.filter(d => d.creator === creator);
      // Se non è il creatore stesso a richiedere, mostriamo solo i pubblici
      const requester = req.headers['x-user'] || ''; 
      if (requester !== creator) {
        decks = decks.filter(d => d.isPublic === true);
      }
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

    // Social Data Purge
    let friends = readJSON(FRIENDS_FILE);
    friends = friends.filter(f => f.user1 !== username && f.user2 !== username);
    writeJSON(FRIENDS_FILE, friends);

    let messages = readJSON(MESSAGES_FILE);
    messages = messages.filter(m => m.from !== username && m.to !== username);
    writeJSON(MESSAGES_FILE, messages);

    res.json({ message: `Tutti i dati (mazzi, messaggi, collegamenti) di ${username} rimosse con successo.` });
  } catch (error) {
    res.status(500).json({ error: 'Errore durante la pulizia dei dati mazzi' });
  }
});

// Social Layer Implementation
app.get('/api/social/friends', (req, res) => {
  const { username } = req.query;
  const friends = readJSON(FRIENDS_FILE);
  const userFriends = friends.filter(f => (f.user1 === username || f.user2 === username) && f.status === 'accepted');
  res.json(userFriends);
});

app.get('/api/social/notifications', (req, res) => {
  const { username } = req.query;
  try {
    const friends = readJSON(FRIENDS_FILE);
    const messages = readJSON(MESSAGES_FILE);

    const pendingRequests = friends.filter(f => f.user2 === username && f.status === 'pending').length;
    
    // Get list of active friends
    const activeFriends = friends
      .filter(f => (f.user1 === username || f.user2 === username) && f.status === 'accepted')
      .map(f => f.user1 === username ? f.user2 : f.user1);

    // Only count unread messages from active friends
    const unreadMessagesList = messages.filter(m => 
      m.to === username && 
      m.read !== true && 
      activeFriends.includes(m.from)
    );
    
    const unreadSenders = [...new Set(unreadMessagesList.map(m => m.from.toLowerCase()))];


    res.json({
      pendingRequests,
      unreadMessages: unreadMessagesList.length,
      unreadSenders,
      total: pendingRequests + unreadMessagesList.length
    });
  } catch (e) {
    res.status(500).json({ error: 'Errore nel recupero notifiche' });
  }
});


app.get('/api/social/requests', (req, res) => {
  const { username } = req.query;
  const friends = readJSON(FRIENDS_FILE);
  const incoming = friends.filter(f => f.user2 === username && f.status === 'pending');
  const outgoing = friends.filter(f => f.user1 === username && f.status === 'pending');
  res.json({ incoming, outgoing });
});

app.post('/api/social/request', (req, res) => {
  const { from, to } = req.body;
  const friends = readJSON(FRIENDS_FILE);
  
  // Check if exists
  const existing = friends.find(f => (f.user1 === from && f.user2 === to) || (f.user1 === to && f.user2 === from));
  if (existing) return res.status(400).json({ error: 'Richiesta già esistente o collegamento attivo.' });

  const newRequest = {
    id: Date.now().toString(),
    user1: from,
    user2: to,
    status: 'pending',
    timestamp: new Date().toISOString()
  };
  friends.push(newRequest);
  writeJSON(FRIENDS_FILE, friends);
  res.json(newRequest);
});

app.post('/api/social/accept', (req, res) => {
  const { id } = req.body;
  let friends = readJSON(FRIENDS_FILE);
  const request = friends.find(f => f.id === id);
  if (!request) return res.status(404).json({ error: 'Richiesta non trovata.' });

  request.status = 'accepted';
  writeJSON(FRIENDS_FILE, friends);
  res.json(request);
});

app.delete('/api/social/friend/:id', (req, res) => {
  const { id } = req.params;
  try {
    let friends = readJSON(FRIENDS_FILE);
    const connection = friends.find(f => f.id === id);
    
    if (connection) {
      const { user1, user2 } = connection;
      // Rimuovi il collegamento
      friends = friends.filter(f => f.id !== id);
      writeJSON(FRIENDS_FILE, friends);

      // Cancella tutto lo storico messaggi tra questi due utenti
      let messages = readJSON(MESSAGES_FILE);
      messages = messages.filter(m => 
        !((m.from === user1 && m.to === user2) || (m.from === user2 && m.to === user1))
      );
      writeJSON(MESSAGES_FILE, messages);
    }
    
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Errore durante la rimozione del collegamento' });
  }
});


// Messaging Layer Implementation
app.get('/api/social/messages/:chattingWith', (req, res) => {
  const { user } = req.query;
  const { chattingWith } = req.params;
  const messages = readJSON(MESSAGES_FILE);
  const chatHistory = messages.filter(m => 
    (m.from === user && m.to === chattingWith) || 
    (m.from === chattingWith && m.to === user)
  ).sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp));
  res.json(chatHistory);
});

app.post('/api/social/messages', (req, res) => {
  const { from, to, content } = req.body;
  const messages = readJSON(MESSAGES_FILE);
  const newMessage = {
    id: Date.now().toString(),
    from,
    to,
    content,
    read: false,
    timestamp: new Date().toISOString()
  };
  messages.push(newMessage);
  writeJSON(MESSAGES_FILE, messages);
  res.json(newMessage);
});

app.post('/api/social/messages/read', (req, res) => {
  const { user, from } = req.body;
  try {
    let messages = readJSON(MESSAGES_FILE);
    let changed = false;
    messages = messages.map(m => {
      if (m.to === user && m.from === from && m.read === false) {
        changed = true;
        return { ...m, read: true };
      }
      return m;
    });
    if (changed) writeJSON(MESSAGES_FILE, messages);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Errore aggiornamento stato lettura' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Punto Zero] Backend Server in ascolto sulla porta ${PORT}`);
});
