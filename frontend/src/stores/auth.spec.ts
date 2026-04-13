import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from './auth'

describe( 'auth store', () => {
  beforeEach( () => {
    localStorage.clear()
    setActivePinia( createPinia() )
  } )

  it( 'sets auth state and persists to localStorage', () => {
    const store = useAuthStore()

    store.setAuth( 'jwt-token', 'simone', true, 'simone@joule.zero' )

    expect( store.isLoggedIn ).toBe( true )
    expect( store.username ).toBe( 'simone' )
    expect( store.email ).toBe( 'simone@joule.zero' )
    expect( store.isAdmin ).toBe( true )
    expect( localStorage.getItem( 'token' ) ).toBe( 'jwt-token' )
    expect( localStorage.getItem( 'username' ) ).toBe( 'simone' )
    expect( localStorage.getItem( 'email' ) ).toBe( 'simone@joule.zero' )
    expect( localStorage.getItem( 'isAdmin' ) ).toBe( 'true' )
  } )

  it( 'logout resets auth state and clears persistence', () => {
    const store = useAuthStore()
    store.setAuth( 'jwt-token', 'simone', true, 'simone@joule.zero' )

    store.logout()

    expect( store.isLoggedIn ).toBe( false )
    expect( store.username ).toBe( '' )
    expect( store.email ).toBe( '' )
    expect( store.isAdmin ).toBe( false )
    expect( localStorage.getItem( 'token' ) ).toBeNull()
    expect( localStorage.getItem( 'username' ) ).toBeNull()
    expect( localStorage.getItem( 'email' ) ).toBeNull()
    expect( localStorage.getItem( 'isAdmin' ) ).toBeNull()
  } )

  it( 'initialize hydrates state from localStorage', () => {
    localStorage.setItem( 'token', 'hydrated-token' )
    localStorage.setItem( 'username', 'zinzengame' )
    localStorage.setItem( 'email', 'zinzen@matrix.com' )
    localStorage.setItem( 'isAdmin', 'true' )

    const store = useAuthStore()
    store.initialize()

    expect( store.token ).toBe( 'hydrated-token' )
    expect( store.username ).toBe( 'zinzengame' )
    expect( store.email ).toBe( 'zinzen@matrix.com' )
    expect( store.isAdmin ).toBe( true )
    expect( store.isLoggedIn ).toBe( true )
  } )
} )
