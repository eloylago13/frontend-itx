import { goTo } from '../app/link'

export function NotFound(): JSX.Element {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-bold">404 — Página no encontrada</h1>
      <p className="text-sm text-neutral-600">La ruta solicitada no existe o el identificador no es válido.</p>
      <p className="text-sm">
        <a
          href="/"
          onClick={(e) => goTo(e, '/')}
          className="rounded-sm font-medium text-neutral-900 underline hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        >
          Volver al inicio
        </a>
      </p>
    </section>
  )
}
