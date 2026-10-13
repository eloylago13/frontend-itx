/**
 * Formatea un precio del API para mostrarlo.
 * - Vacío → "Precio no disponible".
 * - Si ya trae símbolo (€/$) → tal cual.
 * - Si no → añade €.
 */
export function formatPrice(price: string | undefined): string {
  const trimmed = typeof price === 'string' ? price.trim() : ''
  if (trimmed === '') {
    return 'Precio no disponible'
  }
  if (/€|\$/.test(trimmed)) {
    return trimmed
  }
  return `${trimmed} €`
}
