import type { Workshop } from '../domain/model'

export type ActionKind = 'project' | 'quote' | 'approve' | 'finish' | 'part' | 'task' | 'purchase' | 'receive' | 'invoice' | 'absence'
export type Proposal = { kind: ActionKind; values: Record<string, string> }

export const ACTIONS: { kind: ActionKind; label: string; pattern: RegExp }[] = [
  { kind: 'project', label: 'Crear proyecto', pattern: /\b(?:crear|nuevo|nueva|abre|abrir)\b.*\bproyecto\b/ },
  { kind: 'quote', label: 'Añadir partida de presupuesto', pattern: /\b(?:anadir|agregar|crear)\b.*\bpartida\b/ },
  { kind: 'approve', label: 'Aprobar presupuesto', pattern: /\b(?:aprobar|aprueba)\b.*\bpresupuesto\b/ },
  { kind: 'finish', label: 'Terminar trabajo', pattern: /\b(?:terminar|termina|finalizar|finaliza)\b.*\b(?:trabajo|proyecto)\b/ },
  { kind: 'part', label: 'Registrar parte de taller', pattern: /\b(?:registrar|registra|crear|anadir)\b.*\bparte\b/ },
  { kind: 'task', label: 'Añadir tarea', pattern: /\b(?:anadir|agregar|crear|asignar)\b.*\btarea\b/ },
  { kind: 'purchase', label: 'Crear pedido', pattern: /\b(?:crear|crea|hacer|pedir|nuevo)\b.*\bpedido\b/ },
  { kind: 'receive', label: 'Recibir pedido', pattern: /\b(?:recibir|recibe|recepcionar)\b.*\bpedido\b/ },
  { kind: 'invoice', label: 'Crear borrador de factura', pattern: /\b(?:crear|crea|preparar|genera|generar)\b.*\b(?:factura|borrador)\b/ },
  { kind: 'absence', label: 'Registrar vacaciones', pattern: /\b(?:registrar|anadir|crear|apuntar)\b.*\bvacaciones\b/ },
]

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const words: Record<string, string> = { cero: '0', un: '1', una: '1', uno: '1', dos: '2', tres: '3', cuatro: '4', cinco: '5', seis: '6', siete: '7', ocho: '8', nueve: '9', diez: '10' }
const number = (value: string) => words[normalize(value)] ?? value.replace(',', '.')

function uniqueMention<T extends { id: string }>(text: string, items: T[], labels: (item: T) => string[]): string {
  const haystack = ` ${normalize(text)} `
  const matches = items.filter((item) => labels(item).some((label) => {
    const needle = normalize(label)
    return needle.length > 0 && haystack.includes(` ${needle} `)
  }))
  return matches.length === 1 ? (matches[0]?.id ?? '') : ''
}

function field(text: string, name: string): string {
  return text.match(new RegExp(`(?:^|[,;]\\s*)(?:${name})\\s*:?\\s*([^,;]+)`, 'i'))?.[1]?.trim() ?? ''
}

const numberPattern = '(\\d+(?:[.,]\\d+)?|cero|una|uno|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)'
function numberField(text: string, name: string): string {
  return text.match(new RegExp(`(?:^|[,;]\\s*)(?:${name})\\s*:?\\s*${numberPattern}(?=\\s*(?:;|,\\s+|$))`, 'i'))?.[1] ?? ''
}

/** Deliberately limited demo parser; ambiguous actions and entities are never guessed. */
export function suggestAction(text: string, state: Workshop, date: string): Proposal | null {
  const normalized = normalize(text)
  const matches = ACTIONS.filter((action) => action.pattern.test(normalized))
  if (matches.length !== 1 || !matches[0]) return null
  const kind = matches[0].kind
  const values: Record<string, string> = {
    projectId: uniqueMention(text, state.projects, (item) => [item.reference, item.vehicle, item.plate]),
    productId: uniqueMention(text, state.products, (item) => [item.sku, item.name]),
    purchaseId: uniqueMention(text, state.purchases, (item) => [item.reference]),
    date,
    worker: field(text, 'operario|responsable'),
    description: field(text, 'trabajo|tarea|concepto'),
    client: field(text, 'cliente'),
    vehicle: field(text, 'veh[ií]culo'),
    plate: field(text, 'matr[ií]cula|referencia'),
    from: field(text, 'desde'),
    to: field(text, 'hasta'),
    supplier: field(text, 'proveedor'),
    kind: /\bmano de obra\b/.test(normalized) ? 'mano de obra' : '',
  }
  const hours = text.match(new RegExp(`\\b${numberPattern}\\s+horas?\\b`, 'i'))?.[1]
  const quantity = numberField(text, 'cantidad') || text.match(new RegExp(`\\b${numberPattern}\\s+(?:unidades?|uds?)\\b`, 'i'))?.[1] || ''
  values.hours = hours ? number(hours) : ''
  values.quantity = quantity ? number(quantity) : ''
  values.price = number(numberField(text, 'precio'))
  values.hourlyCost = number(numberField(text, 'coste por hora'))
  values.expense = number(numberField(text, 'gastos'))
  return { kind, values }
}