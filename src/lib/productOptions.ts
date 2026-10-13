import type { ProductDetail, ProductOption } from './types'

function asCleanStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '')
}

function isValidOption(value: unknown): value is ProductOption {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.code === 'number' && typeof candidate.name === 'string'
}

/** Storages: usa `options.storages` o fallback a `internalMemory` (code=index). */
export function getStorageOptions(detail: ProductDetail): ProductOption[] {
  const fromOptions = Array.isArray(detail.options?.storages)
    ? (detail.options?.storages as unknown[]).filter(isValidOption)
    : []
  if (fromOptions.length > 0) {
    return fromOptions
  }
  return asCleanStrings(detail.internalMemory).map((name, index) => ({ code: index, name }))
}

/** Colors: usa `options.colors` o fallback a `colors` (code=index). */
export function getColorOptions(detail: ProductDetail): ProductOption[] {
  const fromOptions = Array.isArray(detail.options?.colors)
    ? (detail.options?.colors as unknown[]).filter(isValidOption)
    : []
  if (fromOptions.length > 0) {
    return fromOptions
  }
  return asCleanStrings(detail.colors).map((name, index) => ({ code: index, name }))
}
