import { describe, expect, it } from 'vitest'

import { addIncident, addPart } from '../domain/workshop'
import { seedWorkshop } from '../infrastructure/seed'
import { clientSummaries, workshopOverview } from './overview'

describe('resumen del taller', () => {
  it('refleja los gastos y costes de los partes sin confundirlos con facturas', () => {
    const state = seedWorkshop()
    const next = addPart(state, {
      id: 'new',
      projectId: 'p1',
      date: '2026-11-01',
      worker: 'Alex',
      description: 'Prueba',
      hours: 2,
      hourlyCost: 2500,
      productId: null,
      quantity: 0,
      expense: 1000,
    })
    const before = workshopOverview(state)
    const after = workshopOverview(next)
    expect(after.labor - before.labor).toBe(5000)
    expect(after.expenses - before.expenses).toBe(1000)
    expect(after.totalCost - before.totalCost).toBe(6000)
    expect(after.draftValue).toBe(before.draftValue)
  })

  it('agrupa proyectos por cliente y conserva todos los vehículos', () => {
    const state = seedWorkshop()
    state.projects = state.projects.map((project) =>
      project.id === 'p2' ? { ...project, client: 'Jordi Serra' } : project,
    )
    const client = clientSummaries(state).find((item) => item.name === 'Jordi Serra')
    expect(client?.projects.map((project) => project.id)).toEqual(['p1', 'p2'])
  })

  it('rechaza incidencias sin proyecto o descripción y conserva las válidas', () => {
    const state = seedWorkshop()
    const incident = {
      id: 'i1',
      projectId: 'p1',
      date: '2026-11-01',
      description: 'Pieza dañada',
      resolved: false,
    }
    expect(() => addIncident(state, { ...incident, projectId: 'missing' })).toThrow()
    expect(() => addIncident(state, { ...incident, description: ' ' })).toThrow()
    expect(addIncident(state, incident).incidents).toEqual([incident])
  })
})
