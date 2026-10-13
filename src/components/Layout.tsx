import type { ReactNode } from 'react'
import { Header } from './Header'
import type { Crumb } from './Header'

export type { Crumb }

type LayoutProps = {
  crumbs: Crumb[]
  children: ReactNode
}

export function Layout({ crumbs, children }: LayoutProps): JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900">
      <Header crumbs={crumbs} />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4">{children}</main>
      <footer className="border-t border-neutral-200">
        <p className="mx-auto w-full max-w-6xl p-4 text-xs text-neutral-500">Frontend ITX</p>
      </footer>
    </div>
  )
}
