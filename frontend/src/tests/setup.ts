import { afterEach, beforeEach, vi } from 'vitest'

function createLocalStorageMock() {
  const store = new Map<string, string>()

  return {
    getItem: ( key: string ) => ( store.has( key ) ? store.get( key )! : null ),
    setItem: ( key: string, value: string ) => {
      store.set( key, String( value ) )
    },
    removeItem: ( key: string ) => {
      store.delete( key )
    },
    clear: () => {
      store.clear()
    },
    key: ( index: number ) => Array.from( store.keys() )[index] ?? null,
    get length() {
      return store.size
    },
  }
}

if ( typeof globalThis.localStorage?.clear !== 'function' ) {
  Object.defineProperty( globalThis, 'localStorage', {
    value: createLocalStorageMock(),
    configurable: true,
    writable: true,
  } )
}

beforeEach( () => {
  localStorage.clear()
} )

afterEach( () => {
  vi.unstubAllEnvs()
} )
