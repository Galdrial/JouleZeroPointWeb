import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { isJwtExpired, useAuthStore } from './auth'

const createToken = ( exp: number ) => {
  const encode = ( value: object ) => btoa( JSON.stringify( value ) ).replace( /\+/g, '-' ).replace( /\//g, '_' ).replace( /=+$/, '' )
  return `${ encode( { alg: 'HS256', typ: 'JWT' } ) }.${ encode( { id: 'user-id', exp } ) }.signature`
}

describe( 'auth store', () => {
  beforeEach( () => {
    localStorage.clear()
    setActivePinia( createPinia() )
  } )

  it( 'sets auth state and persists to localStorage', () => {
    const store = useAuthStore()
    const validToken = createToken( Math.floor( Date.now() / 1000 ) + 3600 )

    store.setAuth( validToken, 'simone', true, 'simone@joule.zero' )

    expect( store.isLoggedIn ).toBe( true )
    expect( store.username ).toBe( 'simone' )
    expect( store.email ).toBe( 'simone@joule.zero' )
    expect( store.isAdmin ).toBe( true )
    expect( localStorage.getItem( 'token' ) ).toBe( validToken )
    expect( localStorage.getItem( 'username' ) ).toBe( 'simone' )
    expect( localStorage.getItem( 'email' ) ).toBe( 'simone@joule.zero' )
    expect( localStorage.getItem( 'isAdmin' ) ).toBe( 'true' )
  } )

  it( 'logout resets auth state and clears persistence', async () => {
    const store = useAuthStore()
    store.setAuth( createToken( Math.floor( Date.now() / 1000 ) + 3600 ), 'simone', true, 'simone@joule.zero' )

    await store.logout()

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
    const validToken = createToken( Math.floor( Date.now() / 1000 ) + 3600 )
    localStorage.setItem( 'token', validToken )
    localStorage.setItem( 'username', 'zinzengame' )
    localStorage.setItem( 'email', 'zinzen@matrix.com' )
    localStorage.setItem( 'isAdmin', 'true' )

    const store = useAuthStore()
    store.initialize()

    expect( store.token ).toBe( validToken )
    expect( store.username ).toBe( 'zinzengame' )
    expect( store.email ).toBe( 'zinzen@matrix.com' )
    expect( store.isAdmin ).toBe( true )
    expect( store.isLoggedIn ).toBe( true )
  } )

  it( 'clears expired persisted sessions during initialization', () => {
    localStorage.setItem( 'token', createToken( 1 ) )
    localStorage.setItem( 'username', 'zinzengame' )
    localStorage.setItem( 'email', 'zinzen@matrix.com' )
    localStorage.setItem( 'isAdmin', 'true' )

    const store = useAuthStore()
    store.initialize()

    expect( store.isLoggedIn ).toBe( false )
    expect( store.username ).toBe( '' )
    expect( localStorage.getItem( 'token' ) ).toBeNull()
  } )

  it( 'treats malformed tokens as expired', () => {
    expect( isJwtExpired( 'token-non-valido' ) ).toBe( true )
  } )
} )
