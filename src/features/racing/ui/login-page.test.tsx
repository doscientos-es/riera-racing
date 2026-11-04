import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { LoginPage } from './login-page'

describe('acceso de demostración', () => {
  it('ofrece ambos perfiles sin formulario y señala la sesión actual', () => {
    const html = renderToStaticMarkup(
      <LoginPage principal={{ role: 'worker', name: 'Àlex Ferrer' }} onSelect={vi.fn()} error="" />,
    )
    expect(html).toContain('Administración')
    expect(html).toContain('Àlex Ferrer')
    expect(html).toContain('sesión actual')
    expect(html).toContain('sin contraseña ni seguridad real')
    expect(html).not.toContain('<form')
  })

  it('muestra errores de almacenamiento en la pantalla de acceso', () => {
    const html = renderToStaticMarkup(
      <LoginPage principal={null} onSelect={vi.fn()} error="No se ha podido guardar el perfil." />,
    )
    expect(html).toContain('role="alert"')
    expect(html).toContain('No se ha podido guardar el perfil.')
  })
})
