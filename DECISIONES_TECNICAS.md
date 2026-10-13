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
- Todas las peticiones pasan por `fetchWithTimeout` (15 s): sin respuesta → error con Reintentar en vez de loading eterno (el API gratuito puede colgarse al despertar).
- La base solo admite `https://` (`http://` solo para localhost en desarrollo).
- La navegación SPA solo acepta rutas internas (`/...`).
- Los tipos respetan los nombres reales del API, incluidas sus erratas (`secondaryCmera`, `dimentions`).
- En el POST de cesta (`POST /api/cart`) solo se envían `id`, `colorCode` y `storageCode` elegidos de las opciones reales del producto; la respuesta (`{count}`) actualiza el contador de la cabecera. Nota: el API es un mock sin estado y devuelve `count: 1` en todos los POST (verificado), así que el badge muestra siempre ese valor; se implementa literal según el enunciado sin acumular en cliente.

## 5. Caché de 1 hora y persistencia (H5)

`safeStorage` (`src/lib/storage.ts`) guarda `{data, ts}` en `localStorage` con control de parseo/cuota y fallback a un `Map` en memoria; expone `CACHE_TTL_MS = 3600_000` e `isStale(ts)`. El hook `useCachedResource(key, fetcher, {ttl})` (`src/lib/useCachedResource.ts`) reutiliza el dato si tiene menos de 1 hora (fresco → `ready` sin fetch) y revalida si falta o está stale (fetch → `write` → `ready`); `reload()` fuerza el fetch con `AbortController` por clave y respeta el desmontado. Claves `itx:list:v1` e `itx:detail:{id}:v1`; el 404 de detalle va a `not-found` y no se cachea (solo se guarda el éxito con datos válidos). La cesta (`itx:cart:v1`) usa `safeStorage` con la misma clave y el envelope `{data: {count}, ts}`, manteniendo lectura compatible con el formato anterior `{count, ts}`.

## 6. Seguridad

- Los datos del API se renderizan como texto, sin HTML inyectado.
- Las URLs de imagen deben ser `https:`, con `alt` y carga diferida.
- Ningún secreto va en el bundle: las variables `VITE_*` son públicas por diseño, así que solo contienen la URL del API.
- `npm audit` forma parte de la verificación habitual. Quedan 13 vulnerabilidades solo en dependencias de desarrollo (`vite`/`vitest`/`tailwind`); corregirlas exige saltos mayores con breaking changes, así que se documentan como riesgo aceptado y no viajan al bundle de producción.

## 7. Calidad

- `ESLint` con reglas de `react-hooks` y `react-refresh`.
- `Vitest` + Testing Library + jsdom para componentes y hooks.
- `tsc --noEmit` antes de cada build para detectar errores de tipos.
