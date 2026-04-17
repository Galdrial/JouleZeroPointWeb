import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock api before store import ───────────────────────────────────────────
vi.mock( '../utils/api', () => ( {
  default: {
    get: vi.fn(),
    delete: vi.fn(),
  },
} ) )

vi.mock( './auth', () => ( {
  useAuthStore: () => ( { isLoggedIn: true } ),
} ) )

vi.mock( './notificationStore', () => ( {
  useNotificationStore: () => ( { success: vi.fn(), error: vi.fn() } ),
} ) )

import api from '../utils/api'
import { useDeckStore } from './deckStore'

const mockDecks = [
  { id: 1, name: 'Mazzo Alfa', cards: [], costruttoreId: 10, isPublic: false },
  { id: 2, name: 'Mazzo Beta', cards: [], costruttoreId: 20, isPublic: true },
]

describe( 'deckStore', () => {
  beforeEach( () => {
    setActivePinia( createPinia() )
    vi.clearAllMocks()
  } )

  // ─── Initial State ──────────────────────────────────────────────────────
  it( 'initializes with empty decks and idle state', () => {
    const store = useDeckStore()

    expect( store.userDecks ).toHaveLength( 0 )
    expect( store.publicDecks ).toHaveLength( 0 )
    expect( store.loading ).toBe( false )
    expect( store.error ).toBeNull()
  } )

  // ─── fetchUserDecks ───────────────────────────────────────────────────────
  it( 'fetches user decks and populates state', async () => {
    vi.mocked( api.get ).mockResolvedValue( {
      data: { decks: mockDecks, total: 2 },
    } )

    const store = useDeckStore()
    await store.fetchUserDecks()

    expect( api.get ).toHaveBeenCalledWith( '/decks', { params: {} } )
    expect( store.userDecks ).toHaveLength( 2 )
    expect( store.userDecks[0].name ).toBe( 'Mazzo Alfa' )
    expect( store.totalUserDecks ).toBe( 2 )
    expect( store.loading ).toBe( false )
  } )

  it( 'sets error state when fetchUserDecks fails', async () => {
    vi.mocked( api.get ).mockRejectedValue( new Error( 'Network Error' ) )

    const store = useDeckStore()
    await store.fetchUserDecks()

    expect( store.userDecks ).toHaveLength( 0 )
    expect( store.error ).toBe( 'Network Error' )
    expect( store.loading ).toBe( false )
  } )

  // ─── fetchPublicDecks ─────────────────────────────────────────────────────
  it( 'fetches public decks and returns raw data', async () => {
    const publicMock = { decks: mockDecks, total: 2 }
    vi.mocked( api.get ).mockResolvedValue( { data: publicMock } )

    const store = useDeckStore()
    const result = await store.fetchPublicDecks( { sort: 'recent' } )

    expect( api.get ).toHaveBeenCalledWith( '/decks/public', { params: { sort: 'recent' } } )
    expect( store.publicDecks ).toHaveLength( 2 )
    expect( result ).toEqual( publicMock )
  } )

  // ─── deleteDeck ───────────────────────────────────────────────────────────
  it( 'removes deck from local state after successful delete', async () => {
    vi.mocked( api.get ).mockResolvedValue( {
      data: { decks: mockDecks, total: 2 },
    } )
    vi.mocked( api.delete ).mockResolvedValue( {} )

    const store = useDeckStore()
    await store.fetchUserDecks()
    expect( store.userDecks ).toHaveLength( 2 )

    const result = await store.deleteDeck( 1 )

    expect( result ).toBe( true )
    expect( api.delete ).toHaveBeenCalledWith( '/decks/1' )
    expect( store.userDecks ).toHaveLength( 1 )
    expect( store.userDecks[0].id ).toBe( 2 )
    expect( store.totalUserDecks ).toBe( 1 )
  } )

  it( 'returns false when deleteDeck fails', async () => {
    vi.mocked( api.delete ).mockRejectedValue( new Error( 'Forbidden' ) )

    const store = useDeckStore()
    const result = await store.deleteDeck( 99 )

    expect( result ).toBe( false )
  } )

  // ─── fetchDeckById ────────────────────────────────────────────────────────
  it( 'returns deck data by id', async () => {
    const singleDeck = { id: 1, name: 'Mazzo Alfa', cards: [], costruttoreId: 10 }
    vi.mocked( api.get ).mockResolvedValue( { data: singleDeck } )

    const store = useDeckStore()
    const result = await store.fetchDeckById( 1 )

    expect( api.get ).toHaveBeenCalledWith( '/decks/1' )
    expect( result ).toEqual( singleDeck )
    expect( store.loading ).toBe( false )
  } )

  it( 'returns null when fetchDeckById fails', async () => {
    vi.mocked( api.get ).mockRejectedValue( new Error( 'Not Found' ) )

    const store = useDeckStore()
    const result = await store.fetchDeckById( 999 )

    expect( result ).toBeNull()
    expect( store.error ).toBe( 'Not Found' )
  } )
} )
