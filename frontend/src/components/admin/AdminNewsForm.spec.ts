import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AdminNewsForm from './AdminNewsForm.vue'

function createProps( overrides = {} ) {
  return {
    form: {
      slug: 'test-news',
      title: 'Test title',
      summary: 'Test summary',
      content: 'Test content',
      category: 'news' as const,
      imageUrl: '',
      sourceUrl: '',
      publishedAt: '2026-04-12T12:00',
      isPublished: true,
      isFeatured: false,
      featuredOrder: null,
    },
    isEditing: false,
    canSubmitForm: true,
    isImageUrlValid: true,
    imagePreviewError: false,
    isUploadingImage: false,
    formError: '',
    ...overrides,
  }
}

describe( 'AdminNewsForm', () => {
  it( 'renders create state and emits cancel/submit actions', async () => {
    const wrapper = mount( AdminNewsForm, { props: createProps() } )

    expect( wrapper.text() ).toContain( 'Nuova news' )

    await wrapper.get( 'button.btn-ghost' ).trigger( 'click' )
    await wrapper.get( 'button.btn-primary' ).trigger( 'click' )

    expect( wrapper.emitted( 'cancel' ) ).toHaveLength( 1 )
    expect( wrapper.emitted( 'submit' ) ).toHaveLength( 1 )
  } )

  it( 'disables submit when form cannot be submitted and emits upload events', async () => {
    const wrapper = mount( AdminNewsForm, {
      props: createProps( { canSubmitForm: false, isUploadingImage: true } ),
    } )

    const buttons = wrapper.findAll( 'button' )
    const uploadButton = buttons[1]
    const submitButton = buttons[2]

    expect( submitButton.attributes( 'disabled' ) ).toBeDefined()
    expect( uploadButton.attributes( 'disabled' ) ).toBeDefined()

    await wrapper.get( 'input[type="file"]' ).trigger( 'change' )

    expect( wrapper.emitted( 'image-file-change' ) ).toHaveLength( 1 )
  } )

  it( 'emits image preview error when preview image fails to load', async () => {
    const wrapper = mount( AdminNewsForm, {
      props: createProps( {
        form: {
          ...createProps().form,
          imageUrl: '/news/cover.jpg',
        },
        isImageUrlValid: true,
      } ),
    } )

    await wrapper.get( 'img' ).trigger( 'error' )

    expect( wrapper.emitted( 'image-preview-error' ) ).toHaveLength( 1 )
  } )

  it( 'shows inline image validation and preview errors', () => {
    const wrapper = mount( AdminNewsForm, {
      props: createProps( {
        form: {
          ...createProps().form,
          imageUrl: 'invalid-url',
        },
        isImageUrlValid: false,
      } ),
    } )

    expect( wrapper.text() ).toContain( 'URL non valido' )
  } )
} )
