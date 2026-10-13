# Cómo se desarrolla este proyecto

## 1. Ramas

```text
master
 └─ develop
     ├─ feature/h0-scaffold
     ├─ feature/h1-routing-layout
     ├─ feature/h2-plp-search
     ├─ feature/h3-pdp-detalle
     ├─ feature/h4-cart-actions
     ├─ feature/h5-cache-1h
     ├─ feature/h6-polish-responsive
     └─ feature/h7-calidad-entrega
```

- `master` siempre compila y pasa lint + tests.
- `develop` integra los cambios en curso.
- Cada `feature/*` parte de `develop` y vuelve a `develop` con merge tras verificación en verde; al terminar, `develop` se integra en `master`.
- Sin push ni merge sin revisión previa.

## 2. Qué no se versiona

- Ficheros `.env` (solo se versiona `.env.example`).
- Documentos de trabajo en PDF (`*.pdf`).
- Tooling local de IA (`.opencode/`, `agents/`, `skills/`, `commands/`, `opencode.json*`).

Lo importante de ese tooling está resumido en los puntos 3 y 4 para poder reproducir el flujo sin esos ficheros.

## 3. Agentes y skills reutilizables

Agentes por responsabilidad (sirven para cualquier app con este stack):

- `react-scaffolder`: crea la base Vite + React + TS.
- `react-shell-router`: compone App, enrutado de cliente, layout/cabecera y estado global de cesta.
- `component-builder`: crea un componente Tailwind con sus tipos y su test.
- `api-integrator`: añade llamadas al API con caché y persistencia.
- `vitest-writer`: genera tests de componentes, hooks y almacenamiento.
- `frontend-security-reviewer`: revisa XSS, entradas, almacenamiento y dependencias.
- `quality-guardian`: pasa lint, tests y build antes de integrar.

Skills de apoyo: base Vite + React + TS, shell con enrutado y estado, patrones responsive con Tailwind, caché en cliente con expiración, tests con Vitest + Testing Library, puerta de calidad y revisión de seguridad frontend.

## 4. Comandos habituales

- `/scaffold-react`: generar la base del proyecto.
- `/shell <rutas>`: generar enrutado + layout + estado de cesta.
- `/component <Nombre>`: generar componente + test.
- `/api-cache <endpoint>`: añadir llamada con caché.
- `/gen-tests <alcance>`: generar tests del cambio.
- `/verify`: lint → tests → build (+ `npm audit`).
- `/commit-hito`: verificar y preparar el commit del cambio.
- `/security-audit`: revisar XSS, validación de entradas, almacenamiento y dependencias.

Flujo típico de un cambio: shell/componente/API → generar/actualizar tests → revisión de código (y de seguridad si toca API o almacenamiento) → `/verify` → merge a `develop`.

## 5. Seguridad en el flujo

La revisión de seguridad comprueba: sin HTML inyectado, entradas validadas (`id`, códigos de color/almacenamiento), almacenamiento con control de errores y `npm audit` sin vulnerabilidades moderadas o superiores antes de integrar.
