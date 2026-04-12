import { describe, expect, it } from 'vitest'
import { resolveAuthRedirect } from './index'

describe( 'router auth guard', () => {
  it( 'redirects anonymous users from auth routes to login with redirect query', () => {
    const result = resolveAuthRedirect(
      {
        fullPath: '/deckbuilder',
        meta: { requiresAuth: true },
      },
      {
        isLoggedIn: false,
        isAdmin: false,
      },
    )

    expect( result ).toEqual( { name: 'login', query: { redirect: '/deckbuilder' } } )
  } )

  it( 'redirects anonymous users from admin routes to login', () => {
    const result = resolveAuthRedirect(
      {
        fullPath: '/admin/news',
        meta: { requiresAdmin: true },
      },
      {
        isLoggedIn: false,
        isAdmin: false,
      },
    )

    expect( result ).toEqual( { name: 'login', query: { redirect: '/admin/news' } } )
  } )

  it( 'redirects logged-in non-admin users away from admin routes', () => {
    const result = resolveAuthRedirect(
      {
        fullPath: '/admin/news',
        meta: { requiresAdmin: true },
      },
      {
        isLoggedIn: true,
        isAdmin: false,
      },
    )

    expect( result ).toEqual( { name: 'home' } )
  } )

  it( 'allows admin users on admin routes', () => {
    const result = resolveAuthRedirect(
      {
        fullPath: '/admin/news',
        meta: { requiresAdmin: true },
      },
      {
        isLoggedIn: true,
        isAdmin: true,
      },
    )

    expect( result ).toBeNull()
  } )
} )
