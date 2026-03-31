const Deck = require('../models/Deck');
const Card = require('../models/Card');
const logger = require('../config/logger');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// @desc    Get all decks (Private/Creator filter)
// @route   GET /api/v1/decks
// @access  Protected
const getDecks = async (req, res) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    const requester = req.user ? req.user.username.toLowerCase() : null;
    const creatorLower = creator ? creator.toString().toLowerCase() : null;

    let query = {};
    
    if (creatorLower) {
      query.creator = creatorLower;
      // If not the owner, show only public
      if (requester !== creatorLower) {
        query.isPublic = true;
      }
    } else if (requester) {
      // By default, show requester's decks
      query.creator = requester;
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      
      // NEW: Search for costruttori matching names first
      const matchingCards = await Card.find({ 
        name: searchRegex, 
        type: 'Costruttore' 
      }).select('cardId');
      const costruttoreIds = matchingCards.map(c => c.cardId);

      query.$or = [
        { name: searchRegex },
        { costruttoreId: { $in: costruttoreIds } }
      ];
    }

    if (costruttoreId && costruttoreId !== '') {
      query.costruttoreId = Number(costruttoreId);
    }

    logger.debug(`QUERY_FILTER_PRIVATE: ${JSON.stringify(query)}`);

    const total = await Deck.countDocuments(query);
    const decks = await Deck.find(query)
      .sort({ updatedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ decks, total });
  } catch (error) {
    logger.error(`ERRORE_DECK_LIST: ${error.message}`);
    res.status(500).json({ error: 'Errore durante il caricamento dei mazzi.' });
  }
};

// @desc    Get public decks
// @route   GET /api/v1/decks/public
// @access  Public
const getPublicDecks = async (req, res) => {
  try {
    const { q, costruttoreId, sort = 'recent', page = 1, limit = 12 } = req.query;
    const requester = req.headers['x-user'] || '';

    let query = { isPublic: true };

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');

      // NEW: Search for costruttori matching names first
      const matchingCards = await Card.find({ 
        name: searchRegex, 
        type: 'Costruttore' 
      }).select('cardId');
      const costruttoreIds = matchingCards.map(c => c.cardId);

      query.$or = [
        { name: searchRegex },
        { creator: searchRegex },
        { costruttoreId: { $in: costruttoreIds } }
      ];
    }

    if (costruttoreId && costruttoreId !== '') {
      query.costruttoreId = Number(costruttoreId);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'top') {
      sortOption = { 'votes.length': -1, createdAt: -1 };
    } else if (sort === 'imports') {
      sortOption = { importsCount: -1, createdAt: -1 };
    }

    const total = await Deck.countDocuments(query);
    const decks = await Deck.find(query)
      .sort(sortOption)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const formattedDecks = decks.map(d => {
      const votesCount = d.votes.length;
      const userVoted = requester ? d.votes.includes(requester) : false;
      return {
        ...d.toObject(),
        votesCount,
        userVoted
      };
    });

    res.json({ decks: formattedDecks, total });
  } catch (error) {
    logger.error(`ERRORE_PUBLIC_DECK: ${error.message}`);
    res.status(500).json({ error: 'Errore caricamento mazzi pubblici.' });
  }
};

// @desc    Create or Update deck
// @route   POST /api/v1/decks
// @access  Protected
const saveDeck = async (req, res) => {
  try {
    const { id, name, cards, costruttoreId, isPublic } = req.body;
    const creator = req.user.username;

    if (!name) {
      return res.status(400).json({ error: 'Nome mazzo obbligatorio.' });
    }

    // Duplicate name check
    const duplicate = await Deck.findOne({ 
      name: name.trim(), 
      creator, 
      _id: { $ne: id || null } 
    });

    if (duplicate) {
      return res.status(409).json({ error: 'Esiste già un mazzo con questo nome per questo utente.' });
    }

    let savedDeck;
    const finalCostruttoreId = costruttoreId || req.user.id;

    if (id) {
      // Update existing
      savedDeck = await Deck.findOneAndUpdate(
        { _id: id, creator },
        { name, cards, costruttoreId: finalCostruttoreId, isPublic },
        { new: true, runValidators: true }
      );

      if (!savedDeck) {
        return res.status(404).json({ error: 'Mazzo non trovato o non sei l\'autore.' });
      }
    } else {
      // Create new
      savedDeck = await Deck.create({
        name,
        cards,
        costruttoreId: finalCostruttoreId,
        creator,
        isPublic
      });
    }

    res.status(id ? 200 : 201).json(savedDeck);
  } catch (error) {
    logger.error(`ERRORE_DECK_SAVE: ${error.message}`);
    res.status(500).json({ error: 'Errore salvataggio mazzo.' });
  }
};

// @desc    Delete deck
// @route   DELETE /api/v1/decks/:id
// @access  Protected
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, creator: req.user.username });

    if (!deck) {
      return res.status(404).json({ error: 'Mazzo non trovato o non sei l\'autore.' });
    }

    logger.info(`SISTEMA_VIGILE: Mazzo rimosso: ${deck.name} da ${req.user.username}`);
    res.status(204).send();
  } catch (error) {
    logger.error(`ERRORE_DECK_DELETE: ${error.message}`);
    res.status(500).json({ error: 'Errore eliminazione mazzo.' });
  }
};

// @desc    Vote deck
// @route   POST /api/v1/decks/:id/vote
// @access  Protected
const voteDeck = async (req, res) => {
  try {
    const username = req.user.username;
    const deck = await Deck.findById(req.params.id);

    if (!deck || !deck.isPublic) {
      return res.status(404).json({ error: 'Mazzo pubblico non trovato.' });
    }

    const voteIndex = deck.votes.indexOf(username);
    if (voteIndex > -1) {
      deck.votes.splice(voteIndex, 1);
    } else {
      deck.votes.push(username);
    }

    await deck.save();
    res.json({
      votesCount: deck.votes.length,
      userVoted: deck.votes.includes(username)
    });
  } catch (error) {
    logger.error(`ERRORE_DECK_VOTE: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la votazione.' });
  }
};

// @desc    Import deck
// @route   POST /api/v1/decks/:id/import
// @access  Protected
const importDeck = async (req, res) => {
  try {
    const username = req.user.username;
    const sourceDeck = await Deck.findById(req.params.id);

    if (!sourceDeck || !sourceDeck.isPublic) {
      return res.status(404).json({ error: 'Mazzo pubblico non trovato.' });
    }

    if (sourceDeck.creator === username) {
      return res.status(403).json({ error: 'Non puoi importare un tuo mazzo.' });
    }

    const importedName = `${sourceDeck.name} (importato)`;
    
    const newDeck = await Deck.create({
      name: importedName,
      cards: sourceDeck.cards,
      costruttoreId: sourceDeck.costruttoreId,
      creator: username,
      isPublic: false,
      parentDeckId: sourceDeck._id
    });

    sourceDeck.importsCount += 1;
    await sourceDeck.save();

    res.status(201).json(newDeck);
  } catch (error) {
    logger.error(`ERRORE_DECK_IMPORT: ${error.message}`);
    res.status(500).json({ error: 'Errore durante l\'importazione.' });
  }
};

// @desc    Delete all decks by a user
// @route   DELETE /api/v1/decks/user/:username
// @access  Protected
const deleteUserDecks = async (req, res) => {
  try {
    const { username } = req.params;
    const requester = req.user.username.toLowerCase();
    const targetUsername = username.toLowerCase();

    if (targetUsername !== requester) {
        return res.status(403).json({ error: 'Non puoi eliminare i mazzi di un altro utente.' });
    }
    await Deck.deleteMany({ creator: requester });
    logger.info(`SISTEMA_VIGILE: Tutti i mazzi di ${username} sono stati raggruppati ed eliminati.`);
    res.json({ message: 'Tutti i mazzi sono stati rimossi con successo.' });
  } catch (error) {
    logger.error(`ERRORE_USER_DECKS_DELETE: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la pulizia dei dati mazzi.' });
  }
};

// @desc    Get a single deck by ID
// @route   GET /api/v1/decks/:id
// @access  Public (filtered by logic)
const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Mazzo non trovato.' });
    }
    res.json(deck);
  } catch (error) {
    logger.error(`ERRORE_GET_DECK_BY_ID: ${error.message}`);
    res.status(500).json({ error: 'Errore caricamento mazzo.' });
  }
};

// @desc    Export deck to PDF or TTS JPG
// @route   GET /api/v1/decks/:id/export
// @access  Public
const exportDeck = async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.query; // 'pdf' or 'tts'

    if (!format || !['pdf', 'tts'].includes(format)) {
      return res.status(400).json({ error: 'Formato export non valido (richiesto pdf o tts).' });
    }

    const deck = await Deck.findById(id);
    if (!deck) {
      return res.status(404).json({ error: 'Mazzo non trovato.' });
    }

    // Creazione cartelle se mancano
    const exportsDir = path.join(__dirname, '../exports');
    const tmpDir = path.join(__dirname, '../tmp');
    if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

    logger.info(`ESPORTAZIONE_AVVIATA: Mazzo ${id} in formato ${format}`);

    // Arricchimento dei dati con i NOMI e gli URL delle immagini
    const allCards = await Card.find({});
    const cardMap = allCards.reduce((acc, c) => {
      acc[c.cardId] = { name: c.name, image_url: c.image_url };
      return acc;
    }, {});

    const enrichedDeck = deck.toObject();
    const cId = Number(deck.costruttoreId);
    enrichedDeck.costruttore_name = cardMap[cId]?.name || 'Costruttore Ignoto';
    enrichedDeck.costruttore_image_url = cardMap[cId]?.image_url || '';
    
    enrichedDeck.cards = enrichedDeck.cards.map(c => {
      const cardNumId = Number(c.cardId);
      return {
        ...c,
        name: cardMap[cardNumId]?.name || 'Carta Sconosciuta',
        image_url: cardMap[cardNumId]?.image_url || ''
      };
    });

    const tmpJsonPath = path.join(tmpDir, `deck_${id}.json`);
    fs.writeFileSync(tmpJsonPath, JSON.stringify(enrichedDeck, null, 2));

    const projectDir = '/home/simone/Documenti/start2impact/JouleZeroPointDev';
    const pythonPath = path.join(projectDir, 'venv/bin/python3');
    const scriptPath = path.join(projectDir, 'backend/deckbuilder.py');

    logger.info(`ESPORTAZIONE_AVVIATA: Mazzo ${id} in formato ${format}`);

    exec(`${pythonPath} ${scriptPath} ${tmpJsonPath} ${format}`, (error, stdout, stderr) => {
      // Pulizia JSON temporaneo
      if (fs.existsSync(tmpJsonPath)) fs.unlinkSync(tmpJsonPath);

      if (error) {
        logger.error(`ERRORE_PYTHON_EXPORT: ${error.message}`);
        return res.status(500).json({ error: 'Errore durante la generazione del file.' });
      }

      const extension = format === 'pdf' ? 'pdf' : 'jpg';
      const filePath = path.join(exportsDir, `deck_export_${id}.${extension}`);

      if (!fs.existsSync(filePath)) {
        return res.status(500).json({ error: 'Il file generato non è stato trovato.' });
      }

      res.download(filePath, `Joule_${deck.name}_${format}.${extension}`, (err) => {
        if (err) {
          logger.error(`ERRORE_DOWNLOAD: ${err.message}`);
        }
        // Opzionale: rimuovi il file dopo il download per risparmiare spazio
        // if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    });

  } catch (error) {
    logger.error(`ERRORE_DECK_EXPORT: ${error.message}`);
    res.status(500).json({ error: 'Errore imprevisto durante l\'esportazione.' });
  }
};

module.exports = {
  getDecks,
  getPublicDecks,
  saveDeck,
  deleteDeck,
  voteDeck,
  importDeck,
  deleteUserDecks,
  getDeckById,
  exportDeck,
};
