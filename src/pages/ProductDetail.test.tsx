import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider } from '../app/store.tsx'
import { Header } from '../components/Header.tsx'
import type { ReactNode } from 'react'
import { ProductDetail } from './ProductDetail.tsx'

function renderWithCart(ui: ReactNode): ReturnType<typeof render> {
  return render(<CartProvider>{ui}</CartProvider>)
}

const FULL_DETAIL = {
  id: 'Zm9gEo2TpmwZfzUVPVPbw',
  brand: 'Acer',
  model: 'Liquid Z410',
  price: '199',
  imgUrl: 'https://example.com/acer-z410.jpg',
  cpu: 'Quad-core 1.3 GHz Cortex-A53',
  ram: '2GB RAM',
  os: 'Android 4.4.2 (KitKat)',
  displaySize: '4.5 inches',
  displayResolution: '540x960 pixels',
  battery: 'Li-Ion 1750 mAh',
  primaryCamera: ['5 MP', 'autofocus'],
  secondaryCmera: ['2 MP'],
  dimentions: '136 x 66.7 x 9.9 mm',
  weight: '145 g',
  internalMemory: ['8GB'],
  colors: ['Black', 'White'],
  options: {
    colors: [
      { code: 1000, name: 'Black' },
      { code: 1001, name: 'White' },
    ],
    storages: [
      { code: 2000, name: '8GB' },
      { code: 2001, name: '16GB' },
    ],
  },
}

const SINGLE_OPTION_DETAIL = {
  ...FULL_DETAIL,
  id: 'solo-1',
  options: {
    colors: [{ code: 7, name: 'Black' }],
    storages: [{ code: 9, name: '8GB' }],
  },
}

function mockFetchOk(payload: unknown): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    }),
  )
}

function mockFetchPending(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => new Promise(() => {})),
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.history.pushState(null, '', '/product/Zm9gEo2TpmwZfzUVPVPbw')
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.pushState(null, '', '/')
})

describe('H3 PDP: detalle', () => {
  it('renderiza las 11 specs (incluidos typos secondaryCmera y dimentions)', async () => {
    mockFetchOk(FULL_DETAIL)
    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    expect(await screen.findByRole('heading', { level: 1, name: /Acer Liquid Z410/i })).toBeInTheDocument()

    const specs = screen.getByLabelText('Especificaciones')
    expect(specs).toBeInTheDocument()
    // 11 filas: Marca, Modelo, Precio, CPU, RAM, SO, Resolución, Batería, Cámaras, Dimensiones, Peso
    const terms = ['Marca', 'Modelo', 'Precio', 'CPU', 'RAM', 'Sistema operativo', 'Resolución de pantalla', 'Batería', 'Cámaras', 'Dimensiones', 'Peso']
    for (const term of terms) {
      expect(screen.getByText(term, { selector: 'dt' })).toBeInTheDocument()
    }

    expect(screen.getByText('Acer')).toBeInTheDocument()
    expect(screen.getByText('Liquid Z410')).toBeInTheDocument()
    expect(screen.getAllByText('199 €').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Quad-core 1.3 GHz Cortex-A53')).toBeInTheDocument()
    expect(screen.getByText('2GB RAM')).toBeInTheDocument()
    expect(screen.getByText('Android 4.4.2 (KitKat)')).toBeInTheDocument()
    // displaySize + displayResolution unidos
    expect(screen.getByText('4.5 inches · 540x960 pixels')).toBeInTheDocument()
    expect(screen.getByText('Li-Ion 1750 mAh')).toBeInTheDocument()
    // primaria (array unido con ·) + frontal
    expect(screen.getByText('5 MP · autofocus · 2 MP')).toBeInTheDocument()
    expect(screen.getByText('136 x 66.7 x 9.9 mm')).toBeInTheDocument()
    expect(screen.getByText('145 g')).toBeInTheDocument()

    // Imagen principal con alt y eager
    const img = screen.getByRole('img', { name: /Acer Liquid Z410/i })
    expect(img).toHaveAttribute('loading', 'eager')
  })

  it('selectores con opciones y default único preseleccionado', async () => {
    mockFetchOk(SINGLE_OPTION_DETAIL)
    const user = userEvent.setup()
    const { unmount } = renderWithCart(<ProductDetail id="solo-1" />)

    const storage = (await screen.findByLabelText(/Almacenamiento/i)) as HTMLSelectElement
    const color = screen.getByLabelText(/Color/i) as HTMLSelectElement

    expect(storage.value).toBe('9')
    expect(color.value).toBe('7')
    expect(storage).toHaveDisplayValue('8GB')
    expect(color).toHaveDisplayValue('Black')

    // Botón Añadir habilitado con la opción única preseleccionada (H4 funcional)
    expect(screen.getByRole('button', { name: /^Añadir$/i })).toBeEnabled()

    // Interacción: con múltiples opciones se puede cambiar
    unmount()
    mockFetchOk(FULL_DETAIL)
    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)
    const storageMulti = (await screen.findAllByLabelText(/Almacenamiento/i)).at(-1) as HTMLSelectElement
    await user.selectOptions(storageMulti, '2001')
    expect(storageMulti.value).toBe('2001')
  })

  it('usa fallback a internalMemory/colors cuando no hay options', async () => {
    const fallback = { ...FULL_DETAIL, options: undefined }
    mockFetchOk(fallback)
    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    const storage = (await screen.findByLabelText(/Almacenamiento/i)) as HTMLSelectElement
    expect(storage.value).toBe('0')
    expect(storage).toHaveDisplayValue('8GB')
  })

  it('muestra skeleton de 2 columnas mientras carga', () => {
    mockFetchPending()
    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    expect(screen.getByRole('status', { name: /cargando detalle/i })).toBeInTheDocument()
  })

  it('muestra error con reintentar y recupera al reintentar', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn()
    fetchMock.mockRejectedValueOnce(new Error('No se pudo cargar el producto: sin conexión con https://x.'))
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => FULL_DETAIL,
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /reintentar/i }))

    expect(await screen.findByRole('heading', { level: 1, name: /Acer Liquid Z410/i })).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('muestra not-found ante 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) }),
    )
    renderWithCart(<ProductDetail id="no-existe" />)

    expect(await screen.findByRole('heading', { level: 1, name: /producto no encontrado/i })).toBeInTheDocument()
  })

  it('volver navega a /', async () => {
    mockFetchOk(FULL_DETAIL)
    const user = userEvent.setup()
    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    await screen.findByRole('heading', { level: 1 })
    await user.click(screen.getByRole('link', { name: /volver al catálogo/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
  })
})

describe('H4 PDP: añadir a la cesta', () => {
  function mockFetchDetailAndCart(options: {
    detail?: unknown
    cart?: { ok: boolean; status: number; payload: unknown }
  }): { fetchMock: ReturnType<typeof vi.fn>; cartBodies: unknown[] } {
    const detailPayload = options.detail ?? FULL_DETAIL
    const cartResponse = options.cart ?? { ok: true, status: 200, payload: { count: 5 } }
    const cartBodies: unknown[] = []
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url.endsWith('/api/cart') && method === 'POST') {
        cartBodies.push(JSON.parse(String(init?.body ?? 'null')))
        return {
          ok: cartResponse.ok,
          status: cartResponse.status,
          json: async () => cartResponse.payload,
        }
      }
      if (url.includes('/api/product/')) {
        return { ok: true, status: 200, json: async () => detailPayload }
      }
      throw new Error(`fetch inesperado: ${method} ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)
    return { fetchMock, cartBodies }
  }

  it('POST con payload exacto y éxito actualiza el badge del header', async () => {
    const user = userEvent.setup()
    const { fetchMock, cartBodies } = mockFetchDetailAndCart({})

    render(
      <CartProvider>
        <Header crumbs={[]} />
        <ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />
      </CartProvider>,
    )

    const addButton = await screen.findByRole('button', { name: /^Añadir$/i })
    expect(addButton).toBeEnabled()
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('0')

    await user.click(addButton)

    // Estado intermedio: el POST usa la primera opción por defecto (storage 2000, color 1000).
    await waitFor(() => {
      expect(cartBodies).toHaveLength(1)
    })
    expect(cartBodies[0]).toEqual({
      id: 'Zm9gEo2TpmwZfzUVPVPbw',
      colorCode: 1000,
      storageCode: 2000,
    })
    const postCall = fetchMock.mock.calls.find(([url, init]) => {
      const method = ((init as RequestInit | undefined)?.method ?? 'GET').toUpperCase()
      return String(url).endsWith('/api/cart') && method === 'POST'
    })
    expect(postCall).toBeDefined()

    expect(await screen.findByText('Añadido a la cesta')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('cart-badge')).toHaveTextContent('5')
    })
  })

  it('muestra estado Añadiendo… y luego éxito', async () => {
    const user = userEvent.setup()
    let resolveCart!: (value: { ok: boolean; status: number; json: () => Promise<unknown> }) => void
    const cartGate = new Promise<{ ok: boolean; status: number; json: () => Promise<unknown> }>((resolve) => {
      resolveCart = resolve
    })
    const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input)
      const method = (init?.method ?? 'GET').toUpperCase()
      if (url.endsWith('/api/cart') && method === 'POST') {
        return cartGate
      }
      return { ok: true, status: 200, json: async () => FULL_DETAIL }
    })
    vi.stubGlobal('fetch', fetchMock)

    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    const addButton = await screen.findByRole('button', { name: /^Añadir$/i })
    await user.click(addButton)

    expect(await screen.findByRole('button', { name: /Añadiendo…/i })).toBeDisabled()

    resolveCart({ ok: true, status: 200, json: async () => ({ count: 2 }) })
    expect(await screen.findByText('Añadido a la cesta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Añadir$/i })).toBeEnabled()
  })

  it('error muestra alert genérico, no actualiza el badge y re-habilita el botón', async () => {
    const user = userEvent.setup()
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      mockFetchDetailAndCart({ cart: { ok: false, status: 500, payload: {} } })

      render(
        <CartProvider>
          <Header crumbs={[]} />
          <ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />
        </CartProvider>,
      )

      const addButton = await screen.findByRole('button', { name: /^Añadir$/i })
      await user.click(addButton)

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent('No se pudo añadir a la cesta. Inténtalo de nuevo.')
      // Sin stack en la UI: mensaje genérico exacto, sin estado HTTP ni trazas.
      expect(alert.textContent).toBe('No se pudo añadir a la cesta. Inténtalo de nuevo.')
      expect(screen.queryByText('Añadido a la cesta')).not.toBeInTheDocument()

      const enabledButton = screen.getByRole('button', { name: /^Añadir$/i })
      expect(enabledButton).toBeEnabled()
      expect(screen.getByTestId('cart-badge')).toHaveTextContent('0')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('botón deshabilitado sin selección cuando no hay opciones', async () => {
    const withoutOptions = { ...FULL_DETAIL, options: undefined, internalMemory: [], colors: [] }
    mockFetchDetailAndCart({ detail: withoutOptions })
    renderWithCart(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    expect(await screen.findByText(/No hay opciones disponibles/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Añadir$/i })).toBeDisabled()
  })
})
