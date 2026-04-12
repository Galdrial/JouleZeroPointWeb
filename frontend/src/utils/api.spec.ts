import type { InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { applyAuthHeaders, handleApiError } from './api'

describe( 'api helpers', () => {
  it( 'injects Authorization and x-user headers when auth state exists', () => {
    const config = {
      headers: {},
    } as InternalAxiosRequestConfig

    const result = applyAuthHeaders( config, {
      token: 'jwt-token',
      username: 'zinzengame',
    } )

    expect( result.headers.Authorization ).toBe( 'Bearer jwt-token' )
    expect( result.headers['x-user'] ).toBe( 'zinzengame' )
  } )

  it( 'does not inject auth headers when session is empty', () => {
    const config = {
      headers: {},
    } as InternalAxiosRequestConfig

    const result = applyAuthHeaders( config, {
      token: null,
      username: '',
    } )

    expect( result.headers.Authorization ).toBeUndefined()
    expect( result.headers['x-user'] ).toBeUndefined()
  } )

  it( 'logs out and redirects on 401 outside login page', async () => {
    const logout = vi.fn()
    const notifications = { error: vi.fn(), warn: vi.fn() }
    const locationLike = { pathname: '/profile', href: '/profile' }
    const error = {
      response: {
        status: 401,
        data: { error: 'Sessione scaduta' },
      },
    }

    await expect( handleApiError( error, { logout }, notifications, locationLike ) ).rejects.toBe( error )

    expect( logout ).toHaveBeenCalledTimes( 1 )
    expect( notifications.error ).toHaveBeenCalledWith( 'Sessione scaduta' )
    expect( locationLike.href ).toBe( '/login?session_expired=1' )
  } )

  it( 'keeps user on login page and shows auth error on 401 there', async () => {
    const logout = vi.fn()
    const notifications = { error: vi.fn(), warn: vi.fn() }
    const locationLike = { pathname: '/login', href: '/login' }
    const error = {
      response: {
        status: 401,
        data: { error: 'Credenziali errate' },
      },
    }

    await expect( handleApiError( error, { logout }, notifications, locationLike ) ).rejects.toBe( error )

    expect( logout ).not.toHaveBeenCalled()
    expect( notifications.error ).toHaveBeenCalledWith( 'Credenziali errate' )
    expect( locationLike.href ).toBe( '/login' )
  } )

  it( 'routes validation and generic backend errors to warnings/errors', async () => {
    const notifications = { error: vi.fn(), warn: vi.fn() }
    const logout = vi.fn()

    await expect(
      handleApiError( { response: { status: 422, data: { error: 'Payload non valido' } } }, { logout }, notifications, {
        pathname: '/',
        href: '/',
      } ),
    ).rejects.toBeTruthy()

    await expect(
      handleApiError( { response: { status: 500, data: {} } }, { logout }, notifications, {
        pathname: '/',
        href: '/',
      } ),
    ).rejects.toBeTruthy()

    expect( notifications.warn ).toHaveBeenCalledWith( 'Payload non valido' )
    expect( notifications.error ).toHaveBeenCalledWith( 'Rilevata dissonanza nel Backend. Prego riprovare più tardi.' )
  } )
} )
