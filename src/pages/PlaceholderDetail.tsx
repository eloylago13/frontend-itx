import type { MouseEvent } from 'react'
import { navigate } from '../app/router'

type PlaceholderDetailProps = {
  id: string
}

function go(e: MouseEvent<HTMLAnchorElement>, href: string): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) {
    return
  }
  e.preventDefault()
  navigate(href)
}

/** Placeholder H1: H3 lo reemplazará por el PDP real. Sin fetching. */
export function PlaceholderDetail({ id }: PlaceholderDetailProps): JSX.Element {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">Producto {id} (placeholder H1)</h1>
      <p className="text-sm text-neutral-600">H3 implementará el detalle real del producto.</p>
      <p className="text-sm">
        <a
          href="/"
          onClick={(e) => go(e, '/')}
          className="font-medium text-neutral-900 underline hover:no-underline"
        >
          Volver al catálogo
        </a>
      </p>
    </section>
  )
}
