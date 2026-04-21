import { Request, Response } from 'express';
import logger from '../config/logger';
import Card from '../models/Card';
import Deck, { IDeck } from '../models/Deck';
import { escapeRegex } from '../utils/escapeRegex';

/**
 * Deck Controller (TypeScript).
 * 
 * Manages the tactical collection of card decks including personal 
 * registries, public sharing, community voting, and automated cloning.
 */

/**
 * @desc    Retrieve all decks (supports Private/Creator filtering)
 * @route   GET /api/v1/decks
 * @access  Protected
 */
export const getDecks = async ( req: Request, res: Response ) => {
  try {
    const { creator, q, costruttoreId, page = 1, limit = 12 } = req.query;
    const requester = req.user ? req.user.username.toLowerCase() : null;
    const creatorLower = creator ? creator.toString().toLowerCase() : null;

    let query: any = {};

    if ( creatorLower ) {
      query.creator = creatorLower;
      if ( requester !== creatorLower ) {
        query.isPublic = true;
      }
    } else if ( requester ) {
      query.creator = requester;
    }

    if ( typeof q === 'string' && q.trim() ) {
      const searchRegex = new RegExp( escapeRegex( q.trim() ), 'i' );
      const matchingCards = await Card.find( {
        name: searchRegex,
        type: 'Costruttore'
      } ).select( 'cardId' );
      const costruttoreIds = matchingCards.map( c => c.cardId );

      query.$or = [
        { name: searchRegex },
        { costruttoreId: { $in: costruttoreIds } }
      ];
    }

    if ( costruttoreId && costruttoreId !== '' ) {
      query.costruttoreId = Number( costruttoreId );
    }

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 12, 50);
    const parsedPage = Math.max(parseInt(page as string, 10) || 1, 1);

    const total = await Deck.countDocuments(query);
    const decks = await Deck.find(query)
      .sort({ updatedAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    res.json({ decks, total });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`DECK_LIST_ERROR: ${errorMessage}`);
    res.status(500).json({ error: 'Errore durante il recupero del registro dei mazzi.' });
  }
};

/**
 * @desc    Retrieve globally shared public decks
 * @route   GET /api/v1/decks/public
 * @access  Public
 */
export const getPublicDecks = async ( req: Request, res: Response ) => {
  try {
    const { q, costruttoreId, sort = 'recent', page = 1, limit = 12 } = req.query;
    const requester = req.headers['x-user'] as string || '';

    let query: any = { isPublic: true };

    if ( typeof q === 'string' && q.trim() ) {
      const searchRegex = new RegExp( escapeRegex( q.trim() ), 'i' );
      const matchingCards = await Card.find( {
        name: searchRegex,
        type: 'Costruttore'
      } ).select( 'cardId' );
      const costruttoreIds = matchingCards.map( c => c.cardId );

      query.$or = [
        { name: searchRegex },
        { creator: searchRegex },
        { costruttoreId: { $in: costruttoreIds } }
      ];
    }

    if ( costruttoreId && costruttoreId !== '' ) {
      query.costruttoreId = Number( costruttoreId );
    }

    let sortOption: any = { createdAt: -1 };
    if ( sort === 'top' ) {
      sortOption = { 'votes.length': -1, createdAt: -1 };
    } else if ( sort === 'imports' ) {
      sortOption = { importsCount: -1, createdAt: -1 };
    }

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 12, 50);
    const parsedPage = Math.max(parseInt(page as string, 10) || 1, 1);

    const total = await Deck.countDocuments(query);
    const decks = await Deck.find(query)
      .sort(sortOption)
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit);

    const formattedDecks = decks.map((d) => {
      const votesCount = d.votes.length;
      const userVoted = requester ? d.votes.includes(requester) : false;
      return {
        ...d.toObject(),
        votesCount,
        userVoted,
      };
    });

    res.json({ decks: formattedDecks, total });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`PUBLIC_DECK_ERROR: ${errorMessage}`);
    res.status(500).json({ error: "Errore durante la sincronizzazione dell'archivio pubblico." });
  }
};

/**
 * @desc    Persist or Update a deck entity
 * @route   POST /api/v1/decks
 * @access  Protected
 */
export const saveDeck = async ( req: Request, res: Response ) => {
  try {
    const { id, name, cards, costruttoreId, isPublic } = req.body;
    const creator = req.user?.username;

    if ( !creator ) {
      return res.status( 401 ).json( { error: 'Identità utente non verificata.' } );
    }

    if ( !name ) {
      return res.status( 400 ).json( { error: 'Il titolo del mazzo è obbligatorio.' } );
    }

    const duplicate = await Deck.findOne( {
      name: name.trim(),
      creator,
      _id: { $ne: id || null }
    } );

    if ( duplicate ) {
      return res.status( 409 ).json( { error: 'Un mazzo con questo nome esiste già nel tuo registro.' } );
    }

    let savedDeck: IDeck | null;
    const finalCostruttoreId = Number( costruttoreId );

    if ( id ) {
      savedDeck = await Deck.findOneAndUpdate(
        { _id: id, creator },
        { name, cards, costruttoreId: finalCostruttoreId, isPublic },
        { new: true, runValidators: true }
      );

      if ( !savedDeck ) {
        return res.status( 404 ).json( { error: 'Mazzo non trovato o accesso non autorizzato.' } );
      }
    } else {
      savedDeck = await Deck.create( {
        name,
        cards,
        costruttoreId: finalCostruttoreId,
        creator,
        isPublic
      } );
    }

    res.status(id ? 200 : 201).json(savedDeck);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`DECK_SAVE_ERROR: ${errorMessage}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante il salvataggio del mazzo.' });
  }
};

/**
 * @desc    Decommission a deck entity from the database
 * @route   DELETE /api/v1/decks/:id
 * @access  Protected
 */
export const deleteDeck = async ( req: Request, res: Response ) => {
  try {
    const creator = req.user?.username;
    if ( !creator ) {
      return res.status( 401 ).json( { error: 'Accesso negato.' } );
    }
    const deck = await Deck.findOneAndDelete( { _id: req.params.id, creator } );

    if ( !deck ) {
      return res.status( 404 ).json( { error: 'Mazzo non trovato o accesso non autorizzato.' } );
    }

    logger.info(`VIGIL_SYSTEM: Deck decommissioned: ${deck.name} by ${creator}`);
    res.status(204).send();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`DECK_DELETE_ERROR: ${errorMessage}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante la dismissione del mazzo.' });
  }
};

/**
 * @desc    Toggle user engagement influence (Voting protocol)
 * @route   POST /api/v1/decks/:id/vote
 * @access  Protected
 */
export const voteDeck = async ( req: Request, res: Response ) => {
  try {
    const username = req.user?.username;
    if ( !username ) {
      return res.status( 401 ).json( { error: 'Autenticazione richiesta.' } );
    }
    const deck: IDeck | null = await Deck.findById( req.params.id );

    if ( !deck || !deck.isPublic ) {
      return res.status( 404 ).json( { error: 'Designazione del mazzo pubblico non trovata.' } );
    }

    const voteIndex = deck.votes.indexOf( username );
    if ( voteIndex > -1 ) {
      deck.votes.splice( voteIndex, 1 );
    } else {
      deck.votes.push( username );
    }

    await deck.save();
    res.json({
      votesCount: deck.votes.length,
      userVoted: deck.votes.includes(username),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`DECK_VOTE_ERROR: ${errorMessage}`);
    res.status(500).json({ error: "Errore durante la sincronizzazione dell'influenza." });
  }
};

/**
 * @desc    Import a public deck into the user's personal registry
 * @route   POST /api/v1/decks/:id/import
 * @access  Protected
 */
export const importDeck = async ( req: Request, res: Response ) => {
  try {
    const username = req.user?.username;
    if ( !username ) {
      return res.status( 401 ).json( { error: 'Autenticazione richiesta.' } );
    }
    const sourceDeck: IDeck | null = await Deck.findById( req.params.id );

    if ( !sourceDeck || !sourceDeck.isPublic ) {
      return res.status( 404 ).json( { error: 'Mazzo sorgente pubblico non trovato.' } );
    }

    if ( sourceDeck.creator === username ) {
      return res.status( 403 ).json( { error: 'Rilevata ricorsione: Non puoi importare i tuoi stessi mazzi.' } );
    }

    const importedName = `${ sourceDeck.name } (Imported)`;

    const newDeck = await Deck.create( {
      name: importedName,
      cards: sourceDeck.cards,
      costruttoreId: sourceDeck.costruttoreId,
      creator: username,
      isPublic: false,
      parentDeckId: sourceDeck._id.toString()
    } );

    sourceDeck.importsCount += 1;
    await sourceDeck.save();

    res.status(201).json(newDeck);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`DECK_IMPORT_ERROR: ${errorMessage}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante la replica automatizzata del mazzo.' });
  }
};

/**
 * @desc    Wipe all decks attributed to a specific user
 * @route   DELETE /api/v1/decks/user/:username
 * @access  Protected
 */
export const deleteUserDecks = async ( req: Request, res: Response ) => {
  try {
    const { username } = req.params;
    const requester = req.user?.username.toLowerCase();

    if ( !requester ) {
      return res.status( 401 ).json( { error: 'Accesso negato.' } );
    }
    const targetUsername = ( username as string ).toLowerCase();

    if ( targetUsername !== requester ) {
      return res.status( 403 ).json( { error: 'Autorizzazione negata: Non puoi epurare registri esterni.' } );
    }
    const result = await Deck.deleteMany({ creator: requester });
    logger.info(`VIGIL_SYSTEM: ${result.deletedCount} deck artifacts for ${username} have been purged.`);
    res.json({ message: 'All deck entities removed successfully.', deletedCount: result.deletedCount });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`USER_DECKS_PURGE_ERROR: ${errorMessage}`);
    res.status(500).json({ error: 'Fallimento del protocollo durante la sequenza di tabula rasa del registro.' });
  }
};

/**
 * @desc    Retrieve a single deck by its unique identifier
 * @route   GET /api/v1/decks/:id
 * @access  Public
 */
export const getDeckById = async ( req: Request, res: Response ) => {
  try {
    const deck: IDeck | null = await Deck.findById( req.params.id );
    if ( !deck ) {
      return res.status( 404 ).json( { error: 'Mazzo non trovato nell\'archivio.' } );
    }
    res.json(deck);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
    logger.error(`GET_DECK_BY_ID_ERROR: ${errorMessage}`);
    res.status(500).json({ error: 'Errore durante la scoperta del mazzo specifico.' });
  }
};
