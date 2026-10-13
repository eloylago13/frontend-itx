import { useEffect, useState } from 'react'

export type Route = { name: 'list' } | { name: 'detail'; id: string } | { name: 'not-found' }

export const PRODUCT_ID_PATTERN = /^[A-Za-z0-9-_]+$/

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

/** Navegación SPA sin dependencias: pushState + aviso popstate. */
export function navigate(to: string): void {
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
