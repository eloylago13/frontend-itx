# Frontend ITX — Tienda de móviles

Aplicación web (SPA) para explorar un catálogo de móviles: lista con búsqueda en tiempo real, ficha de detalle con selector de color y almacenamiento, y contador de cesta en la cabecera.

## Qué incluye

- Listado en cuadrícula responsive (hasta 4 por fila) con imagen, marca, modelo y precio.
- Búsqueda en tiempo real por marca o modelo.
- Detalle en 2 columnas (imagen + información y acciones) con enlace para volver al listado.
- Cabecera con navegación, breadcrumbs y contador de cesta visible en todas las vistas (persistido en local).
- Detalle con selectores de almacenamiento y color (primera opción preseleccionada).
- Botón Añadir que envía la cesta al API (`POST /api/cart`) y actualiza el contador con su respuesta.

## En curso

- Caché local de 1 hora para lista y detalle (H5).

## Requisitos

- Node 18+ y npm 10+.

## Puesta en marcha

```bash
cp .env.example .env   # opcional: ya apunta al API por defecto
npm install
npm start              # http://localhost:5173
```

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Compilación de producción (`tsc + vite build`) |
| `npm test` | Tests con Vitest |
| `npm run lint` | Análisis estático con ESLint |
| `npm run preview` | Previsualizar el build local |

## Configuración

La URL del API se configura con `VITE_API_BASE_URL` (ver `.env.example`):

```bash
VITE_API_BASE_URL=https://itx-frontend-test.onrender.com
```

Endpoints usados: `GET /api/product`, `GET /api/product/:id` y `POST /api/cart`.

## Ramas

- `master`: versión estable.
- `develop`: integración.
- `feature/*`: cada cambio parte de `develop` y vuelve a `develop` con merge; al final `develop` se integra en `master`.

Más detalle en `DESARROLLO_IA.md` y decisiones de diseño en `DECISIONES_TECNICAS.md`.
