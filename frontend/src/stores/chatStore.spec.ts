import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// ─── Mock chatService before store import ───────────────────────────────────
vi.mock( '../services/chatService', () => ( {
  chatService: {
    streamChat: vi.fn(),
  },
} ) )

import { chatService } from '../services/chatService'
import { useChatStore } from './chatStore'

describe( 'chatStore — Zero Point Terminal', () => {
  beforeEach( () => {
    setActivePinia( createPinia() )
    vi.clearAllMocks()
  } )

  // ─── Initial State ──────────────────────────────────────────────────────
  it( 'initializes with a single welcome message from the assistant', () => {
    const store = useChatStore()

    expect( store.messages ).toHaveLength( 1 )
    expect( store.messages[0].role ).toBe( 'assistant' )
    expect( store.messages[0].content ).toContain( 'Terminale Punto Zero' )
    expect( store.isLoading ).toBe( false )
    expect( store.isStreaming ).toBe( false )
    expect( store.threadId ).toBeNull()
  } )

  // ─── sendMessage: guards ────────────────────────────────────────────────
  it( 'does not send an empty message', async () => {
    const store = useChatStore()
    await store.sendMessage( '   ' )

    expect( chatService.streamChat ).not.toHaveBeenCalled()
    expect( store.messages ).toHaveLength( 1 ) // Only welcome message
  } )

  it( 'does not send while already loading', async () => {
    const store = useChatStore()
    store.isLoading = true
    await store.sendMessage( 'Test message' )

    expect( chatService.streamChat ).not.toHaveBeenCalled()
  } )

  it( 'does not send while already streaming', async () => {
    const store = useChatStore()
    store.isStreaming = true
    await store.sendMessage( 'Test message' )

    expect( chatService.streamChat ).not.toHaveBeenCalled()
  } )

  // ─── sendMessage: happy path ─────────────────────────────────────────────
  it( 'adds user message and assistant placeholder, then completes stream', async () => {
    const store = useChatStore()

    vi.mocked( chatService.streamChat ).mockImplementation(
      async ( _content, _threadId, onDelta, onDone ) => {
        onDelta( 'Risposta ' )
        onDelta( 'dal Matrix.' )
        onDone()
      }
    )

    await store.sendMessage( 'Ciao Terminale' )

    // User message added
    expect( store.messages[1].role ).toBe( 'user' )
    expect( store.messages[1].content ).toBe( 'Ciao Terminale' )

    // Assistant response assembled from deltas
    expect( store.messages[2].role ).toBe( 'assistant' )
    expect( store.messages[2].content ).toBe( 'Risposta dal Matrix.' )

    // State cleaned up
    expect( store.isLoading ).toBe( false )
    expect( store.isStreaming ).toBe( false )
  } )

  // ─── sendMessage: error path ─────────────────────────────────────────────
  it( 'marks message as error and preserves original input on stream failure', async () => {
    const store = useChatStore()

    vi.mocked( chatService.streamChat ).mockImplementation(
      async ( _content, _threadId, _onDelta, _onDone, onError ) => {
        onError( { message: 'Connessione persa', category: 'network' } )
      }
    )

    await store.sendMessage( 'Query pericolosa' )

    const errorMsg = store.messages[store.messages.length - 1]
    expect( errorMsg.role ).toBe( 'error' )
    expect( errorMsg.content ).toContain( 'ERRORE DI SINCRONIZZAZIONE' )
    expect( errorMsg.originalInput ).toBe( 'Query pericolosa' )
    expect( store.isLoading ).toBe( false )
    expect( store.isStreaming ).toBe( false )
  } )

  // ─── resetChat ───────────────────────────────────────────────────────────
  it( 'resets all state on resetChat', async () => {
    const store = useChatStore()

    vi.mocked( chatService.streamChat ).mockImplementation(
      async ( _c, _t, onDelta, onDone ) => { onDelta( 'ciao' ); onDone() }
    )
    await store.sendMessage( 'Messaggio precedente' )
    expect( store.messages.length ).toBeGreaterThan( 1 )

    store.resetChat()

    expect( store.messages ).toHaveLength( 1 )
    expect( store.messages[0].content ).toContain( 'MEMORIA PURGATA' )
    expect( store.threadId ).toBeNull()
    expect( store.isLoading ).toBe( false )
    expect( store.isStreaming ).toBe( false )
  } )

  // ─── retryMessage ────────────────────────────────────────────────────────
  it( 'removes error and user messages then resends on retryMessage', async () => {
    const store = useChatStore()

    // First call: trigger error
    vi.mocked( chatService.streamChat ).mockImplementationOnce(
      async ( _c, _t, _d, _done, onError ) => {
        onError( { message: 'Timeout', category: 'timeout' } )
      }
    )
    await store.sendMessage( 'Direttiva originale' )
    expect( store.messages.some( m => m.role === 'error' ) ).toBe( true )

    // Second call: success on retry
    vi.mocked( chatService.streamChat ).mockImplementationOnce(
      async ( _c, _t, onDelta, onDone ) => { onDelta( 'OK' ); onDone() }
    )
    await store.retryMessage( 'Direttiva originale' )

    expect( store.messages.every( m => m.role !== 'error' ) ).toBe( true )
    const lastMsg = store.messages[store.messages.length - 1]
    expect( lastMsg.role ).toBe( 'assistant' )
    expect( lastMsg.content ).toBe( 'OK' )
  } )
} )
