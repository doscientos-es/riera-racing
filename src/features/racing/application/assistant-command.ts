import type { Workshop } from '../domain/model'
import { addAbsence, addPart, addProject, addPurchase, addQuoteLine, addTask, approveProject, createInvoice, finishProject, receivePurchase } from '../domain/workshop'
import type { Proposal } from './assistant-intent'

function required(values: Record<string, string>, key: string): string {
  const value = values[key]?.trim() ?? ''
  if (!value) throw new Error('Completa todos los campos obligatorios antes de confirmar.')
  return value
}
function numeric(values: Record<string, string>, key: string): number {
  const value = Number(required(values, key).replace(',', '.'))
  if (!Number.isFinite(value)) throw new Error('Revisa los importes y cantidades.')
  return value
}
const cents = (values: Record<string, string>, key: string) => Math.round(numeric(values, key) * 100)

/** Applies only the reviewed proposal, through the same domain rules as the screens. */
export function applyProposal(state: Workshop, proposal: Proposal, id: string, confirmedDifference = false): Workshop {
  const { kind, values: v } = proposal
  switch (kind) {
    case 'project':
      return addProject(state, { id, reference: `RR-${id.slice(0, 8)}`, client: required(v, 'client'), vehicle: required(v, 'vehicle'), plate: required(v, 'plate'), title: required(v, 'description'), responsible: v.worker?.trim() ?? '', status: 'presupuesto', lines: [] })
    case 'quote': {
      const lineKind = required(v, 'kind')
      if (lineKind !== 'pieza' && lineKind !== 'mano de obra') throw new Error('Selecciona el tipo de partida.')
      return addQuoteLine(state, required(v, 'projectId'), { id, kind: lineKind, description: required(v, 'description'), supplier: v.supplier?.trim() ?? '', quantity: numeric(v, 'quantity'), price: cents(v, 'price') })
    }
    case 'approve': return approveProject(state, required(v, 'projectId'))
    case 'finish': return finishProject(state, required(v, 'projectId'))
    case 'part': {
      const productId = v.productId || null
      return addPart(state, { id, projectId: required(v, 'projectId'), date: required(v, 'date'), worker: required(v, 'worker'), description: required(v, 'description'), hours: numeric(v, 'hours'), hourlyCost: cents(v, 'hourlyCost'), productId, quantity: productId ? numeric(v, 'quantity') : 0, expense: cents(v, 'expense') })
    }
    case 'task': return addTask(state, { id, projectId: required(v, 'projectId'), description: required(v, 'description'), worker: required(v, 'worker'), done: false })
    case 'purchase': return addPurchase(state, { id, reference: `PED-${id.slice(0, 8)}`, projectId: v.projectId || null, productId: required(v, 'productId'), quantity: numeric(v, 'quantity'), received: null, status: 'pendiente' })
    case 'receive': return receivePurchase(state, required(v, 'purchaseId'), numeric(v, 'quantity'), confirmedDifference)
    case 'invoice': return createInvoice(state, { id, projectId: required(v, 'projectId'), date: required(v, 'date'), lines: [], paid: false })
    case 'absence': return addAbsence(state, { id, worker: required(v, 'worker'), from: required(v, 'from'), to: required(v, 'to') })
  }
}