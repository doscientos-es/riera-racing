import type { Workshop } from '../domain/model'
import { applyProposal } from './assistant-command'
import type { ActionKind, Proposal } from './assistant-intent'
import { isWorkerAssigned } from './worker-access'

export type AssistantPrincipal = { role: 'admin' } | { role: 'worker'; name: string }
export class AssistantAccessError extends Error {}

export function canUseAction(principal: AssistantPrincipal, kind: ActionKind): boolean {
  return principal.role === 'admin' || kind === 'part' || kind === 'absence'
}

/** Demo-only policy. Real permissions must be enforced by the server for every operation. */
export function applyAssistantProposal(
  state: Workshop,
  proposal: Proposal,
  principal: AssistantPrincipal,
  id: string,
  confirmedDifference = false,
): Workshop {
  if (!canUseAction(principal, proposal.kind))
    throw new AssistantAccessError('Esta acción no está disponible para el perfil de trabajador.')
  if (principal.role === 'worker') {
    const worker = proposal.values.worker?.trim()
    if (!worker || worker.toLocaleLowerCase('es') !== principal.name.toLocaleLowerCase('es'))
      throw new AssistantAccessError(
        'El trabajador solo puede registrar sus propios partes y vacaciones.',
      )
    if (proposal.kind === 'part') {
      const project = state.projects.find((item) => item.id === proposal.values.projectId)
      if (project && !isWorkerAssigned(state, principal.name, project.id))
        throw new AssistantAccessError(
          'El trabajador solo puede registrar partes en proyectos asignados.',
        )
    }
  }
  return applyProposal(state, proposal, id, confirmedDifference)
}
