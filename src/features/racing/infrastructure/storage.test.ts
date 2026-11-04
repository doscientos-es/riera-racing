import { describe, expect, it } from 'vitest'

import { seedWorkshop } from './seed'
import { loadWorkshop, saveWorkshop, WORKSHOP_KEY } from './storage'

describe('almacenamiento local de la demo', () => {
  it('conserva cambios con una clave propia y recupera los datos', () => {
    const values = new Map<string, string>()
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value)
      },
    }
    const state = seedWorkshop()
    state.projects = state.projects.map((project) => ({ ...project, title: 'Cambio guardado' }))
    state.incidents = [
      {
        id: 'i1',
        projectId: 'p1',
        description: 'Pieza dañada',
        date: '2026-11-01',
        resolved: false,
      },
    ]
    state.activity = [{ id: 'a1', at: '2026-11-01T10:00:00Z', description: 'Cambios guardados' }]
    saveWorkshop(storage, state)
    expect(values.has(WORKSHOP_KEY)).toBe(true)
    expect(loadWorkshop(storage).projects[0]?.title).toBe('Cambio guardado')
    expect(loadWorkshop(storage).incidents).toEqual(state.incidents)
    expect(loadWorkshop(storage).activity).toEqual(state.activity)
  })

  it('no sustituye silenciosamente datos corruptos', () => {
    expect(() => loadWorkshop({ getItem: () => '{' })).toThrow('No se pueden leer')
  })

  it('conserva datos de demos anteriores al añadir incidencias y actividad', () => {
    const { incidents: _incidents, activity: _activity, ...old } = seedWorkshop()
    const state = loadWorkshop({ getItem: () => JSON.stringify(old) })
    expect(state.projects).toEqual(old.projects)
    expect(state.incidents).toEqual([])
    expect(state.activity).toEqual([])
  })
})
