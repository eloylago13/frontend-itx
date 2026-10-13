import { goTo } from '../app/link'
import { formatPrice } from '../lib/format'
import type { ProductListItem } from '../lib/types'

type ProductCardProps = {
  product: ProductListItem
}

function isHttpsImageUrl(value: string): boolean {
  return value.startsWith('https://')
}

export function ProductCard({ product }: ProductCardProps): JSX.Element {
  const { id, brand, model, price, imgUrl } = product
  const href = `/product/${encodeURIComponent(id)}`
  const showImage = isHttpsImageUrl(imgUrl)

  return (
    <a
      href={href}
      onClick={(e) => goTo(e, href)}
      aria-label={`Ver ${brand} ${model}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
    >
      <div className="flex aspect-square items-center justify-center bg-neutral-50 p-6">
        {showImage ? (
          <img
            src={imgUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <span aria-hidden="true" className="text-4xl font-bold uppercase text-neutral-300">
            {brand.slice(0, 1)}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{brand}</p>
        <p className="text-sm font-semibold text-neutral-900">{model}</p>
        <p className="mt-auto pt-2 text-sm font-bold text-neutral-900">{formatPrice(price)}</p>
      </div>
    </a>
  )
}
