const Deck = require('../models/Deck');
const Card = require('../models/Card');
const logger = require('../config/logger');
const path = require('path');

/**
 * @desc    Retrieve all decks (supports Private/Creator filtering)
 * @route   GET /api/v1/decks
 * @access  Protected
 * @protocol Implements visibility logic to ensure only public decks or owner's decks are returned.
 */
const getDecks = async (req, res) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    const requester = req.user ? req.user.username.toLowerCase() : null;
    const creatorLower = creator ? creator.toString().toLowerCase() : null;

    let query = {};
    
    if (creatorLower) {
      query.creator = creatorLower;
      // Access Control: If requester is not the creator, restrict to public visibility
      if (requester !== creatorLower) {
        query.isPublic = true;
      }
    } else if (requester) {
      // Default behavior: Fetch requester's personal decks
      query.creator = requester;
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      
      // Semantic Search Extension: Resolve 'Costruttore' cards matching the query first
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
    logger.error(`DECK_LIST_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore durante il recupero del registro dei mazzi.' });
  }
};

/**
 * @desc    Retrieve globally shared public decks
 * @route   GET /api/v1/decks/public
 * @access  Public
 * @protocol Filters by public visibility and supports advanced sorting (top voted, most imported).
 */
const getPublicDecks = async (req, res) => {
  try {
    const { q, costruttoreId, sort = 'recent', page = 1, limit = 12 } = req.query;
    const requester = req.headers['x-user'] || '';

    let query = { isPublic: true };

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');

      // Resolve Costruttore names to IDs for complex filtering
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

    // Augment deck data with engagement metrics for the requesting user
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
    logger.error(`PUBLIC_DECK_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la sincronizzazione dell\'archivio pubblico.' });
  }
};

/**
 * @desc    Persist or Update a deck entity
 * @route   POST /api/v1/decks
 * @access  Protected
 * @protocol Validates uniqueness and authorship before committing structural changes.
 */
const saveDeck = async (req, res) => {
  try {
    const { id, name, cards, costruttoreId, isPublic } = req.body;
    const creator = req.user.username;

    if (!name) {
      return res.status(400).json({ error: 'Il titolo del mazzo è obbligatorio.' });
    }

    // Integrity Check: Prevent duplicate naming within a user context
    const duplicate = await Deck.findOne({ 
      name: name.trim(), 
      creator, 
      _id: { $ne: id || null } 
    });

    if (duplicate) {
      return res.status(409).json({ error: 'Un mazzo con questo nome esiste già nel tuo registro.' });
    }

    let savedDeck;
    const finalCostruttoreId = costruttoreId || req.user.id;

    if (id) {
      // Transaction Logic: Update an existing architectural design
      savedDeck = await Deck.findOneAndUpdate(
        { _id: id, creator },
        { name, cards, costruttoreId: finalCostruttoreId, isPublic },
        { new: true, runValidators: true }
      );

      if (!savedDeck) {
        return res.status(404).json({ error: 'Mazzo non trovato o accesso non autorizzato.' });
      }
    } else {
      // Transaction Logic: Construct a new deck entity
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
    logger.error(`DECK_SAVE_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante il salvataggio del mazzo.' });
  }
};

/**
 * @desc    Decommission a deck entity from the database
 * @route   DELETE /api/v1/decks/:id
 * @access  Protected
 * @protocol Ensures only the architect can execute the purge sequence.
 */
const deleteDeck = async (req, res) => {
  try {
    const deck = await Deck.findOneAndDelete({ _id: req.params.id, creator: req.user.username });

    if (!deck) {
      return res.status(404).json({ error: 'Mazzo non trovato o accesso non autorizzato.' });
    }

    logger.info(`VIGIL_SYSTEM: Deck decommissioned: ${deck.name} by ${req.user.username}`);
    res.status(204).send();
  } catch (error) {
    logger.error(`DECK_DELETE_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante la dismissione del mazzo.' });
  }
};

/**
 * @desc    Toggle user engagement influence (Voting protocol)
 * @route   POST /api/v1/decks/:id/vote
 * @access  Protected
 * @protocol Manages the idempotent increment/decrement of user points on public decks.
 */
const voteDeck = async (req, res) => {
  try {
    const username = req.user.username;
    const deck = await Deck.findById(req.params.id);

    if (!deck || !deck.isPublic) {
      return res.status(404).json({ error: 'Designazione del mazzo pubblico non trovata.' });
    }

    const voteIndex = deck.votes.indexOf(username);
    if (voteIndex > -1) {
      // Protocol: Remove vote if already registered
      deck.votes.splice(voteIndex, 1);
    } else {
      // Protocol: Register new vote influence
      deck.votes.push(username);
    }

    await deck.save();
    res.json({
      votesCount: deck.votes.length,
      userVoted: deck.votes.includes(username)
    });
  } catch (error) {
    logger.error(`DECK_VOTE_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la sincronizzazione dell\'influenza.' });
  }
};

/**
 * @desc    Import a public deck into the user's personal registry
 * @route   POST /api/v1/decks/:id/import
 * @access  Protected
 * @protocol Increments global metrics and creates a localized, private replica.
 */
const importDeck = async (req, res) => {
  try {
    const username = req.user.username;
    const sourceDeck = await Deck.findById(req.params.id);

    if (!sourceDeck || !sourceDeck.isPublic) {
      return res.status(404).json({ error: 'Mazzo sorgente pubblico non trovato.' });
    }

    if (sourceDeck.creator === username) {
      return res.status(403).json({ error: 'Rilevata ricorsione: Non puoi importare i tuoi stessi mazzi.' });
    }

    const importedName = `${sourceDeck.name} (Imported)`;
    
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
    logger.error(`DECK_IMPORT_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante la replica automatizzata del mazzo.' });
  }
};

/**
 * @desc    Wipe all decks attributed to a specific user
 * @route   DELETE /api/v1/decks/user/:username
 * @access  Protected
 * @protocol High-clearance action to clean up user-generated data.
 */
const deleteUserDecks = async (req, res) => {
  try {
    const { username } = req.params;
    const requester = req.user.username.toLowerCase();
    const targetUsername = username.toLowerCase();

    if (targetUsername !== requester) {
        return res.status(403).json({ error: 'Autorizzazione negata: Non puoi epurare registri esterni.' });
    }
    const result = await Deck.deleteMany({ creator: requester });
    logger.info(`VIGIL_SYSTEM: ${result.deletedCount} deck artifacts for ${username} have been purged.`);
    res.json({ message: 'All deck entities removed successfully.', deletedCount: result.deletedCount });
  } catch (error) {
    logger.error(`USER_DECKS_PURGE_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante la sequenza di tabula rasa del registro.' });
  }
};

/**
 * @desc    Retrieve a single deck by its unique identifier
 * @route   GET /api/v1/decks/:id
 * @access  Public (Logical filtering applies)
 * @protocol Direct retrieval for specific entity visualization.
 */
const getDeckById = async (req, res) => {
  try {
    const deck = await Deck.findById(req.params.id);
    if (!deck) {
      return res.status(404).json({ error: 'Mazzo non trovato nell\'archivio.' });
    }
    res.json(deck);
  } catch (error) {
    logger.error(`GET_DECK_BY_ID_ERROR: ${error.message}`);
    res.status(500).json({ error: 'Errore durante la scoperta del mazzo specifico.' });
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
