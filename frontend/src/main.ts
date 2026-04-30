import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createHead } from '@unhead/vue/client'
import './style.css'
import App from './App.vue'
import router from './router'

window.addEventListener( 'vite:preloadError', () => {
  const reloadKey = 'joule-chunk-reload-attempted'

  if ( sessionStorage.getItem( reloadKey ) === '1' ) return

  sessionStorage.setItem( reloadKey, '1' )
  window.location.reload()
} )

window.addEventListener( 'load', () => {
  sessionStorage.removeItem( 'joule-chunk-reload-attempted' )
} )

const app = createApp(App)
const pinia = createPinia()
const head = createHead()

app.use(pinia)
app.use(router)
app.use(head)
app.mount('#app')
