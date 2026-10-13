/* eslint-disable react-refresh/only-export-components -- el store convive: provider + hook + constante */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { safeStorage } from '../lib/storage'

export const CART_STORAGE_KEY = 'itx:cart:v1'

type CartContextValue = {
  count: number
  setCount: Dispatch<SetStateAction<number>>
}

const CartContext = createContext<CartContextValue | null>(null)

function readInitialCount(): number {
  // Formato nuevo H5: safeStorage { data: { count }, ts }.
  const entry = safeStorage.read<{ count: unknown }>(CART_STORAGE_KEY)
  if (entry !== null && typeof entry.data === 'object' && entry.data !== null) {
    const candidate = (entry.data as { count: unknown }).count
    if (typeof candidate === 'number' && Number.isFinite(candidate) && candidate >= 0) {
      return Math.floor(candidate)
    }
    return 0
  }
  if (entry !== null && typeof entry.data === 'number') {
    const candidate = entry.data
    if (Number.isFinite(candidate) && candidate >= 0) {
      return Math.floor(candidate)
    }
    return 0
  }
  // Compat legado pre-H5: { count, ts } o número suelto.
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
    safeStorage.write(CART_STORAGE_KEY, { count })
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
