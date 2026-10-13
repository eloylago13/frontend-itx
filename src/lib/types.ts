/** Item mínimo del listado de productos (contrato `GET /api/product`). */
export type ProductListItem = {
  id: string
  brand: string
  model: string
  price: string
  imgUrl: string
}

/** Opción seleccionable del detalle (colores / almacenamientos). */
export type ProductOption = {
  code: number
  name: string
}

/**
 * Detalle de producto (contrato `GET /api/product/:id`).
 * Respeta los typos reales del API: `secondaryCmera` (una m) y `dimentions`.
 */
export type ProductDetail = {
  id: string
  brand: string
  model: string
  price?: string
  imgUrl?: string
  cpu?: string
  ram?: string
  os?: string
  displaySize?: string
  displayResolution?: string
  battery?: string
  primaryCamera?: string | string[]
  /** Typo real del API (una sola "m"). */
  secondaryCmera?: string | string[]
  /** Typo real del API (sin "e"). */
  dimentions?: string
  weight?: string
  internalMemory?: string[]
  colors?: string[]
  options?: {
    colors?: ProductOption[]
    storages?: ProductOption[]
  }
}

/** Une cámaras string|string[] con " · "; undefined → "". */
export function formatCamera(value: string | string[] | undefined): string {
  if (value === undefined) {
    return ''
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item !== '')
      .join(' · ')
  }
  return typeof value === 'string' ? value.trim() : ''
}
