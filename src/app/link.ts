import type { MouseEvent } from 'react'
import { navigate } from './router'

/**
 * Navegación SPA compartida para anchors internos.
 * Ignora clics ya gestionados, no principales o con modificadores
 * (para respetar abrir-en-pestaña, etc.); si no, hace SPA-navigate.
 */
export function goTo(e: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
    return
  }
  e.preventDefault()
  navigate(href)
}
