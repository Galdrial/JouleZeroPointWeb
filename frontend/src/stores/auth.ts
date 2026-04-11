import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Authentication Store for Joule: Zero Point.
 * Handles user session state, token persistence, and login/logout logic.
 */
export const useAuthStore = defineStore( 'auth', () => {
  // State: Initialized from localStorage to maintain session across refreshes
  const token = ref( localStorage.getItem( 'token' ) || null )
  const username = ref( localStorage.getItem( 'username' ) || '' )
  const isAdmin = ref( localStorage.getItem( 'isAdmin' ) === 'true' )

  /**
   * Computed property to check if a user is currently authenticated.
   */
  const isLoggedIn = computed( () => !!token.value )

  /**
   * Updates the authentication state and persists credentials to localStorage.
   * @param newToken - JWT token received from Atlas Backend.
   * @param newUsername - Username of the authenticated operator.
     * @param newIsAdmin - Whether the user has administrative privileges.
   */
  function setAuth( newToken: string, newUsername: string, newIsAdmin: boolean = false ) {
    token.value = newToken
    username.value = newUsername
    isAdmin.value = newIsAdmin
    localStorage.setItem( 'token', newToken )
    localStorage.setItem( 'username', newUsername )
    localStorage.setItem( 'isAdmin', String( newIsAdmin ) )
  }

  /**
   * Clears the current session and removes credentials from persistence layers.
   */
  function logout() {
    token.value = null
    username.value = ''
    isAdmin.value = false
    localStorage.removeItem( 'token' )
    localStorage.removeItem( 'username' )
    localStorage.removeItem( 'isAdmin' )
  }

  /**
   * Synchronizes the internal state with the browser's persistent storage.
   */
  function initialize() {
    token.value = localStorage.getItem( 'token' ) || null
    username.value = localStorage.getItem( 'username' ) || ''
    isAdmin.value = localStorage.getItem( 'isAdmin' ) === 'true'
  }

  return { token, username, isLoggedIn, isAdmin, setAuth, logout, initialize }
} )
