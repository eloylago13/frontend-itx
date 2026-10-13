import { useCallback, useEffect, useState } from 'react'
import { goTo } from '../app/link'
import { useCart } from '../app/store'
import { addToCart, getProduct } from '../lib/apiClient'
import type { ProductDetail as ProductDetailData } from '../lib/types'
import { ProductImage } from '../components/ProductImage'
import { ProductOptions } from '../components/ProductOptions'
import { getColorOptions, getStorageOptions } from '../lib/productOptions'
import { ProductSpecs } from '../components/ProductSpecs'

type ProductDetailProps = {
  id: string
  onLoaded?: (label: string) => void
}

type Status = 'loading' | 'error' | 'not-found' | 'ready'

const NOT_FOUND_MESSAGE = 'Producto no encontrado'

function formatPrice(price: string | undefined): string {
  const trimmed = typeof price === 'string' ? price.trim() : ''
  if (trimmed === '') {
    return 'Precio no disponible'
  }
  if (/€|\$/.test(trimmed)) {
    return trimmed
  }
  return `${trimmed} €`
}

export function ProductDetail({ id, onLoaded }: ProductDetailProps): JSX.Element {
  const { setCount } = useCart()
  const [detail, setDetail] = useState<ProductDetailData | null>(null)
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [storage, setStorage] = useState<number | undefined>(undefined)
  const [color, setColor] = useState<number | undefined>(undefined)
  const [adding, setAdding] = useState(false)
  const [cartFeedback, setCartFeedback] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const load = useCallback(
    async (signal: AbortSignal) => {
      setStatus('loading')
      setErrorMessage('')
      setCartFeedback(null)
      setAdding(false)
      try {
        const data = await getProduct(id, signal)
        setDetail(data)
        onLoaded?.(`${data.brand} ${data.model}`)
        const storages = getStorageOptions(data)
        const colors = getColorOptions(data)
        setStorage(storages.length > 0 ? storages[0].code : undefined)
        setColor(colors.length > 0 ? colors[0].code : undefined)
        setStatus('ready')
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        const message = error instanceof Error ? error.message : 'No se pudo cargar el producto.'
        if (message === NOT_FOUND_MESSAGE) {
          setDetail(null)
          setStatus('not-found')
          return
        }
        setErrorMessage(message)
        setStatus('error')
      }
    },
    [id, onLoaded],
  )

  useEffect(() => {
    const controller = new AbortController()
    void load(controller.signal)
    return () => {
      controller.abort()
    }
  }, [load, attempt])

  useEffect(() => {
    if (status !== 'ready') {
      return
    }
    const heading = document.querySelector('main h1')
    if (heading instanceof HTMLElement) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }, [status])

  const retry = (): void => {
    setAttempt((current) => current + 1)
  }

  const handleAdd = async (): Promise<void> => {
    if (detail === null || storage === undefined || color === undefined || adding) {
      return
    }
    setAdding(true)
    setCartFeedback(null)
    try {
      const count = await addToCart({ id: detail.id, colorCode: color, storageCode: storage })
      setCount(count)
      setCartFeedback({ kind: 'success', text: 'Añadido a la cesta' })
    } catch (error) {
      // Detalle técnico solo a consola: la UI muestra un mensaje genérico sin stack.
      console.error(error)
      setCartFeedback({ kind: 'error', text: 'No se pudo añadir a la cesta. Inténtalo de nuevo.' })
    } finally {
      setAdding(false)
    }
  }

  const canAdd = detail !== null && storage !== undefined && color !== undefined && !adding

  if (status === 'loading') {
    return (
      <section className="space-y-4" aria-label="Cargando detalle del producto">
        <p className="text-sm">
          <a
            href="/"
            onClick={(e) => goTo(e, '/')}
            className="font-medium text-neutral-900 underline hover:no-underline"
          >
            Volver al catálogo
          </a>
        </p>
        <div
          role="status"
          aria-label="Cargando detalle"
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="aspect-square animate-pulse bg-neutral-100" />
          </div>
          <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="h-7 w-2/3 animate-pulse rounded bg-neutral-100" />
            <div className="h-5 w-1/4 animate-pulse rounded bg-neutral-100" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-10 w-full animate-pulse rounded-xl bg-neutral-100" />
            <div className="h-10 w-1/2 animate-pulse rounded-full bg-neutral-100" />
          </div>
        </div>
      </section>
    )
  }

  if (status === 'not-found') {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Producto no encontrado</h1>
        <p className="text-sm text-neutral-600">No hemos encontrado ese producto en el catálogo.</p>
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

  if (status === 'error') {
    return (
      <section className="space-y-4">
        <p className="text-sm">
          <a
            href="/"
            onClick={(e) => goTo(e, '/')}
            className="font-medium text-neutral-900 underline hover:no-underline"
          >
            Volver al catálogo
          </a>
        </p>
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-semibold text-red-900">No se pudo cargar el producto</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Reintentar
          </button>
        </div>
      </section>
    )
  }

  if (detail === null) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Producto no encontrado</h1>
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

  return (
    <section className="space-y-6" aria-labelledby="pdp-title">
      <p className="text-sm">
        <a
          href="/"
          onClick={(e) => goTo(e, '/')}
          className="font-medium text-neutral-900 underline hover:no-underline"
        >
          Volver al catálogo
        </a>
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="bg-neutral-50 p-6">
            <ProductImage brand={detail.brand} model={detail.model} imgUrl={detail.imgUrl} />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
          <div className="space-y-1">
            <h1 id="pdp-title" className="text-2xl font-bold tracking-tight text-neutral-900">
              {detail.brand} {detail.model}
            </h1>
            <p className="text-lg font-bold text-neutral-900">{formatPrice(detail.price)}</p>
          </div>

          <ProductOptions
            detail={detail}
            storage={storage}
            color={color}
            onStorageChange={setStorage}
            onColorChange={setColor}
          />

          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={!canAdd}
            className={
              canAdd
                ? 'w-full rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2'
                : 'w-full cursor-not-allowed rounded-full bg-neutral-200 px-5 py-2.5 text-sm font-semibold text-neutral-500'
            }
          >
            {adding ? 'Añadiendo…' : 'Añadir'}
          </button>
          {cartFeedback !== null &&
            (cartFeedback.kind === 'success' ? (
              <p role="status" className="text-sm font-medium text-green-700">
                {cartFeedback.text}
              </p>
            ) : (
              <p role="alert" className="text-sm font-medium text-red-700">
                {cartFeedback.text}
              </p>
            ))}
        </div>
      </div>

      <ProductSpecs detail={detail} />
    </section>
  )
}
