import { goTo } from '../app/link'

type PlaceholderDetailProps = {
  id: string
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
          onClick={(e) => goTo(e, '/')}
          className="font-medium text-neutral-900 underline hover:no-underline"
        >
          Volver al catálogo
        </a>
      </p>
    </section>
  )
}
