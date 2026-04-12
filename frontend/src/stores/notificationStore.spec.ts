import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNotificationStore } from './notificationStore'

describe( 'notificationStore', () => {
  beforeEach( () => {
    setActivePinia( createPinia() )
    vi.useFakeTimers()
  } )

  it( 'adds notifications with incremental ids', () => {
    const store = useNotificationStore()

    const firstId = store.success( 'Operazione completata' )
    const secondId = store.warn( 'Attenzione' )

    expect( firstId ).toBe( 0 )
    expect( secondId ).toBe( 1 )
    expect( store.notifications ).toHaveLength( 2 )
    expect( store.notifications[0].type ).toBe( 'success' )
    expect( store.notifications[1].type ).toBe( 'warning' )
  } )

  it( 'removes notifications manually by id', () => {
    const store = useNotificationStore()
    const id = store.info( 'Messaggio info' )

    store.removeNotification( id )

    expect( store.notifications ).toHaveLength( 0 )
  } )

  it( 'auto-dismisses notifications after duration', () => {
    const store = useNotificationStore()
    store.addNotification( 'Temporaneo', 'info', 1000 )

    expect( store.notifications ).toHaveLength( 1 )

    vi.advanceTimersByTime( 1000 )

    expect( store.notifications ).toHaveLength( 0 )
  } )

  it( 'keeps persistent notifications when duration is 0', () => {
    const store = useNotificationStore()
    store.addNotification( 'Persistente', 'error', 0 )

    vi.advanceTimersByTime( 10000 )

    expect( store.notifications ).toHaveLength( 1 )
    expect( store.notifications[0].message ).toBe( 'Persistente' )
  } )
} )
