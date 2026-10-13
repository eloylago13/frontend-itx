import { useCallback, useEffect, useMemo, useState } from 'react'
import { getProducts } from '../lib/apiClient'
import type { ProductListItem } from '../lib/types'
import { SearchBar } from '../components/SearchBar'
import { ProductCard } from '../components/ProductCard'

type Status = 'loading' | 'error' | 'ready'

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function matchesQuery(product: ProductListItem, query: string): boolean {
  if (query === '') {
    return true
  }
  const haystack = normalize(`${product.brand} ${product.model}`)
  return haystack.includes(query)
}

function formatCount(count: number): string {
  return count === 1 ? '1 producto' : `${count} productos`
}

export function ProductList(): JSX.Element {
  const [products, setProducts] = useState<ProductListItem[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [query, setQuery] = useState('')
  const [attempt, setAttempt] = useState(0)

  const load = useCallback(async (signal: AbortSignal) => {
    setStatus('loading')
    setErrorMessage('')
    try {
      const items = await getProducts(signal)
      setProducts(items)
      setStatus('ready')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar los productos.')
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => {
      controller.abort()
    }
  }, [load, attempt])

  const normalizedQuery = normalize(query)
  const filtered = useMemo(
    () => products.filter((product) => matchesQuery(product, normalizedQuery)),
    [products, normalizedQuery],
  )

  const retry = (): void => {
    setAttempt((current) => current + 1)
  }

  return (
    <section className="space-y-6" aria-labelledby="catalog-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 id="catalog-title" className="text-2xl font-bold tracking-tight text-neutral-900">
            Catálogo
          </h1>
          <p className="text-sm text-neutral-600" aria-live="polite">
            {status === 'loading' ? 'Cargando productos…' : formatCount(filtered.length)}
          </p>
        </div>
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {status === 'loading' && (
        <div role="status" aria-label="Cargando productos" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <div className="aspect-square animate-pulse bg-neutral-100" />
              <div className="space-y-2 p-4">
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-100" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>
      )}

      {status === 'error' && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-900">No se pudo cargar el catálogo</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && filtered.length === 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-neutral-900">
            {products.length === 0 ? 'No hay productos disponibles' : `Sin resultados para "${query.trim()}"`}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {products.length === 0
              ? 'Vuelve a intentarlo más tarde.'
              : 'Prueba con otra marca o modelo, o limpia la búsqueda.'}
          </p>
          {products.length > 0 && normalizedQuery !== '' && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {status === 'ready' && filtered.length > 0 && (
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
