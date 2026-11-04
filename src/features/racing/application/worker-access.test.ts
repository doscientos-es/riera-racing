import { describe, expect, it } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import {
  addWorkerAbsence,
  addWorkerIncident,
  addWorkerPart,
  canVisitPage,
  setWorkerIncidentResolved,
  setWorkerTaskDone,
  workerWorkshop,
} from './worker-access'

const name = 'Àlex Ferrer'
const principal = { role: 'worker', name } as const

describe('perfil de trabajador de la demo', () => {
  it('limita los módulos y conserva el acceso completo de administración', () => {
    for (const page of [
      'facturacion',
      'informes',
      'presupuestos',
      'compras',
      'contabilidad',
      'inventario',
    ]) {
      expect(canVisitPage(principal, page)).toBe(false)
      expect(canVisitPage({ role: 'admin' }, page)).toBe(true)
    }
    for (const page of ['inicio', 'proyectos', 'planificacion', 'incidencias', 'taller', 'equipo'])
      expect(canVisitPage(principal, page)).toBe(true)
  })

  it('muestra proyectos asignados y solo tareas, partes y vacaciones propias', () => {
    const state = seedWorkshop()
    state.tasks.push({
      id: 'other',
      projectId: 'p1',
      description: 'Otra tarea',
      worker: 'Otra persona',
      done: false,
    })
    state.absences.push({
      id: 'other',
      worker: 'Otra persona',
      from: '2026-11-01',
      to: '2026-11-02',
    })
    state.incidents.push({
      id: 'other',
      projectId: 'p2',
      description: 'Otro proyecto',
      date: '2026-11-01',
      resolved: false,
    })
    const view = workerWorkshop(state, name)
    expect(view.projects.map((project) => project.id)).toEqual(['p1'])
    expect(view.projects[0]?.lines).toEqual([])
    expect(view.tasks.every((task) => task.worker === name)).toBe(true)
    expect(view.absences.every((absence) => absence.worker === name)).toBe(true)
    expect(view.incidents).toEqual([])
    expect(view.invoices).toEqual([])
    expect(state.projects[0]?.lines.length).toBeGreaterThan(0)
  })

  it('comprueba la asignación y la identidad al aplicar cambios al taller completo', () => {
    const state = seedWorkshop()
    state.tasks.push({
      id: 'other',
      projectId: 'p1',
      description: 'Otra tarea',
      worker: 'Otra persona',
      done: false,
    })
    expect(() => setWorkerTaskDone(state, name, 'other', true)).toThrow('tareas asignadas')
    expect(
      setWorkerTaskDone(state, name, 'k1', true).tasks.find((task) => task.id === 'k1')?.done,
    ).toBe(true)
    const part = {
      id: 'new',
      projectId: 'p2',
      date: '2026-11-04',
      description: 'Trabajo',
      hours: 1,
      hourlyCost: 0,
      productId: null,
      quantity: 0,
      expense: 0,
    }
    expect(() => addWorkerPart(state, name, part)).toThrow('proyectos asignados')
    expect(addWorkerPart(state, name, { ...part, projectId: 'p1' }).parts[0]?.worker).toBe(name)
    expect(
      addWorkerAbsence(state, name, { id: 'new', from: '2026-12-01', to: '2026-12-02' }).absences[0]
        ?.worker,
    ).toBe(name)
    const incident = {
      id: 'new',
      projectId: 'p2',
      description: 'Avería',
      date: '2026-11-04',
      resolved: false,
    }
    expect(() => addWorkerIncident(state, name, incident)).toThrow('proyectos asignados')
    const withIncident = addWorkerIncident(state, name, { ...incident, projectId: 'p1' })
    expect(setWorkerIncidentResolved(withIncident, name, 'new', true).incidents[0]?.resolved).toBe(
      true,
    )
    expect(() => setWorkerIncidentResolved(withIncident, 'Sin asignar', 'new', true)).toThrow(
      'proyectos asignados',
    )
  })
})
