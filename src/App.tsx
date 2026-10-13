import type { ReactNode } from 'react'
import { useRoute } from './app/router'
import { CartProvider } from './app/store'
import { Layout } from './components/Layout'
import type { Crumb } from './components/Layout'
import { NotFound } from './pages/NotFound'
import { PlaceholderDetail } from './pages/PlaceholderDetail'
import { PlaceholderList } from './pages/PlaceholderList'

function Shell(): JSX.Element {
  const route = useRoute()

  let crumbs: Crumb[]
  let page: ReactNode

  switch (route.name) {
    case 'list':
      crumbs = [{ label: 'Catálogo' }]
      page = <PlaceholderList />
      break
    case 'detail':
      crumbs = [{ label: 'Catálogo', href: '/' }, { label: route.id }]
      page = <PlaceholderDetail id={route.id} />
      break
    case 'not-found':
      crumbs = [{ label: 'Catálogo', href: '/' }, { label: 'No encontrado' }]
      page = <NotFound />
      break
  }

  return <Layout crumbs={crumbs}>{page}</Layout>
}

export default function App(): JSX.Element {
  return (
    <CartProvider>
      <Shell />
    </CartProvider>
  )
}
