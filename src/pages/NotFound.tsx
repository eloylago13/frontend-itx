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
          className="font-medium text-neutral-900 underline hover:no-underline"
        >
          Volver al inicio
        </a>
      </p>
    </section>
  )
}
