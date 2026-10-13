import type { MouseEvent } from 'react'
import { navigate } from '../app/router'

function go(e: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
    return
  }
  e.preventDefault()
  navigate(href)
}

/** Placeholder H1: H2 lo reemplazará por el PLP real. Sin fetching. */
export function PlaceholderList(): JSX.Element {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Catálogo (placeholder H1)</h1>
      <p className="text-sm text-neutral-600">H2 implementará el listado real de productos.</p>
      <p className="text-sm">
        <a
          href="/product/demo-1"
          onClick={(e) => go(e, '/product/demo-1')}
          className="font-medium text-neutral-900 underline hover:no-underline"
        >
          Ver producto demo-1
        </a>
      </p>
    </section>
  )
}
