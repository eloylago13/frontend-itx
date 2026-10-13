type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  id?: string
}

export function SearchBar({ value, onChange, id = 'product-search' }: SearchBarProps): JSX.Element {
  return (
    <div className="relative w-full max-w-md">
      <label htmlFor={id} className="sr-only">
        Buscar productos
      </label>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-neutral-400"
        >
          <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
          <line x1="11.2" y1="11.2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar por marca o modelo…"
        autoComplete="off"
        className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-10 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
      />
      {value !== '' && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute inset-y-0 right-2 flex items-center rounded-full px-2 text-lg leading-none text-neutral-400 transition-colors hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  )
}
