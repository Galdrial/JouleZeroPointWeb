import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../stores/auth'
import { chatService } from './chatService'

describe( 'chatService', () => {
  beforeEach( () => {
    setActivePinia( createPinia() )
    vi.clearAllMocks()
  } )

  it( 'sends the bearer token when the user is authenticated', async () => {
    const authStore = useAuthStore()
    authStore.setAuth( 'jwt-token', 'simone' )

    const fetchMock = vi.fn().mockResolvedValue( {
      ok: false,
      status: 500,
    } )
    vi.stubGlobal( 'fetch', fetchMock )

    await chatService.streamChat(
      'stato della partita',
      null,
      vi.fn(),
      vi.fn(),
      vi.fn(),
    )

    expect( fetchMock ).toHaveBeenCalledWith(
      '/api/v1/terminal/chat',
      expect.objectContaining( {
        headers: expect.objectContaining( {
          Authorization: 'Bearer jwt-token',
          'x-user': 'simone',
        } ),
      } ),
    )
  } )

  it( 'keeps anonymous terminal requests anonymous', async () => {
    const fetchMock = vi.fn().mockResolvedValue( {
      ok: false,
      status: 500,
    } )
    vi.stubGlobal( 'fetch', fetchMock )

    await chatService.streamChat(
      'ciao',
      null,
      vi.fn(),
      vi.fn(),
      vi.fn(),
    )

    const [, options] = fetchMock.mock.calls[0]
    expect( options.headers ).not.toHaveProperty( 'Authorization' )
    expect( options.headers ).toMatchObject( {
      'Content-Type': 'application/json',
      'x-user': '',
    } )
  } )
} )
