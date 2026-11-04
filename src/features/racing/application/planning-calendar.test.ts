import { describe, expect, it } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import {
  absentOn,
  planningWorkers,
  shiftDate,
  tasksOn,
  weekDays,
  weekStart,
} from './planning-calendar'

describe('calendario de planificación', () => {
  it('construye semanas de lunes a domingo incluso al cambiar de año', () => {
    expect(weekStart('2027-01-03')).toBe('2026-12-28')
    expect(weekDays('2026-12-28')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ])
    expect(shiftDate('2024-02-28', 1)).toBe('2024-02-29')
  })

  it('agrupa tareas por persona y día y muestra las ausencias en ambos extremos', () => {
    const state = seedWorkshop()
    state.tasks = state.tasks.map((task) => ({
      ...task,
      date: task.done ? '2026-11-17' : '2026-11-16',
    }))
    expect(tasksOn(state, 'Àlex Ferrer', '2026-11-16').map((task) => task.id)).toEqual(['k1'])
    expect(tasksOn(state, 'Otro', '2026-11-16')).toEqual([])
    expect(absentOn(state, 'Àlex Ferrer', '2026-11-16')).toBe(true)
    expect(absentOn(state, 'Àlex Ferrer', '2026-11-20')).toBe(true)
    expect(absentOn(state, 'Àlex Ferrer', '2026-11-21')).toBe(false)
    expect(planningWorkers(state, 'Otro')).toEqual(['Otro'])
  })
})
