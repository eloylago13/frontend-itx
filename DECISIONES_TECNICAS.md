# Decisiones técnicas

## 1. React 18 + Vite + TypeScript

TypeScript aporta tipos para `Product`, opciones de color/almacenamiento y respuestas del API (que incluyen nombres con erratas que se respetan tal cual). Vite da arranque rápido y build simple. Preact se descartó por su menor ecosistema con Testing Library y Vitest.

## 2. Tailwind CSS v3

La cuadrícula del listado (`1 → 2 → 4` columnas según ancho) y el detalle (`2` columnas en escritorio, `1` en móvil) se resuelven con utilidades y breakpoints, sin CSS-in-JS. Se usa v3 por su estabilidad con Node 18 y PostCSS.

## 3. Enrutado propio con History API

Solo hay dos rutas (`/` y `/product/:id`), así que se implementa un enrutador mínimo de cliente en lugar de añadir una dependencia de router. Si el número de rutas crece, se puede migrar a una librería sin cambiar las vistas.

## 4. Capa de acceso al API

Toda la comunicación pasa por un `apiClient` central que:

- Lee la base de `VITE_API_BASE_URL` con valor por defecto y lista de dominios permitidos.
- Valida el `id` de producto (`/^[A-Za-z0-9-_]+$/`) antes de pedir el detalle y lo codifica con `encodeURIComponent`.
- Los tipos respetan los nombres reales del API, incluidas sus erratas (`secondaryCmera`, `dimentions`).
- En el POST de cesta (`POST /api/cart`) solo se envían `id`, `colorCode` y `storageCode` elegidos de las opciones reales del producto; la respuesta (`{count}`) actualiza el contador de la cabecera.

## 5. Caché de 1 hora y persistencia (en curso, H5)

Hoy el contador de cesta se persiste de forma simple (`itx:cart:v1` con control de errores). En H5 se generalizará con un `safeStorage` que guarda `{data, ts}` en `localStorage` (control de parseo/cuota, fallback a memoria) y un hook `useCachedResource(key, fetcher)` que reutiliza el dato si tiene menos de 1 hora y revalida después, para lista y detalle.

## 6. Seguridad

- Los datos del API se renderizan como texto, sin HTML inyectado.
- Las URLs de imagen deben ser `https:`, con `alt` y carga diferida.
- Ningún secreto va en el bundle: las variables `VITE_*` son públicas por diseño, así que solo contienen la URL del API.
- `npm audit` forma parte de la verificación habitual.

## 7. Calidad

- `ESLint` con reglas de `react-hooks` y `react-refresh`.
- `Vitest` + Testing Library + jsdom para componentes y hooks.
- `tsc --noEmit` antes de cada build para detectar errores de tipos.
