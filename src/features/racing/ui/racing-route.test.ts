import { describe, expect, it } from 'vitest'

import { racingPath, readRacingRoute } from './racing-route'

describe('rutas del taller', () => {
  const pages = ['inicio', 'proyectos', 'presupuestos', 'clientes'] as const

  it('distingue el listado del detalle y conserva identificadores codificados', () => {
    expect(readRacingRoute('/proyectos', pages)).toEqual({ page: 'proyectos', projectId: '' })
    const path = racingPath('proyectos', 'id / 1')
    expect(readRacingRoute(path, pages)).toEqual({ page: 'proyectos', projectId: 'id / 1' })
    expect(racingPath('presupuestos', 'p1')).toBe('/presupuestos/p1')
    expect(racingPath('proyectos')).toBe('/proyectos')
  })

  it('maneja rutas y codificaciones inválidas', () => {
    expect(readRacingRoute('/clientes/p1', pages)).toEqual({ page: 'inicio', projectId: '' })
    expect(readRacingRoute('/proyectos/%', pages)).toEqual({ page: 'proyectos', projectId: '' })
    expect(readRacingRoute('/desconocido', pages)).toEqual({ page: 'inicio', projectId: '' })
  })
})
