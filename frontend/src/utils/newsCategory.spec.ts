import { describe, expect, it } from 'vitest'
import {
  getNewsCategoryLabel,
  isStoryCategory,
  normalizeNewsCategory,
} from './newsCategory'

describe( 'newsCategory utils', () => {
  it( 'identifies story categories correctly', () => {
    expect( isStoryCategory( 'storia' ) ).toBe( true )
    expect( isStoryCategory( 'lore' ) ).toBe( true )
    expect( isStoryCategory( 'news' ) ).toBe( false )
    expect( isStoryCategory( undefined ) ).toBe( false )
  } )

  it( 'normalizes categories for API compatibility', () => {
    expect( normalizeNewsCategory( 'lore' ) ).toBe( 'storia' )
    expect( normalizeNewsCategory( 'storia' ) ).toBe( 'storia' )
    expect( normalizeNewsCategory( 'news' ) ).toBe( 'news' )
    expect( normalizeNewsCategory( 'unknown' ) ).toBe( 'news' )
  } )

  it( 'provides UI labels with optional uppercase', () => {
    expect( getNewsCategoryLabel( 'news' ) ).toBe( 'News' )
    expect( getNewsCategoryLabel( 'lore' ) ).toBe( 'Storia' )
    expect( getNewsCategoryLabel( 'news', { uppercase: true } ) ).toBe( 'NEWS' )
    expect( getNewsCategoryLabel( 'storia', { uppercase: true } ) ).toBe( 'STORIA' )
  } )
} )
