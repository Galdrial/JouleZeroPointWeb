const express = require( 'express' );
const sqlite3 = require( 'sqlite3' ).verbose();
const bcrypt = require( 'bcryptjs' );
const jwt = require( 'jsonwebtoken' );

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'punto_zero_super_secret';

// Inizializza Database SQLite locale per gli utenti
const db = new sqlite3.Database( './users.sqlite', ( err ) => {
  if ( err ) console.error( 'Errore DB Utenti:', err );
  else {
    db.run( `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      password TEXT,
      username TEXT
    )`);
  }
} );

// Endpoint: Registrazione
router.post( '/register', async ( req, res ) => {
  const { username, email, password } = req.body;
  if ( !email || !password || !username ) {
    return res.status( 400 ).json( { error: 'Tutti i campi (Username, Email, Passphrase) sono obbligatori.' } );
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    db.get(
      `SELECT email, username FROM users WHERE lower(email) = ? OR lower(username) = ?`,
      [normalizedEmail, normalizedUsername],
      async ( checkErr, existingUser ) => {
        if ( checkErr ) {
          return res.status( 500 ).json( { error: 'Errore interno del server.' } );
        }

        if ( existingUser ) {
          if ( ( existingUser.email || '' ).toLowerCase() === normalizedEmail ) {
            return res.status( 409 ).json( { error: 'Frequenza Temporale (Email) già in uso.' } );
          }
          return res.status( 409 ).json( { error: 'Username già in uso.' } );
        }

        const salt = await bcrypt.genSalt( 10 );
        const hashedPassword = await bcrypt.hash( password, salt );

        db.run( `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`,
          [username, email, hashedPassword],
          function ( err ) {
            if ( err ) {
              if ( err.message.includes( 'UNIQUE constraint failed' ) ) {
                return res.status( 409 ).json( { error: 'Frequenza Temporale (Email) già in uso.' } );
              }
              return res.status( 500 ).json( { error: 'Errore interno del server.' } );
            }
            res.status( 201 ).json( { message: 'Costruttore registrato con successo!', id: this.lastID } );
          }
        );
      }
    );
  } catch ( error ) {
    res.status( 500 ).json( { error: 'Errore critico durante la registrazione.' } );
  }
} );

// Endpoint: Login
router.post( '/login', ( req, res ) => {
  const { email, password } = req.body;
  if ( !email || !password ) {
    return res.status( 400 ).json( { error: 'Email e Passphrase sono obbligatori.' } );
  }

  db.get( `SELECT * FROM users WHERE email = ?`, [email], async ( err, user ) => {
    if ( err ) return res.status( 500 ).json( { error: 'Errore del server durante la ricerca genetica (DB).' } );
    if ( !user ) return res.status( 401 ).json( { error: 'Frequenza Temporale non trovata o non autorizzata.' } );

    const validPass = await bcrypt.compare( password, user.password );
    if ( !validPass ) return res.status( 401 ).json( { error: 'Passphrase errata. Accesso negato.' } );

    const token = jwt.sign( { id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '24h' } );
    res.json( { token, username: user.username, message: 'Sincronizzazione completata. Benvenuto al Punto Zero.' } );
  } );
} );

// Endpoint: Cerca Utenti
router.get('/search', (req, res) => {
  const { q, current } = req.query;
  if (!q) return res.json([]);
  
  db.all(`SELECT username FROM users WHERE username LIKE ? AND username != ? LIMIT 10`, 
    [`%${q}%`, current], 
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Errore durante la ricerca neurale.' });
      res.json(rows);
    }
  );
});

// Endpoint: Elimina Account
router.delete( '/account/:username', ( req, res ) => {
  const { username } = req.params;

  db.run( `DELETE FROM users WHERE username = ?`, [username], function ( err ) {
    if ( err ) return res.status( 500 ).json( { error: 'Errore durante l\'epurazione dei dati genetici (DB).' } );
    res.json( { message: 'Account rimosso con successo dal archivio centrale.' } );
  } );
} );

module.exports = router;
