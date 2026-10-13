import { useEffect, useState } from 'react'
import { PRODUCT_ID_PATTERN } from '../lib/apiClient'

export type Route = { name: 'list' } | { name: 'detail'; id: string } | { name: 'not-found' }

const PRODUCT_PREFIX = '/product/'

function stripQueryAndHash(path: string): string {
  const queryIndex = path.search(/[?#]/)
  return queryIndex === -1 ? path : path.slice(0, queryIndex)
}

/**
 * Convierte un path en una ruta de la shell.
 * - `/` → list
 * - `/product/:id` (id válido) → detail
 * - resto → not-found
 */
export function parseRoute(path: string): Route {
  const pathname = stripQueryAndHash(path)

  if (pathname === '/') {
    return { name: 'list' }
  }

  if (pathname.startsWith(PRODUCT_PREFIX)) {
    const rest = pathname.slice(PRODUCT_PREFIX.length)
    if (rest.length > 0 && !rest.includes('/') && PRODUCT_ID_PATTERN.test(rest)) {
      return { name: 'detail', id: rest }
    }
    return { name: 'not-found' }
  }

  return { name: 'not-found' }
}

function getCurrentRoute(): Route {
  if (typeof window === 'undefined') {
    return { name: 'list' }
  }
  return parseRoute(window.location.pathname)
}

/**
 * Navegación SPA sin dependencias: pushState + aviso popstate.
 * Solo acepta rutas internas (`/...`); el resto se ignora.
 */
export function navigate(to: string): void {
  if (!to.startsWith('/') || to.startsWith('//')) {
    return
  }
  window.history.pushState(null, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

/** Suscribe la ruta actual; se actualiza con back/forward y con `navigate()`. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(getCurrentRoute)

  useEffect(() => {
    const onPopState = (): void => {
      setRoute(parseRoute(window.location.pathname))
    }
    window.addEventListener('popstate', onPopState)
    return () => {
      window.removeEventListener('popstate', onPopState)
    }
  }, [])

  return route
}
