import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductList } from './ProductList.tsx'

const SAMPLE = [
  { id: 'a1', brand: 'Apple', model: 'iPhone 13', price: '799', imgUrl: 'https://example.com/a.jpg' },
  { id: 'b2', brand: 'Samsung', model: 'Galaxy S22', price: '699', imgUrl: 'https://example.com/b.jpg' },
]

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

function mockFetchHttpError(status: number): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status,
      json: async () => ({}),
    }),
  )
}

beforeEach(() => {
  window.history.pushState(null, '', '/')
  window.localStorage.clear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('H2 PLP: ProductList', () => {
  it('renderiza la lista mockeada con contador y enlaces a detalle', async () => {
    mockFetchOk(SAMPLE)
    render(<ProductList />)

    expect(screen.getByRole('status', { name: /cargando productos/i })).toBeInTheDocument()

    expect(await screen.findByRole('link', { name: /ver apple iphone 13/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver samsung galaxy s22/i })).toBeInTheDocument()

    expect(screen.getByText('2 productos')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: /buscar productos/i })).toHaveAttribute(
      'placeholder',
      'Buscar por marca o modelo…',
    )

    // Las imágenes son decorativas (el enlace ya nombra marca+modelo).
    const images = document.querySelectorAll('section img')
    expect(images).toHaveLength(2)
    for (const img of images) {
      expect(img).toHaveAttribute('loading', 'lazy')
    }
  })

  it('filtra en tiempo real por marca y modelo (case-insensitive, trim, espacios)', async () => {
    mockFetchOk(SAMPLE)
    const user = userEvent.setup()
    render(<ProductList />)
    await screen.findByRole('link', { name: /ver apple/i })

    const search = screen.getByRole('searchbox', { name: /buscar productos/i })

    await user.type(search, 'apple')
    expect(screen.queryByRole('link', { name: /ver samsung/i })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver apple/i })).toBeInTheDocument()
    expect(screen.getByText('1 producto')).toBeInTheDocument()

    await user.clear(search)
    await user.type(search, '  GALAXY   s22  ')
    expect(screen.getByRole('link', { name: /ver samsung/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ver apple/i })).not.toBeInTheDocument()

    // Botón limpiar (×) vacía el campo y restaura la lista.
    await user.click(screen.getByRole('button', { name: /limpiar búsqueda/i }))
    expect(search).toHaveValue('')
    expect(screen.getByRole('link', { name: /ver apple/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver samsung/i })).toBeInTheDocument()
  })

  it('muestra estado vacío con opción de limpiar la búsqueda', async () => {
    mockFetchOk(SAMPLE)
    const user = userEvent.setup()
    render(<ProductList />)
    await screen.findByRole('link', { name: /ver apple/i })

    await user.type(screen.getByRole('searchbox', { name: /buscar productos/i }), 'nokia 3310')

    expect(screen.getByText(/sin resultados para/i)).toBeInTheDocument()
    expect(screen.getByText('0 productos')).toBeInTheDocument()

    const clearButtons = screen.getAllByRole('button', { name: /limpiar búsqueda/i })
    const emptyStateClear = clearButtons.find((button) => button.textContent === 'Limpiar búsqueda')
    expect(emptyStateClear).toBeDefined()
    await user.click(emptyStateClear as HTMLElement)
    expect(screen.getByRole('link', { name: /ver apple/i })).toBeInTheDocument()
  })

  it('muestra error pulido con el status y reintenta con éxito', async () => {
    mockFetchHttpError(503)
    const user = userEvent.setup()
    render(<ProductList />)

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText(/no se pudo cargar el catálogo/i)).toBeInTheDocument()
    expect(alert.textContent).toContain('503')

    mockFetchOk(SAMPLE)
    await user.click(within(alert).getByRole('button', { name: /reintentar/i }))

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /ver apple/i })).toBeInTheDocument()
    })
  })

  it('el click en una tarjeta navega al detalle /product/:id', async () => {
    mockFetchOk(SAMPLE)
    const user = userEvent.setup()
    render(<ProductList />)

    await user.click(await screen.findByRole('link', { name: /ver apple iphone 13/i }))
    expect(window.location.pathname).toBe('/product/a1')
  })

  it('ignora items sin id/brand/model del API', async () => {
    mockFetchOk([
      ...SAMPLE,
      { id: '', brand: 'Sin', model: 'Id', price: '1', imgUrl: 'https://example.com/x.jpg' },
      { id: 'c3', brand: '', model: 'SinMarca', price: '1', imgUrl: 'https://example.com/x.jpg' },
    ])
    render(<ProductList />)

    await screen.findByRole('link', { name: /ver apple/i })
    expect(screen.getByText('2 productos')).toBeInTheDocument()
  })
})
