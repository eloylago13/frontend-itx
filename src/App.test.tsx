import { beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App.tsx'
import { navigate, parseRoute } from './app/router.ts'
import { CART_STORAGE_KEY } from './app/store.tsx'

function resetShell(): void {
  window.history.pushState(null, '', '/')
  window.localStorage.clear()
}

beforeEach(() => {
  resetShell()
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
  it('renderiza el catálogo en / con logo, breadcrumbs y badge', () => {
    render(<App />)

    expect(screen.getByRole('link', { name: /ITX inicio/i })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument()
    expect(screen.getByText(/Catálogo \(placeholder H1\)/i)).toBeInTheDocument()

    const badge = screen.getByTestId('cart-badge')
    expect(badge).toHaveAttribute('aria-live', 'polite')
    expect(badge).toHaveTextContent('0')
  })

  it('navega al detalle con id válido', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('link', { name: /Ver producto demo-1/i }))

    expect(screen.getByText(/Producto demo-1 \(placeholder H1\)/i)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/product/demo-1')
  })

  it('el back-link del detalle vuelve al catálogo', async () => {
    const user = userEvent.setup()
    act(() => {
      navigate('/product/demo-1')
    })
    render(<App />)
    expect(screen.getByText(/Producto demo-1/i)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /Volver al catálogo/i }))

    expect(screen.getByText(/Catálogo \(placeholder H1\)/i)).toBeInTheDocument()
    expect(window.location.pathname).toBe('/')
  })

  it('el logo vuelve a /', async () => {
    const user = userEvent.setup()
    act(() => {
      navigate('/product/demo-1')
    })
    render(<App />)

    await user.click(screen.getByRole('link', { name: /ITX inicio/i }))

    expect(screen.getByText(/Catálogo \(placeholder H1\)/i)).toBeInTheDocument()
  })

  it('muestra not-found con id inválido', () => {
    act(() => {
      navigate('/product/!!!')
    })
    render(<App />)

    expect(screen.getByText(/404/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Volver al inicio/i })).toBeInTheDocument()
  })

  it('el badge lee la persistencia itx:cart:v1 y tolera datos corruptos', () => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ count: 4, ts: 123 }))
    const { unmount } = render(<App />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('4')
    unmount()

    window.localStorage.setItem(CART_STORAGE_KEY, 'no-json{{{')
    render(<App />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('0')
  })

  it('persiste el carrito con forma {count, ts}', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ count: 2, ts: 1 }))
    render(<App />)
    expect(screen.getByTestId('cart-badge')).toHaveTextContent('2')

    // El provider re-persiste al montar y en cada cambio.
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    expect(raw).toContain('"count":2')
    expect(raw).toContain('"ts"')

    await user.click(screen.getByRole('link', { name: /ITX inicio/i }))
    expect(window.localStorage.getItem(CART_STORAGE_KEY)).toContain('"count"')
  })
})
