import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.tsx'
import { navigate, parseRoute } from './app/router.ts'
import { CART_STORAGE_KEY } from './app/store.tsx'

const SAMPLE = [
  { id: 'demo-1', brand: 'Demo', model: 'Uno', price: '100', imgUrl: 'https://example.com/demo-1.jpg' },
]

const SAMPLE_DETAIL = {
  id: 'demo-1',
  brand: 'Demo',
  model: 'Uno',
  price: '100',
  imgUrl: 'https://example.com/demo-1.jpg',
  cpu: 'Demo CPU',
  ram: '2GB RAM',
  os: 'Demo OS',
  displaySize: '5 inches',
  displayResolution: '720x1280',
  battery: '2000 mAh',
  primaryCamera: ['8 MP'],
  secondaryCmera: ['2 MP'],
  dimentions: '140 x 70 x 8 mm',
  weight: '150 g',
  internalMemory: ['16GB'],
  colors: ['Black'],
  options: {
    colors: [{ code: 1000, name: 'Black' }],
    storages: [{ code: 2000, name: '16GB' }],
  },
}

function mockFetchOk(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: unknown) => {
      const target = typeof url === 'string' ? url : String(url)
      if (target.includes('/api/product/demo-1')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => SAMPLE_DETAIL,
        })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => SAMPLE,
      })
    }),
  )
}

function resetShell(): void {
  window.history.pushState(null, '', '/')
  window.localStorage.clear()
}

beforeEach(() => {
  resetShell()
  mockFetchOk()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('H1 shell: router', () => {
  it('parseRoute mapea /, /product/:id y resto', () => {
    expect(parseRoute('/')).toEqual({ name: 'list' })
    expect(parseRoute('/product/abc-123_X')).toEqual({ name: 'detail', id: 'abc-123_X' })
    expect(parseRoute('/product/!!!')).toEqual({ name: 'not-found' })
    expect(parseRoute('/product/')).toEqual({ name: 'not-found' })
    expect(parseRoute('/product/a/b')).toEqual({ name: 'not-found' })
    expect(parseRoute('/otra')).toEqual({ name: 'not-found' })
  })
})

describe('H1 shell: App', () => {
  it('renderiza el catálogo en / con logo, breadcrumbs y badge', async () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /ITX inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /catálogo/i })).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: /buscar productos/i })).toBeInTheDocument()

    expect(await screen.findByRole('link', { name: /ver demo uno/i })).toBeInTheDocument()

    const badge = screen.getByTestId('cart-badge')
    expect(badge).toHaveAttribute('aria-live', 'polite')
    expect(badge).toHaveTextContent('0')
  })

  it('navega al detalle con id válido', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(await screen.findByRole('link', { name: /ver demo uno/i }))

    expect(await screen.findByRole('heading', { level: 1, name: /demo uno/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Añadir$/i })).toBeEnabled()
    expect(window.location.pathname).toBe('/product/demo-1')
  })

  it('el back-link del detalle vuelve al catálogo', async () => {
    const user = userEvent.setup()
    act(() => {
      navigate('/product/demo-1')
    })
    render(<App />)
    expect(await screen.findByRole('heading', { level: 1, name: /demo uno/i })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Volver al catálogo/i }))

    expect(await screen.findByRole('searchbox', { name: /buscar productos/i })).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('el logo vuelve a /', async () => {
    const user = userEvent.setup()
    act(() => {
      navigate('/product/demo-1')
    })
    render(<App />)

    await user.click(screen.getByRole('link', { name: /ITX inicio/i }))

    expect(await screen.findByRole('searchbox', { name: /buscar productos/i })).toBeInTheDocument()
  })

  it('muestra not-found con id inválido', () => {
    act(() => {
      navigate('/product/!!!')
    })
    render(<App />)

    expect(screen.getByText(/404/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver al inicio/i })).toBeInTheDocument()
  })

  it('el breadcrumb del detalle muestra el modelo, no el id', async () => {
    act(() => {
      navigate('/product/demo-1')
    })
    render(<App />)
    await screen.findByRole('heading', { level: 1, name: /demo uno/i })

    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i })
    expect(breadcrumb).toHaveTextContent('Demo Uno')
    expect(breadcrumb).not.toHaveTextContent('demo-1')
  })

  it('hace scroll-to-top y mueve el foco al h1 al cambiar de ruta', async () => {
    const user = userEvent.setup()
    const scrollSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    render(<App />)
    await screen.findByRole('link', { name: /ver demo uno/i })
    scrollSpy.mockClear()

    await user.click(screen.getByRole('link', { name: /ver demo uno/i }))

    expect(scrollSpy).toHaveBeenCalled()
    const heading = await screen.findByRole('heading', { level: 1, name: /demo uno/i })
    expect(document.activeElement).toBe(heading)
    scrollSpy.mockRestore()
  })

  it('el badge lee la persistencia itx:cart:v1 y tolera datos corruptos', async () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ count: 4, ts: 123 }))
    const { unmount } = render(<App />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('4')
    unmount()

    window.localStorage.setItem(CART_STORAGE_KEY, 'no-json{{{')
    render(<App />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('0')
    await screen.findByRole('link', { name: /ver demo uno/i })
  })

  it('persiste el carrito con forma {count, ts}', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ count: 2, ts: 1 }))
    render(<App />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('2')
    await screen.findByRole('link', { name: /ver demo uno/i })

    // El provider re-persiste al montar y en cada cambio.
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    expect(raw).toContain('"count":2')
    expect(raw).toContain('"ts"')

    await user.click(screen.getByRole('link', { name: /ITX inicio/i }))
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain('"count"')
  })
})
