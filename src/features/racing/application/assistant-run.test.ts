import { describe, expect, it } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import { applyAssistantProposal, type AssistantPrincipal } from './assistant-access'
import type { Proposal } from './assistant-intent'
import { prepareVoiceAction } from './assistant-run'

const admin: AssistantPrincipal = { role: 'admin' }
const worker: AssistantPrincipal = { role: 'worker', name: 'Àlex Ferrer' }
const date = '2026-11-04'

describe('asistente flotante simulado', () => {
  it('prepara una orden exacta sin modificar el estado y permite guardarla', () => {
    const state = seedWorkshop()
    const result = prepareVoiceAction(
      'Aprobar presupuesto del Porsche 911 GT3',
      state,
      admin,
      date,
      'new',
    )
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') throw new Error('Se esperaba una orden completa.')
    expect(result.summary).toContain('Porsche 911 GT3')
    expect(state.projects.find((project) => project.id === 'p2')?.status).toBe('presupuesto')
    expect(
      applyAssistantProposal(state, result.proposal, admin, 'new').projects.find(
        (project) => project.id === 'p2',
      )?.status,
    ).toBe('en taller')
  })

  it('no ejecuta preguntas, negaciones, condiciones ni instrucciones múltiples', () => {
    const state = seedWorkshop()
    expect(
      prepareVoiceAction('No aprobar presupuesto del Porsche 911 GT3', state, admin, date, 'new')
        .status,
    ).toBe('error')
    expect(
      prepareVoiceAction('¿Aprobar presupuesto del Porsche 911 GT3?', state, admin, date, 'new')
        .status,
    ).toBe('error')
    expect(
      prepareVoiceAction(
        'Quiero saber cómo aprobar presupuesto del Porsche 911 GT3',
        state,
        admin,
        date,
        'new',
      ).status,
    ).toBe('review')
    expect(
      prepareVoiceAction(
        'Aprobar presupuesto del Porsche 911 GT3 cuando el cliente confirme',
        state,
        admin,
        date,
        'new',
      ).status,
    ).toBe('review')
    expect(
      prepareVoiceAction(
        'Aprobar presupuesto del Porsche 911 GT3 y crear borrador de factura',
        state,
        admin,
        date,
        'new',
      ).status,
    ).toBe('error')
    expect(state.projects.find((project) => project.id === 'p2')?.status).toBe('presupuesto')
  })

  it('comprueba permisos tanto al preparar como al guardar', () => {
    const state = seedWorkshop()
    expect(
      prepareVoiceAction('Aprobar presupuesto del Porsche 911 GT3', state, worker, date, 'new')
        .status,
    ).toBe('error')
    const part: Proposal = {
      kind: 'part',
      values: {
        projectId: 'p1',
        date,
        worker: 'Àlex Ferrer',
        description: 'Frenos',
        hours: '2',
        hourlyCost: '24',
        expense: '0',
      },
    }
    expect(applyAssistantProposal(state, part, worker, 'new').parts[0]?.worker).toBe('Àlex Ferrer')
    expect(() =>
      applyAssistantProposal(
        state,
        { ...part, values: { ...part.values, worker: 'Otra persona' } },
        worker,
        'new',
      ),
    ).toThrow('sus propios')
    expect(() =>
      applyAssistantProposal(
        state,
        { ...part, values: { ...part.values, projectId: 'p2' } },
        worker,
        'new',
      ),
    ).toThrow('proyectos asignados')
    expect(() =>
      applyAssistantProposal(
        state,
        { kind: 'invoice', values: { projectId: 'p1', date } },
        worker,
        'new',
      ),
    ).toThrow('no está disponible')
  })

  it('registra un parte propio completo y pide revisar uno incompleto', () => {
    const state = seedWorkshop()
    const result = prepareVoiceAction(
      'Registrar parte en BMW M3 E36 2 horas trabajo montar frenos coste por hora 24 gastos 0',
      state,
      worker,
      date,
      'new',
    )
    expect(result.status).toBe('ready')
    if (result.status !== 'ready') throw new Error('Se esperaba un parte completo.')
    expect(applyAssistantProposal(state, result.proposal, worker, 'new').parts[0]).toMatchObject({
      worker: 'Àlex Ferrer',
      hours: 2,
      hourlyCost: 2400,
      expense: 0,
    })
    expect(
      prepareVoiceAction(
        'Registrar parte en BMW M3 E36 2 horas trabajo montar frenos',
        state,
        worker,
        date,
        'new',
      ).status,
    ).toBe('review')
  })

  it('exige revisión si hay recepción diferente o proyecto ambiguo', () => {
    const state = seedWorkshop()
    expect(
      prepareVoiceAction('Recibir pedido PED-001; cantidad: 1', state, admin, date, 'new').status,
    ).toBe('review')
    const first = state.projects[0]
    if (!first) throw new Error('Falta el proyecto.')
    state.projects.push({ ...first, id: 'duplicate', reference: 'RR-028' })
    expect(
      prepareVoiceAction('Terminar trabajo del BMW M3 E36', state, admin, date, 'new').status,
    ).toBe('review')
  })
})
