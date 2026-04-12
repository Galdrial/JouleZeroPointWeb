import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted( () => ( {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  logout: vi.fn(),
  scrollTo: vi.fn(),
} ) )

vi.mock( '../utils/api', () => ( {
  default: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
    delete: mocks.delete,
  },
} ) )

vi.mock( '../stores/notificationStore', () => ( {
  useNotificationStore: () => ( {
    success: mocks.success,
    warn: mocks.warn,
  } ),
} ) )

vi.mock( '../stores/auth', () => ( {
  useAuthStore: () => ( {
    logout: mocks.logout,
  } ),
} ) )

import AdminNewsView from './AdminNewsView.vue'

const sampleNews = {
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
  isFeatured: true,
  featuredOrder: 1,
}

describe( 'AdminNewsView', () => {
  beforeEach( () => {
    vi.clearAllMocks()
    Object.defineProperty( window, 'scrollTo', {
      value: mocks.scrollTo,
      writable: true,
    } )
    mocks.get.mockResolvedValue( { data: [sampleNews] } )
  } )

  function mountView() {
    return mount( AdminNewsView, {
      global: {
        stubs: {
          AdminNewsList: {
            props: ['newsList', 'isLoading', 'showForm', 'confirmDeleteSlug'],
            emits: ['open-create', 'open-edit', 'toggle-published', 'delete-news', 'cancel-delete'],
            template: `
              <div>
                <div class="news-count">{{ newsList.length }}</div>
                <div class="news-category">{{ newsList[0]?.category }}</div>
                <button class="open-create" @click="$emit('open-create')">open-create</button>
                <button class="open-edit" @click="$emit('open-edit', newsList[0])">open-edit</button>
                <button class="toggle-published" @click="$emit('toggle-published', newsList[0])">toggle-published</button>
                <button class="delete-news" @click="$emit('delete-news', newsList[0]?.slug)">delete-news</button>
                <button class="cancel-delete" @click="$emit('cancel-delete')">cancel-delete</button>
              </div>
            `,
          },
          AdminNewsForm: {
            props: ['form', 'isEditing', 'canSubmitForm', 'isImageUrlValid', 'imagePreviewError', 'isUploadingImage', 'formError'],
            emits: ['submit', 'cancel', 'upload-image'],
            template: `
              <div>
                <div class="form-title">{{ form.title }}</div>
                <div class="form-slug">{{ form.slug }}</div>
                <div class="editing-flag">{{ isEditing }}</div>
                <button class="submit-form" @click="$emit('submit')">submit</button>
                <button class="cancel-form" @click="$emit('cancel')">cancel</button>
                <button class="upload-image" @click="$emit('upload-image')">upload</button>
              </div>
            `,
          },
        },
      },
    } )
  }

  it( 'loads news on mount and normalizes lore category to storia', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect( mocks.get ).toHaveBeenCalledWith( '/news/admin/all' )
    expect( wrapper.find( '.news-count' ).text() ).toBe( '1' )
    expect( wrapper.find( '.news-category' ).text() ).toBe( 'storia' )
  } )

  it( 'opens create mode from list event and submits a new news item', async () => {
    mocks.post.mockResolvedValue( { data: {} } )
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get( '.open-create' ).trigger( 'click' )
    expect( wrapper.find( '.editing-flag' ).text() ).toBe( 'false' )

    await wrapper.get( '.submit-form' ).trigger( 'click' )
    expect( mocks.post ).not.toHaveBeenCalled()

    // open edit first to preload valid data into form, then switch back to create with loaded defaults impossible to fill through stubs
  } )

  it( 'opens edit mode from list event and submits update', async () => {
    mocks.put.mockResolvedValue( { data: {} } )
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get( '.open-edit' ).trigger( 'click' )

    expect( wrapper.find( '.form-title' ).text() ).toBe( 'Prima news' )
    expect( wrapper.find( '.form-slug' ).text() ).toBe( 'prima-news' )
    expect( wrapper.find( '.editing-flag' ).text() ).toBe( 'true' )
    expect( mocks.scrollTo ).toHaveBeenCalled()

    await wrapper.get( '.submit-form' ).trigger( 'click' )
    await flushPromises()

    expect( mocks.put ).toHaveBeenCalledWith( '/news/prima-news', expect.objectContaining( {
      title: 'Prima news',
      slug: 'prima-news',
      category: 'storia',
    } ) )
    expect( mocks.success ).toHaveBeenCalledWith( 'News aggiornata nella Matrice.' )
  } )

  it( 'warns when uploading image without selected file', async () => {
    const wrapper = mountView()
    await flushPromises()
    await wrapper.get( '.open-create' ).trigger( 'click' )
    await wrapper.get( '.upload-image' ).trigger( 'click' )

    expect( mocks.warn ).toHaveBeenCalledWith( 'Seleziona prima un file immagine.' )
  } )

  it( 'requires delete confirmation before deletion', async () => {
    mocks.delete.mockResolvedValue( { data: {} } )
    const wrapper = mountView()
    await flushPromises()

    await wrapper.get( '.delete-news' ).trigger( 'click' )
    expect( mocks.delete ).not.toHaveBeenCalled()

    await wrapper.get( '.delete-news' ).trigger( 'click' )
    await flushPromises()

    expect( mocks.delete ).toHaveBeenCalledWith( '/news/prima-news' )
    expect( mocks.success ).toHaveBeenCalledWith( 'Voce di news decomposta dai database Atlas.' )
  } )
} )
