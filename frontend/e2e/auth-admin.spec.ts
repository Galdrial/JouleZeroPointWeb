import { expect, test } from '@playwright/test'

test.describe( 'auth and admin flows', () => {
  test( 'anonymous user is redirected from admin page to login with redirect query', async ( { page } ) => {
    await page.goto( '/admin/news' )

    await expect( page ).toHaveURL( /\/login\?redirect=\/admin\/news/ )
    await expect( page.getByRole( 'heading', { name: /accesso costruttori/i } ) ).toBeVisible()
  } )

  test( 'successful admin login redirects to admin area and loads news list', async ( { page } ) => {
    await page.route( '**/api/v1/auth/login', async ( route ) => {
      await route.fulfill( {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify( {
          token: 'jwt-token',
          username: 'zinzengame',
          isAdmin: true,
        } ),
      } )
    } )

    await page.route( '**/api/v1/news/admin/all', async ( route ) => {
      await route.fulfill( {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify( [
          {
            id: 1,
            slug: 'prima-news',
            title: 'Prima news',
            summary: 'Summary',
            content: 'Content',
            category: 'lore',
            imageUrl: '/news/cover.jpg',
            sourceUrl: '',
            publishedAt: '2026-04-12T12:00:00.000Z',
            isPublished: true,
            isFeatured: false,
            featuredOrder: null,
          },
        ] ),
      } )
    } )

    await page.goto( '/login?redirect=/admin/news' )
    await page.getByPlaceholder( /frequenza temporale/i ).fill( 'simone@example.com' )
    await page.getByPlaceholder( /passphrase/i ).fill( 'password123' )
    await page.getByRole( 'button', { name: /sincronizzazione/i } ).click()

    await expect( page ).toHaveURL( /\/admin\/news/ )
    await expect( page.getByText( 'JOULE — PANNELLO NEWS' ) ).toBeVisible()
    await expect( page.getByText( 'Prima news' ) ).toBeVisible()

    await expect.poll( async () => page.evaluate( () => localStorage.getItem( 'isAdmin' ) ) ).toBe( 'true' )
  } )

  test( 'non-admin local session is redirected from admin route back to home', async ( { page } ) => {
    await page.addInitScript( () => {
      localStorage.setItem( 'token', 'jwt-token' )
      localStorage.setItem( 'username', 'simone' )
      localStorage.setItem( 'isAdmin', 'false' )
    } )

    await page.route( '**/api/v1/cards', async ( route ) => {
      await route.fulfill( {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify( [] ),
      } )
    } )

    await page.route( '**/api/v1/news**', async ( route ) => {
      await route.fulfill( {
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify( [] ),
      } )
    } )

    await page.goto( '/admin/news' )

    await expect( page ).toHaveURL( 'http://127.0.0.1:4173/' )
    await expect( page.getByText( /stato matrice/i ) ).toBeVisible()
  } )
} )
