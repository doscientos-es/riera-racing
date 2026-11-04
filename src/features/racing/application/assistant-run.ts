import type { Workshop } from '../domain/model'
import {
  AssistantAccessError,
  applyAssistantProposal,
  type AssistantPrincipal,
} from './assistant-access'
import { ACTIONS, suggestAction, type Proposal } from './assistant-intent'

export type VoiceResult =
  | { status: 'ready'; proposal: Proposal; summary: string }
  | { status: 'review'; proposal: Proposal; message: string }
  | { status: 'error'; message: string }

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

export function describeProposal(proposal: Proposal, state: Workshop): string {
  const { values } = proposal
  const label = ACTIONS.find((action) => action.kind === proposal.kind)?.label ?? 'Acción'
  const project = state.projects.find((item) => item.id === values.projectId)
  const purchase = state.purchases.find((item) => item.id === values.purchaseId)
  const product = state.products.find((item) => item.id === values.productId)
  return [
    label,
    project && `${project.reference} · ${project.vehicle}`,
    purchase?.reference,
    product?.name,
    values.description,
    values.worker,
    values.hours && `${values.hours} horas`,
    values.quantity && `${values.quantity} unidades`,
    values.from && values.to && `${values.from} a ${values.to}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

// Only exact, fully specified commands are executed without review. Everything else
// is a proposal: the demo parser cannot reliably infer negation or intent.
function isExactCommand(
  text: string,
  proposal: Proposal,
  state: Workshop,
  principal: AssistantPrincipal,
): boolean {
  const prefixes: Partial<Record<Proposal['kind'], string[]>> = {
    approve: [
      'aprobar presupuesto de',
      'aprobar presupuesto del',
      'aprueba presupuesto de',
      'aprueba presupuesto del',
    ],
    finish: [
      'terminar trabajo de',
      'terminar trabajo del',
      'finalizar trabajo de',
      'finalizar trabajo del',
    ],
    invoice: ['crear borrador de factura de', 'crear borrador de factura del'],
  }
  const project = state.projects.find((item) => item.id === proposal.values.projectId)
  if (!project) return false
  const input = normalize(text)
  if (proposal.kind === 'part' && principal.role === 'worker' && !proposal.values.productId) {
    const { hours, description, hourlyCost, expense } = proposal.values
    return [project.reference, project.vehicle, project.plate].some(
      (label) =>
        normalize(label) !== '' &&
        input ===
          normalize(
            `registrar parte en ${label} ${hours} horas trabajo ${description} coste por hora ${hourlyCost} gastos ${expense}`,
          ),
    )
  }
  return (prefixes[proposal.kind] ?? []).some((prefix) =>
    [project.reference, project.vehicle, project.plate].some(
      (label) => normalize(label) !== '' && input === `${prefix} ${normalize(label)}`,
    ),
  )
}

/** Prepare one operation without writing anything or assuming missing information. */
export function prepareVoiceAction(
  text: string,
  state: Workshop,
  principal: AssistantPrincipal,
  date: string,
  id: string,
): VoiceResult {
  if (
    /\b(?:no|quiz[aá]s|quiz[aá]|tal vez|podr[ií]a|podr[ií]as|si|pregunta)\b/i.test(text) ||
    /[¿?]/.test(text)
  )
    return {
      status: 'error',
      message: 'La frase no es una orden inequívoca. No se ha guardado nada.',
    }
  const proposal = suggestAction(text, state, date)
  if (!proposal)
    return {
      status: 'error',
      message: 'No he identificado una única acción. Prueba una frase de ejemplo.',
    }
  if (principal.role === 'worker' && !proposal.values.worker)
    proposal.values.worker = principal.name
  try {
    if (proposal.kind === 'purchase' && !proposal.values.projectId)
      throw new Error('Selecciona el proyecto o confirma que es una compra general.')
    applyAssistantProposal(state, proposal, principal, id)
    if (!isExactCommand(text, proposal, state, principal))
      return {
        status: 'review',
        proposal,
        message: 'Confirma la acción y sus datos antes de guardarla.',
      }
    return {
      status: 'ready',
      proposal,
      summary: describeProposal(proposal, state),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se ha podido preparar la acción.'
    if (error instanceof AssistantAccessError) return { status: 'error', message }
    return { status: 'review', proposal, message }
  }
}
