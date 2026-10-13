import type { ProductDetail } from '../lib/types'
import { getColorOptions, getStorageOptions } from '../lib/productOptions'

type ProductOptionsProps = {
  detail: ProductDetail
  storage: number | undefined
  color: number | undefined
  onStorageChange: (code: number) => void
  onColorChange: (code: number) => void
}

const selectClassName =
  'w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30'

export function ProductOptions({
  detail,
  storage,
  color,
  onStorageChange,
  onColorChange,
}: ProductOptionsProps): JSX.Element {
  const storages = getStorageOptions(detail)
  const colors = getColorOptions(detail)

  const handleStorageChange = (rawValue: string): void => {
    if (rawValue.trim() === '') {
      return
    }
    const code = Number(rawValue)
    if (!Number.isInteger(code)) {
      return
    }
    if (!storages.some((option) => option.code === code)) {
      return
    }
    onStorageChange(code)
  }

  const handleColorChange = (rawValue: string): void => {
    if (rawValue.trim() === '') {
      return
    }
    const code = Number(rawValue)
    if (!Number.isInteger(code)) {
      return
    }
    if (!colors.some((option) => option.code === code)) {
      return
    }
    onColorChange(code)
  }

  if (storages.length === 0 && colors.length === 0) {
    return <p className="text-sm text-neutral-600">No hay opciones disponibles para este producto.</p>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {storages.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="storage-select" className="text-sm font-medium text-neutral-900">
            Almacenamiento
          </label>
          <select
            id="storage-select"
            value={storage ?? ''}
            onChange={(e) => handleStorageChange(e.target.value)}
            className={selectClassName}
          >
            {storages.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}
      {colors.length > 0 && (
        <div className="space-y-1">
          <label htmlFor="color-select" className="text-sm font-medium text-neutral-900">
            Color
          </label>
          <select
            id="color-select"
            value={color ?? ''}
            onChange={(e) => handleColorChange(e.target.value)}
            className={selectClassName}
          >
            {colors.map((option) => (
              <option key={option.code} value={option.code}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
