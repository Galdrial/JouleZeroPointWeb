import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const username = ref(localStorage.getItem('username') || '')
  
  const isLoggedIn = computed(() => !!token.value)
  
  function setAuth(newToken: string, newUsername: string) {
    token.value = newToken
    username.value = newUsername
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', newUsername)
  }
  
  function logout() {
    token.value = null
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }
  
  function initialize() {
    token.value = localStorage.getItem('token') || null
    username.value = localStorage.getItem('username') || ''
  }

  return { token, username, isLoggedIn, setAuth, logout, initialize }
})
