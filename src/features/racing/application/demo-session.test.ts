import { describe, expect, it } from 'vitest'

import { canUseAction } from './assistant-access'
import {
  DEMO_SESSION_KEY,
  isLoginScreen,
  readDemoPrincipal,
  saveDemoPrincipal,
} from './demo-session'

function memoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

describe('sesión de demostración', () => {
  it('empieza sin perfil y conserva el seleccionado sin alterar los datos del taller', () => {
    const storage = memoryStorage()
    storage.setItem('riera-racing:demo:v1', 'datos del taller')
    expect(readDemoPrincipal(storage)).toBeNull()
    saveDemoPrincipal(storage, 'worker')
    const worker = readDemoPrincipal(storage)
    expect(worker).toEqual({ role: 'worker', name: 'Àlex Ferrer' })
    if (!worker) throw new Error('No se ha recuperado el trabajador')
    expect(canUseAction(worker, 'part')).toBe(true)
    expect(canUseAction(worker, 'invoice')).toBe(false)
    saveDemoPrincipal(storage, 'admin')
    const admin = readDemoPrincipal(storage)
    if (!admin) throw new Error('No se ha recuperado el administrador')
    expect(canUseAction(admin, 'invoice')).toBe(true)
    expect(storage.getItem('riera-racing:demo:v1')).toBe('datos del taller')
  })

  it('rechaza perfiles desconocidos y muestra el acceso al visitar /login o carecer de sesión', () => {
    const storage = memoryStorage()
    storage.setItem(DEMO_SESSION_KEY, 'desconocido')
    expect(readDemoPrincipal(storage)).toBeNull()
    expect(isLoginScreen('/', null)).toBe(true)
    expect(isLoginScreen('/login/', { role: 'admin' })).toBe(true)
    expect(isLoginScreen('/', { role: 'admin' })).toBe(false)
  })
})
