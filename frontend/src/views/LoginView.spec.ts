import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted( () => ( {
  push: vi.fn(),
  post: vi.fn(),
  setAuth: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
  route: { query: {} as Record<string, unknown> },
} ) )

vi.mock( 'vue-router', () => ( {
  useRouter: () => ( { push: mocks.push } ),
  useRoute: () => mocks.route,
} ) )

vi.mock( '../utils/api', () => ( {
  default: { post: mocks.post },
} ) )

vi.mock( '../stores/auth', () => ( {
  useAuthStore: () => ( {
    setAuth: mocks.setAuth,
  } ),
} ) )

vi.mock( '../stores/notificationStore', () => ( {
  useNotificationStore: () => ( {
    success: mocks.success,
    error: mocks.error,
  } ),
} ) )

import LoginView from './LoginView.vue'

describe( 'LoginView', () => {
  beforeEach( () => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mocks.route.query = {}
  } )

  it( 'logs in successfully, stores session and redirects', async () => {
    mocks.post.mockResolvedValue( {
      data: {
        token: 'jwt-token',
        username: 'Simone',
        isAdmin: true,
      },
    } )

    const wrapper = mount( LoginView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    } )

    await wrapper.get( 'input[type="email"]' ).setValue( 'simone@example.com' )
    await wrapper.get( 'input[type="password"]' ).setValue( 'password123' )
    await wrapper.get( 'form' ).trigger( 'submit.prevent' )
    await flushPromises()

    expect( mocks.post ).toHaveBeenCalledWith( '/auth/login', {
      email: 'simone@example.com',
      password: 'password123',
    } )
    expect( mocks.setAuth ).toHaveBeenCalledWith( 'jwt-token', 'Simone', true )
    expect( mocks.success ).toHaveBeenCalled()

    vi.advanceTimersByTime( 800 )
    expect( mocks.push ).toHaveBeenCalledWith( '/' )
  } )

  it( 'blocks registration with mismatched passwords before API call', async () => {
    mocks.route.query = { mode: 'register' }

    const wrapper = mount( LoginView, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
        },
      },
    } )

    const inputs = wrapper.findAll( 'input' )
    await inputs[0].setValue( 'Simone' )
    await inputs[1].setValue( 'simone@example.com' )
    await inputs[2].setValue( 'password123' )
    await inputs[3].setValue( 'different123' )
    await inputs[4].setValue( true )

    await wrapper.get( 'form' ).trigger( 'submit.prevent' )
    await flushPromises()

    expect( mocks.post ).not.toHaveBeenCalled()
    expect( mocks.error ).toHaveBeenCalledWith( 'Errore crittografico: Le Passphrase non combaciano.' )
  } )
} )
