import '@testing-library/jest-dom/vitest'

// jsdom no implementa scrollTo: stub silencioso (los tests pueden espiarlo).
window.scrollTo = (() => {}) as typeof window.scrollTo
