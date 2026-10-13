import { goTo } from '../app/link'
import { useCart } from '../app/store'

export type Crumb = {
  label: string
  href?: string
}

export function Header({ crumbs }: { crumbs: Crumb[] }): JSX.Element {
  const { count } = useCart()

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 p-4">
        <a
          href="/"
          aria-label="ITX inicio"
          onClick={(e) => goTo(e, '/')}
          className="text-lg font-bold tracking-tight text-neutral-900 hover:underline"
        >
          ITX
        </a>
        <span
          data-testid="cart-badge"
          aria-live="polite"
          aria-label={`Carrito, ${count} artículos`}
          className="inline-flex min-w-8 items-center justify-center rounded-full bg-neutral-900 px-2 py-1 text-xs font-semibold text-white"
        >
          {count}
        </span>
      </div>
      <nav aria-label="Breadcrumb" className="mx-auto w-full max-w-6xl px-4 pb-3">
        <ol className="flex flex-wrap items-center gap-1 text-sm text-neutral-600">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            const key = `${index}-${crumb.label}`
            return (
              <li key={key} className="flex items-center gap-1">
                {index > 0 && (
                  <span aria-hidden="true" className="text-neutral-400">
                    /
                  </span>
                )}
                {crumb.href !== undefined && !isLast ? (
                  <a href={crumb.href} onClick={(e) => goTo(e, crumb.href as string)} className="hover:underline">
                    {crumb.label}
                  </a>
                ) : (
                  <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'font-medium text-neutral-900' : ''}>
                    {crumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </header>
  )
}
