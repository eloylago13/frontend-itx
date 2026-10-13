import { formatCamera } from '../lib/types'
import type { ProductDetail } from '../lib/types'

type ProductSpecsProps = {
  detail: ProductDetail
}

function formatPrice(price: string | undefined): string {
  const trimmed = typeof price === 'string' ? price.trim() : ''
  if (trimmed === '') {
    return 'Precio no disponible'
  }
  if (/€|\$/.test(trimmed)) {
    return trimmed
  }
  return `${trimmed} €`
}

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function formatDisplaySize(detail: ProductDetail): string {
  const size = typeof detail.displaySize === 'string' ? detail.displaySize.trim() : ''
  const resolution = typeof detail.displayResolution === 'string' ? detail.displayResolution.trim() : ''
  if (size !== '' && resolution !== '' && size !== resolution) {
    return `${size} · ${resolution}`
  }
  return size !== '' ? size : resolution
}

function formatCameras(detail: ProductDetail): string {
  const primary = formatCamera(detail.primaryCamera)
  const frontal = formatCamera(detail.secondaryCmera)
  return [primary, frontal].filter((part) => part !== '').join(' · ')
}

/** Lista de definición elegante con las 11 filas del PDP. */
export function ProductSpecs({ detail }: ProductSpecsProps): JSX.Element {
  const rows: Array<{ label: string; value: string; always?: boolean }> = [
    { label: 'Marca', value: detail.brand, always: true },
    { label: 'Modelo', value: detail.model, always: true },
    { label: 'Precio', value: formatPrice(detail.price), always: true },
    { label: 'CPU', value: typeof detail.cpu === 'string' ? detail.cpu.trim() : '' },
    { label: 'RAM', value: typeof detail.ram === 'string' ? detail.ram.trim() : '' },
    { label: 'Sistema operativo', value: typeof detail.os === 'string' ? detail.os.trim() : '' },
    { label: 'Resolución de pantalla', value: formatDisplaySize(detail) },
    { label: 'Batería', value: typeof detail.battery === 'string' ? detail.battery.trim() : '' },
    { label: 'Cámaras', value: formatCameras(detail) },
    { label: 'Dimensiones', value: typeof detail.dimentions === 'string' ? detail.dimentions.trim() : '' },
    { label: 'Peso', value: typeof detail.weight === 'string' ? detail.weight.trim() : '' },
  ]

  const visible = rows.filter((row) => row.always === true || isNonEmpty(row.value))

  return (
    <section aria-label="Especificaciones" className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <h2 className="border-b border-neutral-200 px-5 py-4 text-base font-bold text-neutral-900">
        Especificaciones
      </h2>
      <dl className="divide-y divide-neutral-100">
        {visible.map((row) => (
          <div key={row.label} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
            <dt className="text-xs font-semibold uppercase tracking-widest text-neutral-500">{row.label}</dt>
            <dd className="text-sm text-neutral-900">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
