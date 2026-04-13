import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../utils/api'

/**
 * Authentication Store for Joule: Zero Point.
 * Handles user session state, token persistence, and login/logout logic.
 */
export const useAuthStore = defineStore( 'auth', () => {
  // State: Initialized from localStorage to maintain session across refreshes
  const token = ref( localStorage.getItem( 'token' ) || null )
  const username = ref( localStorage.getItem( 'username' ) || '' )
  const email = ref( localStorage.getItem( 'email' ) || '' )
  const isAdmin = ref( localStorage.getItem( 'isAdmin' ) === 'true' )

  /**
   * Computed property to check if a user is currently authenticated.
   */
  const isLoggedIn = computed( () => !!token.value )

  /**
   * Updates the authentication state and persists credentials to localStorage.
   */
  function setAuth( newToken: string, newUsername: string, newIsAdmin: boolean = false, newEmail: string = '' ) {
    token.value = newToken
    username.value = newUsername
    email.value = newEmail
    isAdmin.value = newIsAdmin
    localStorage.setItem( 'token', newToken )
    localStorage.setItem( 'username', newUsername )
    localStorage.setItem( 'email', newEmail )
    localStorage.setItem( 'isAdmin', String( newIsAdmin ) )
  }

  /**
   * Clears the current session and removes credentials from persistence layers.
   */
  async function logout() {
    try {
      if ( token.value ) {
        await api.post( '/auth/logout' )
      }
    } catch ( error ) {
      console.warn( 'Logout protocol dissonance (Backend already cleared or unreachable):', error )
    } finally {
      token.value = null
      username.value = ''
      email.value = ''
      isAdmin.value = false
      localStorage.removeItem( 'token' )
      localStorage.removeItem( 'username' )
      localStorage.removeItem( 'email' )
      localStorage.removeItem( 'isAdmin' )
    }
  }

  /**
   * Synchronizes profile updates with the backend and local state.
   */
  async function updateProfile( data: { username?: string, password?: string } ) {
    try {
      const response = await api.put( '/auth/profile', data )
      const { token: newToken, username: newUsername, isAdmin: newIsAdmin, email: newEmail } = response.data
      setAuth( newToken, newUsername, !!newIsAdmin, newEmail )
      return response.data
    } catch ( error ) {
      throw error
    }
  }

  /**
   * Protocol: Trigger Passphrase Recovery
   * Requests a reset link via email using the established security pathway.
   */
  async function requestPasswordReset( emailValue: string ) {
    await api.post( '/auth/forgot-password', { email: emailValue } )
    return true
  }

  /**
   * Synchronizes the internal state with the browser's persistent storage.
   */
  function initialize() {
    token.value = localStorage.getItem( 'token' ) || null
    username.value = localStorage.getItem( 'username' ) || ''
    email.value = localStorage.getItem( 'email' ) || ''
    isAdmin.value = localStorage.getItem( 'isAdmin' ) === 'true'
  }

  return { token, username, email, isLoggedIn, isAdmin, setAuth, logout, updateProfile, requestPasswordReset, initialize }
} )
