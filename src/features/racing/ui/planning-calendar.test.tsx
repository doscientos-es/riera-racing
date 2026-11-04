import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { workerWorkshop } from '../application/worker-access'
import { seedWorkshop } from '../infrastructure/seed'
import { PlanningPage } from './planning'

afterEach(() => vi.useRealTimers())

describe('vista de planificación', () => {
  it('muestra las tareas fechadas, ausencias y tareas antiguas sin fecha', () => {
    vi.useFakeTimers().setSystemTime(new Date(2026, 10, 18, 12))
    const state = seedWorkshop()
    state.tasks = state.tasks.map((task) =>
      task.id === 'k1' ? { ...task, date: '2026-11-18' } : task,
    )
    const html = renderToStaticMarkup(<PlanningPage state={state} change={vi.fn(() => true)} />)
    expect(html).toContain('Planificación semanal')
    expect(html).toContain('Semana anterior')
    expect(html).toContain('Filtrar por trabajador')
    expect(html).toContain('Montar el kit de frenos')
    expect(html).toContain('Ausencia')
    expect(html).toContain('Sin fecha')
    expect(html).toContain('Revisar sistema de frenado')
    expect(html).toContain('Fecha de Montar el kit de frenos')
  })

  it('el trabajador no ve tareas ajenas ni controles para programarlas', () => {
    const state = seedWorkshop()
    state.tasks.push({
      id: 'other',
      projectId: 'p1',
      description: 'Tarea privada',
      worker: 'Otra persona',
      done: false,
      date: '2026-11-18',
    })
    const personal = workerWorkshop(state, 'Àlex Ferrer')
    const html = renderToStaticMarkup(
      <PlanningPage state={personal} change={vi.fn(() => true)} worker="Àlex Ferrer" />,
    )
    expect(html).toContain('Montar el kit de frenos')
    expect(html).not.toContain('Tarea privada')
    expect(html).not.toContain('Filtrar por trabajador')
    expect(html).not.toContain('Fecha de Montar el kit de frenos')
    expect(html).not.toContain('Asignar tarea')
  })
})
