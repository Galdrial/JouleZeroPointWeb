const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Autenticazione (Gestione Costruttori)
const authRoutes = require('./auth');
app.use('/api/auth', authRoutes);

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
      image_url: `/assets/cards/${String(id).padStart(3, '0')}_${(data['Nome'] || '').replace(/ /g, '_')}.png`
    };
    
    if (data['Nome']) {
      cards.push(card);
    }
  }
  return cards;
}

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[Punto Zero] Backend Server in ascolto sulla porta ${PORT}`);
});
