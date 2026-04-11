import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

/**
 * Authentication Store for Joule: Zero Point.
 * Handles user session state, token persistence, and login/logout logic.
 */
export const useAuthStore = defineStore('auth', () => {
  // State: Initialized from localStorage to maintain session across refreshes
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || '')
  
  /**
   * Computed property to check if a user is currently authenticated.
   */
  const isLoggedIn = computed(() => !!token.value)
  
  /**
   * Updates the authentication state and persists credentials to localStorage.
   * @param newToken - JWT token received from Atlas Backend.
   * @param newUsername - Username of the authenticated operator.
   */
  function setAuth(newToken: string, newUsername: string) {
    token.value = newToken
    username.value = newUsername
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
  }
  
  /**
   * Clears the current session and removes credentials from persistence layers.
   */
  function logout() {
    token.value = null
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }
  
  /**
   * Synchronizes the internal state with the browser's persistent storage.
   */
  function initialize() {
    token.value = localStorage.getItem('token') || null
    username.value = localStorage.getItem('username') || ''
  }

  return { token, username, isLoggedIn, setAuth, logout, initialize }
})
