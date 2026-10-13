import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App.tsx'

describe('App H0', () => {
  it('renderiza el scaffold base', () => {
    render(<App />)
    expect(screen.getByText(/H0 scaffold OK/i)).toBeInTheDocument()
  })
})
