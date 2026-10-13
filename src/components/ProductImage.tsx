type ProductImageProps = {
  brand: string
  model: string
  imgUrl?: string
}

function isHttpsImageUrl(value: string | undefined): value is string {
  return typeof value === 'string' && value.startsWith('https://')
}

/** Imagen principal del PDP: solo https, si no placeholder con inicial. */
export function ProductImage({ brand, model, imgUrl }: ProductImageProps): JSX.Element {
  const alt = `${brand} ${model}`

  if (!isHttpsImageUrl(imgUrl)) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex aspect-square w-full items-center justify-center bg-neutral-50"
      >
        <span aria-hidden="true" className="text-6xl font-bold uppercase text-neutral-300">
          {brand.slice(0, 1)}
        </span>
      </div>
    )
  }

  return (
    <img
      src={imgUrl}
      alt={alt}
      loading="eager"
      className="aspect-square h-full w-full object-contain"
    />
  )
}
