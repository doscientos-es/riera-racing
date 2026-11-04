import type { FormEvent } from 'react'

import { applyProposal } from '../application/assistant-command'
import { ACTIONS, type ActionKind, type Proposal } from '../application/assistant-intent'
import type { Workshop } from '../domain/model'
import { Field, Section, uid, type Change } from './shared'

type FieldKey =
  | 'projectId'
  | 'productId'
  | 'purchaseId'
  | 'date'
  | 'client'
  | 'vehicle'
  | 'plate'
  | 'description'
  | 'worker'
  | 'hours'
  | 'hourlyCost'
  | 'quantity'
  | 'expense'
  | 'kind'
  | 'price'
  | 'supplier'
  | 'from'
  | 'to'
type Spec = { key: FieldKey; label: string; optional?: boolean; type?: 'number' | 'date' }
const field = (key: FieldKey, label: string, options: Omit<Spec, 'key' | 'label'> = {}): Spec => ({
  key,
  label,
  ...options,
})
const project = field('projectId', 'Proyecto')
const description = field('description', 'Trabajo / descripción')
const worker = field('worker', 'Operario / responsable')
const quantity = field('quantity', 'Cantidad', { type: 'number' })
const date = field('date', 'Fecha', { type: 'date' })
const product = field('productId', 'Pieza')
const fields: Record<ActionKind, Spec[]> = {
  project: [
    field('client', 'Cliente'),
    field('vehicle', 'Vehículo'),
    field('plate', 'Matrícula o referencia'),
    description,
    { ...worker, optional: true },
  ],
  quote: [
    project,
    field('kind', 'Tipo de partida'),
    description,
    { ...field('supplier', 'Proveedor'), optional: true },
    quantity,
    field('price', 'Precio unitario (€)', { type: 'number' }),
  ],
  approve: [project],
  finish: [project],
  part: [
    project,
    date,
    worker,
    description,
    field('hours', 'Horas', { type: 'number' }),
    field('hourlyCost', 'Coste / hora (€)', { type: 'number' }),
    { ...product, optional: true },
    quantity,
    field('expense', 'Otros gastos (€)', { type: 'number' }),
  ],
  task: [project, description, worker],
  purchase: [product, quantity, { ...project, optional: true }],
  receive: [field('purchaseId', 'Pedido'), quantity],
  invoice: [project, date],
  absence: [
    worker,
    field('from', 'Desde', { type: 'date' }),
    field('to', 'Hasta', { type: 'date' }),
  ],
}

export function AssistantForm({
  proposal,
  setProposal,
  state,
  change,
  cancel,
}: {
  proposal: Proposal
  setProposal: (proposal: Proposal) => void
  state: Workshop
  change: Change
  cancel: () => void
}) {
  const [kind, values] = [proposal.kind, proposal.values]
  const purchase = state.purchases.find((item) => item.id === values.purchaseId)
  const different =
    kind === 'receive' &&
    purchase &&
    values.quantity?.trim() &&
    Number(values.quantity) !== purchase.quantity
  const update = (key: string, value: string) =>
    setProposal({ ...proposal, values: { ...values, [key]: value, confirmedDifference: '' } })
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const id = uid()
    if (
      change((current) =>
        applyProposal(current, proposal, id, values.confirmedDifference === 'yes'),
      )
    )
      cancel()
  }
  const label = ACTIONS.find((item) => item.kind === kind)?.label ?? ''
  return (
    <Section
      title={`Revisar: ${label}`}
      subtitle="No se guarda nada hasta que confirmes. Completa y corrige todos los datos necesarios."
    >
      <form className="rr-stack" onSubmit={submit}>
        <div className="rr-form-grid">
          {fields[kind]
            .filter((spec) => !(kind === 'part' && spec.key === 'quantity' && !values.productId))
            .map((spec) => {
              const value = values[spec.key] ?? ''
              const required = !spec.optional
              const options =
                spec.key === 'projectId'
                  ? state.projects.map((item) => ({
                      id: item.id,
                      label: `${item.reference} · ${item.vehicle} · ${item.status}`,
                    }))
                  : spec.key === 'productId'
                    ? state.products.map((item) => ({
                        id: item.id,
                        label: `${item.sku} · ${item.name} · ${item.stock} disponibles`,
                      }))
                    : spec.key === 'purchaseId'
                      ? state.purchases
                          .filter((item) => item.status === 'pendiente')
                          .map((item) => ({
                            id: item.id,
                            label: `${item.reference} · ${item.quantity} uds.`,
                          }))
                      : spec.key === 'kind'
                        ? [
                            { id: 'pieza', label: 'Pieza' },
                            { id: 'mano de obra', label: 'Mano de obra' },
                          ]
                        : null
              return (
                <Field key={spec.key} label={`${spec.label}${spec.optional ? ' (opcional)' : ''}`}>
                  {options ? (
                    <select
                      value={value}
                      required={required}
                      onChange={(event) => update(spec.key, event.target.value)}
                    >
                      <option value="">Seleccionar</option>
                      {options.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={spec.type ?? 'text'}
                      min={spec.type === 'number' ? '0' : undefined}
                      step={
                        spec.type === 'number'
                          ? spec.key === 'quantity' && kind !== 'quote'
                            ? '1'
                            : 'any'
                          : undefined
                      }
                      required={required}
                      value={value}
                      onChange={(event) => update(spec.key, event.target.value)}
                    />
                  )}
                </Field>
              )
            })}
        </div>
        {different && (
          <label className="rr-warning">
            <input
              type="checkbox"
              checked={values.confirmedDifference === 'yes'}
              onChange={(event) =>
                setProposal({
                  ...proposal,
                  values: { ...values, confirmedDifference: event.target.checked ? 'yes' : '' },
                })
              }
            />{' '}
            Pedido de {purchase.quantity} unidades; se cerrará con {values.quantity}. Confirmo la
            diferencia.
          </label>
        )}
        {kind === 'invoice' && (
          <p className="rr-hint">
            Se copiarán las partidas del presupuesto. No es una factura fiscal ni se enviará.
          </p>
        )}
        {kind === 'purchase' && (
          <p className="rr-hint">
            El pedido se registra localmente; no se envía al proveedor.{' '}
            {values.projectId
              ? 'Se vinculará al proyecto seleccionado.'
              : 'Sin proyecto seleccionado será una compra general.'}
          </p>
        )}
        {kind === 'part' && (
          <p className="rr-hint">
            {values.productId
              ? 'Al guardar se descontará la cantidad indicada del stock.'
              : 'Sin pieza seleccionada no se descontará stock.'}
          </p>
        )}
        <div className="rr-actions">
          <button className="rr-button" type="submit">
            Confirmar y guardar
          </button>
          <button className="rr-button rr-button-light" type="button" onClick={cancel}>
            Cancelar
          </button>
        </div>
      </form>
    </Section>
  )
}
