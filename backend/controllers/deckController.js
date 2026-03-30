const Deck = require('../models/Deck');
const logger = require('../config/logger');

// @desc    Get all decks (Private/Creator filter)
// @route   GET /api/v1/decks
// @access  Protected
const getDecks = async (req, res) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    const requester = req.user ? req.user.username : null;

    let query = {};
    
    if (creator) {
      query.creator = creator.toString().toLowerCase();
      // If not the owner, show only public
      if (requester !== creator) {
        query.isPublic = true;
      }
    } else {
      // By default, show requester's decks
      query.creator = requester;
    }

    if (q) {
      query.name = { $regex: q, $options: 'i' };
    }

    if (costruttoreId) {
      query.costruttoreId = costruttoreId;
    }

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

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { creator: { $regex: q, $options: 'i' } }
      ];
    }

    if (costruttoreId) {
      query.costruttoreId = costruttoreId;
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
    if (username !== req.user.username) {
        return res.status(403).json({ error: 'Non puoi eliminare i mazzi di un altro utente.' });
    }
    await Deck.deleteMany({ creator: username });
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

module.exports = {
  getDecks,
  getPublicDecks,
  saveDeck,
  deleteDeck,
  voteDeck,
  importDeck,
  deleteUserDecks,
  getDeckById,
};
