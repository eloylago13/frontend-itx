import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useRoute } from './app/router'
import type { Route } from './app/router'
import { CartProvider } from './app/store'
import { Layout } from './components/Layout'
import type { Crumb } from './components/Layout'
import { NotFound } from './pages/NotFound'
import { ProductDetail } from './pages/ProductDetail'
import { ProductList } from './pages/ProductList'

function routeKey(route: Route): string {
  if (route.name === 'detail') {
    return `detail-${route.id}`
  }
  return route.name
}

function Shell(): JSX.Element {
  const route = useRoute()
  const [detailLabel, setDetailLabel] = useState<string | null>(null)

  const key = routeKey(route)

  useEffect(() => {
    setDetailLabel(null)
  }, [key])

  let crumbs: Crumb[]
  let page: ReactNode

  switch (route.name) {
    case 'list':
      crumbs = [{ label: 'Catálogo' }]
      page = <ProductList />
      break
    case 'detail':
      crumbs = [{ label: 'Catálogo', href: '/' }, { label: detailLabel ?? 'Detalle' }]
      page = <ProductDetail id={route.id} onLoaded={setDetailLabel} />
      break
    case 'not-found':
      crumbs = [{ label: 'Catálogo', href: '/' }, { label: 'No encontrado' }]
      page = <NotFound />
      break
  }

  useEffect(() => {
    try {
      window.scrollTo(0, 0)
    } catch {
      // jsdom u otros entornos sin scroll: se ignora.
    }
    const heading = document.querySelector('main h1')
    if (heading instanceof HTMLElement) {
      heading.setAttribute('tabindex', '-1')
      heading.focus({ preventScroll: true })
    }
  }, [key])

  return <Layout crumbs={crumbs}>{page}</Layout>
}

export default function App(): JSX.Element {
  return (
    <CartProvider>
      <Shell />
    </CartProvider>
  )
}
