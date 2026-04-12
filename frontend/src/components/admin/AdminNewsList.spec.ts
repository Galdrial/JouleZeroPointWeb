import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminNewsList from './AdminNewsList.vue'

const sampleNews = [
  {
    id: 1,
    slug: 'prima-news',
    title: 'Prima news',
    summary: 'Summary',
    content: 'Content',
    category: 'news' as const,
    imageUrl: '/news/cover.jpg',
    sourceUrl: '',
    publishedAt: '2026-04-12T12:00:00.000Z',
    isPublished: true,
    isFeatured: true,
    featuredOrder: 1,
  },
]

function createProps( overrides = {} ) {
  return {
    newsList: sampleNews,
    isLoading: false,
    showForm: false,
    confirmDeleteSlug: '',
    ...overrides,
  }
}

describe( 'AdminNewsList', () => {
  it( 'renders loading and empty states correctly', () => {
    const loadingWrapper = mount( AdminNewsList, {
      props: createProps( { isLoading: true, newsList: [] } ),
    } )
    expect( loadingWrapper.text() ).toContain( 'Caricamento…' )

    const emptyWrapper = mount( AdminNewsList, {
      props: createProps( { newsList: [] } ),
    } )
    expect( emptyWrapper.text() ).toContain( 'Nessuna news presente.' )
  } )

  it( 'emits create, edit and toggle events', async () => {
    const wrapper = mount( AdminNewsList, {
      props: createProps(),
    } )

    await wrapper.get( 'button.btn-primary' ).trigger( 'click' )
    const buttons = wrapper.findAll( 'button' )
    await buttons[1].trigger( 'click' )
    await buttons[2].trigger( 'click' )

    expect( wrapper.emitted( 'open-create' ) ).toHaveLength( 1 )
    expect( wrapper.emitted( 'toggle-published' )?.[0][0] ).toEqual( sampleNews[0] )
    expect( wrapper.emitted( 'open-edit' )?.[0][0] ).toEqual( sampleNews[0] )
  } )

  it( 'emits delete and cancel actions in confirmation state', async () => {
    const wrapper = mount( AdminNewsList, {
      props: createProps( { confirmDeleteSlug: 'prima-news' } ),
    } )

    expect( wrapper.text() ).toContain( 'Sicuro?' )

    const deleteConfirmButton = wrapper.findAll( 'button' ).find( ( button ) =>
      button.text().includes( 'Sì, elimina' ),
    )
    const cancelButton = wrapper.findAll( 'button' ).find( ( button ) =>
      button.text().trim() === 'No',
    )

    await deleteConfirmButton!.trigger( 'click' )
    await cancelButton!.trigger( 'click' )

    expect( wrapper.emitted( 'delete-news' )?.[0][0] ).toBe( 'prima-news' )
    expect( wrapper.emitted( 'cancel-delete' ) ).toHaveLength( 1 )
  } )

  it( 'shows badges and image link for featured published news', () => {
    const wrapper = mount( AdminNewsList, {
      props: createProps(),
    } )

    expect( wrapper.text() ).toContain( 'Pubblicata' )
    expect( wrapper.text() ).toContain( 'News' )
    expect( wrapper.text() ).toContain( 'Evidenza' )
    expect( wrapper.find( 'a[target="_blank"]' ).attributes( 'href' ) ).toContain( '/news/cover.jpg' )
  } )
} )
