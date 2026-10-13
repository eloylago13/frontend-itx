/* eslint-disable react-refresh/only-export-components -- el store convive: provider + hook + constante */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

export const CART_STORAGE_KEY = 'itx:cart:v1'

type CartContextValue = {
  count: number
  setCount: Dispatch<SetStateAction<number>>
}

const CartContext = createContext<CartContextValue | null>(null)

function readInitialCount(): number {
  try {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return 0
    }
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) {
      return 0
    }
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null && 'count' in parsed) {
      const candidate = (parsed as { count: unknown }).count
      if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
        return Math.floor(candidate)
      }
      return 0
    }
    if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed)
    }
    return 0
  } catch {
    return 0
  }
}

export function CartProvider({ children }: { children: ReactNode }): ReactNode {
  const [count, setCount] = useState<number>(readInitialCount)

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ count, ts: Date.now() }))
    } catch {
      // Almacenamiento no disponible (privado, SSR, etc.): se ignora.
    }
  }, [count])

  const value = useMemo<CartContextValue>(() => ({ count, setCount }), [count])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart debe usarse dentro de <CartProvider>')
  }
  return ctx
}
