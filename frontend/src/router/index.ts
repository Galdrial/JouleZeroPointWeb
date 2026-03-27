import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter( {
  history: createWebHistory( import.meta.env.BASE_URL ),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/cards',
      name: 'cards',
      component: () => import( '../views/CardsView.vue' )
    },
    {
      path: '/login',
      name: 'login',
      component: () => import( '../views/LoginView.vue' )
    },
    {
      path: '/deckbuilder',
      name: 'deckbuilder',
      component: () => import( '../views/DeckbuilderView.vue' ),
      meta: { requiresAuth: true }
    },
    {
      path: '/public-decks',
      name: 'public-decks',
      component: () => import( '../views/PublicDecksView.vue' )
    },
    {
      path: '/news',
      name: 'news-archive',
      component: () => import( '../views/NewsArchiveView.vue' )
    },
    {
      path: '/news/:slug',
      name: 'news-detail',
      component: () => import( '../views/NewsDetailView.vue' )
    },
    {
      path: '/terminale-punto-zero',
      name: 'oracle',
      component: () => import( '../views/TerminalView.vue' ),
      meta: { hideUI: true }
    },
    {
      path: '/admin/news',
      name: 'admin-news',
      component: () => import( '../views/AdminNewsView.vue' ),
      meta: { hideUI: true }
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import( '../views/ProfileView.vue' ),
      meta: { requiresAuth: true }
    }
  ]
} )

router.beforeEach( ( to, _from, next ) => {
  const isAuthenticated = localStorage.getItem( 'username' );
  if ( to.meta.requiresAuth && !isAuthenticated ) {
    next( { name: 'login', query: { redirect: to.fullPath } } );
  } else {
    next();
  }
} );

export default router
