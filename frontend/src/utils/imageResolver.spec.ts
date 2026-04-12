import { describe, expect, it, vi } from 'vitest'
import { resolveNewsImage } from './imageResolver'

describe( 'resolveNewsImage', () => {
  it( 'returns empty string for nullish values', () => {
    expect( resolveNewsImage( undefined ) ).toBe( '' )
    expect( resolveNewsImage( null ) ).toBe( '' )
    expect( resolveNewsImage( '' ) ).toBe( '' )
  } )

  it( 'returns remote and data URLs unchanged', () => {
    expect( resolveNewsImage( 'https://cdn.example.com/img.jpg' ) ).toBe( 'https://cdn.example.com/img.jpg' )
    expect( resolveNewsImage( 'http://cdn.example.com/img.jpg' ) ).toBe( 'http://cdn.example.com/img.jpg' )
    expect( resolveNewsImage( 'data:image/png;base64,abc' ) ).toBe( 'data:image/png;base64,abc' )
  } )

  it( 'resolves backend-hosted news assets from VITE_API_URL', () => {
    vi.stubEnv( 'VITE_API_URL', 'https://api.joulezero.com/api/v1' )
    expect( resolveNewsImage( '/news/cover.jpg' ) ).toBe( 'https://api.joulezero.com/news/cover.jpg' )
    expect( resolveNewsImage( 'news/cover.jpg' ) ).toBe( 'https://api.joulezero.com/news/cover.jpg' )
  } )

  it( 'keeps local frontend paths unchanged when not backend news assets', () => {
    expect( resolveNewsImage( '/images/local.jpg' ) ).toBe( '/images/local.jpg' )
    expect( resolveNewsImage( 'assets/hero.webp' ) ).toBe( 'assets/hero.webp' )
  } )
} )
