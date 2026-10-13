import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductDetail } from './ProductDetail.tsx'

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
  window.history.pushState(null, '', '/product/Zm9gEo2TpmwZfzUVPVPbw')
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.pushState(null, '', '/')
})

describe('H3 PDP: detalle', () => {
  it('renderiza las 11 specs (incluidos typos secondaryCmera y dimentions)', async () => {
    mockFetchOk(FULL_DETAIL)
    render(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

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
    const { unmount } = render(<ProductDetail id="solo-1" />)

    const storage = (await screen.findByLabelText(/Almacenamiento/i)) as HTMLSelectElement
    const color = screen.getByLabelText(/Color/i) as HTMLSelectElement

    expect(storage.value).toBe('9')
    expect(color.value).toBe('7')
    expect(storage).toHaveDisplayValue('8GB')
    expect(color).toHaveDisplayValue('Black')

    // Botón añadir deshabilitado (POST en H4)
    expect(screen.getByRole('button', { name: /Añadir \(disponible en H4\)/i })).toBeDisabled()

    // Interacción: con múltiples opciones se puede cambiar
    unmount()
    mockFetchOk(FULL_DETAIL)
    render(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)
    const storageMulti = (await screen.findAllByLabelText(/Almacenamiento/i)).at(-1) as HTMLSelectElement
    await user.selectOptions(storageMulti, '2001')
    expect(storageMulti.value).toBe('2001')
  })

  it('usa fallback a internalMemory/colors cuando no hay options', async () => {
    const fallback = { ...FULL_DETAIL, options: undefined }
    mockFetchOk(fallback)
    render(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    const storage = (await screen.findByLabelText(/Almacenamiento/i)) as HTMLSelectElement
    expect(storage.value).toBe('0')
    expect(storage).toHaveDisplayValue('8GB')
  })

  it('muestra skeleton de 2 columnas mientras carga', () => {
    mockFetchPending()
    render(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

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

    render(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

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
    render(<ProductDetail id="no-existe" />)

    expect(await screen.findByRole('heading', { level: 1, name: /producto no encontrado/i })).toBeInTheDocument()
  })

  it('volver navega a /', async () => {
    mockFetchOk(FULL_DETAIL)
    const user = userEvent.setup()
    render(<ProductDetail id="Zm9gEo2TpmwZfzUVPVPbw" />)

    await screen.findByRole('heading', { level: 1 })
    await user.click(screen.getByRole('link', { name: /volver al catálogo/i }))

    await waitFor(() => {
      expect(window.location.pathname).toBe('/')
    })
  })
})
