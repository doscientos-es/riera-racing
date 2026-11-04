import { describe, expect, it } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import { applyProposal } from './assistant-command'
import { suggestAction, type Proposal } from './assistant-intent'

const date = '2026-11-04'
const proposal = (kind: Proposal['kind'], values: Record<string, string>): Proposal => ({ kind, values })

describe('asistente simulado', () => {
  it('prepara un parte desde la nota sin inventar costes ni modificar el estado', () => {
    const state = seedWorkshop()
    const result = suggestAction('Registrar parte en BMW M3 E36: 2,5 horas; trabajo: montar frenos; operario: Àlex Ferrer', state, date)
    expect(result).toMatchObject({ kind: 'part', values: { projectId: 'p1', hours: '2.5', worker: 'Àlex Ferrer', description: 'montar frenos', hourlyCost: '', expense: '' } })
    if (!result) throw new Error('No se reconoció el parte de ejemplo.')
    expect(state.parts).toHaveLength(1)
    expect(() => applyProposal(state, result, 'new')).toThrow('Completa')
    const next = applyProposal(state, { ...result, values: { ...result.values, hourlyCost: '24', expense: '0', productId: 'a2', quantity: '2' } }, 'new')
    expect(next.parts[0]).toMatchObject({ projectId: 'p1', hours: 2.5, hourlyCost: 2400, materialCost: 17000 })
    expect(next.products.find((item) => item.id === 'a2')?.stock).toBe(1)
    expect(state.products.find((item) => item.id === 'a2')?.stock).toBe(3)
  })

  it('no elige un proyecto ambiguo ni ejecuta varias acciones de una nota', () => {
    const state = seedWorkshop()
    const first = state.projects[0]
    if (!first) throw new Error('Falta el proyecto de ejemplo.')
    state.projects.push({ ...first, id: 'duplicate', reference: 'RR-028' })
    expect(suggestAction('Terminar trabajo del BMW M3 E36', state, date)?.values.projectId).toBe('')
    expect(suggestAction('Recibir pedido PED-001 y crear borrador de factura', state, date)).toBeNull()
    expect(suggestAction('Haz lo que consideres', state, date)).toBeNull()
  })

  it('obliga a confirmar diferencias y aplica la recepción una sola vez', () => {
    const state = seedWorkshop()
    const result = suggestAction('Recibir pedido PED-001; cantidad: 1', state, date)
    expect(result).toMatchObject({ kind: 'receive', values: { purchaseId: 'o1', quantity: '1' } })
    if (!result) throw new Error('No se reconoció el pedido de ejemplo.')
    expect(() => applyProposal(state, result, 'id')).toThrow('Confirma la diferencia')
    const next = applyProposal(state, result, 'id', true)
    expect(next.products.find((item) => item.id === 'a1')?.stock).toBe(2)
    expect(() => applyProposal(next, result, 'id', true)).toThrow('ya se ha recibido')
  })

  it('usa las validaciones del taller para presupuesto, pedido y borrador', () => {
    const state = seedWorkshop()
    const line = proposal('quote', { projectId: 'p2', kind: 'mano de obra', description: 'Alineación', quantity: '2', price: '55,50' })
    let next = applyProposal(state, line, 'line')
    expect(next.projects.find((item) => item.id === 'p2')?.lines.at(-1)).toMatchObject({ price: 5550, quantity: 2 })
    next = applyProposal(next, proposal('approve', { projectId: 'p2' }), 'unused')
    next = applyProposal(next, proposal('invoice', { projectId: 'p2', date }), 'invoice')
    expect(next.invoices[0]?.lines.at(-1)?.price).toBe(5550)
    expect(() => applyProposal(next, proposal('invoice', { projectId: 'p2', date }), 'another')).toThrow('Ya hay un borrador')
    expect(() => applyProposal(next, proposal('purchase', { productId: 'a1', quantity: '0' }), 'order')).toThrow()
  })

  it('reconoce los ejemplos de tareas y compras y exige datos explícitos', () => {
    const state = seedWorkshop()
    const task = suggestAction('Añadir tarea al BMW M3 E36; tarea: revisar frenos; responsable: Àlex Ferrer', state, date)
    expect(task).toMatchObject({ kind: 'task', values: { projectId: 'p1', description: 'revisar frenos', worker: 'Àlex Ferrer' } })
    if (!task) throw new Error('No se reconoció la tarea de ejemplo.')
    expect(applyProposal(state, task, 'task').tasks.at(-1)).toMatchObject({ description: 'revisar frenos', worker: 'Àlex Ferrer' })
    const order = suggestAction('Crear pedido de Latiguillos metálicos para BMW M3 E36; cantidad: dos', state, date)
    expect(order).toMatchObject({ kind: 'purchase', values: { projectId: 'p1', productId: 'a2', quantity: '2' } })
    if (!order) throw new Error('No se reconoció el pedido de ejemplo.')
    expect(applyProposal(state, order, 'order').purchases[0]).toMatchObject({ productId: 'a2', quantity: 2, status: 'pendiente' })
    expect(() => applyProposal(state, proposal('absence', { worker: 'Àlex', from: '2026-12-20', to: '2026-12-10' }), 'absence')).toThrow('fechas')
  })
})