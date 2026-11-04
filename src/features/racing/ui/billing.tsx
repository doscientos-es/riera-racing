import { Button } from '@doscientos/ui'
import { useState, type FormEvent } from 'react'

import type { Workshop } from '../domain/model'
import { createInvoice, quoteTotal } from '../domain/workshop'
import {
  Badge,
  Empty,
  Field,
  FormDialog,
  ProjectSelect,
  Section,
  downloadCsv,
  money,
  today,
  uid,
  type Change,
} from './shared'

export function BillingPage({ state, change }: { state: Workshop; change: Change }) {
  const [adding, setAdding] = useState(false)
  const [projectId, setProjectId] = useState('')
  const available = state.projects.filter(
    (project) =>
      project.status !== 'presupuesto' &&
      !state.invoices.some((invoice) => invoice.projectId === project.id),
  )
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (
      change((current) =>
        createInvoice(current, { id: uid(), projectId, date: today(), lines: [], paid: false }),
      )
    ) {
      setProjectId('')
      setAdding(false)
    }
  }
  const exportCsv = () =>
    downloadCsv('riera-racing-borradores-demo.csv', [
      ['Fecha', 'Proyecto', 'Cliente', 'Vehículo', 'Base sin IVA', 'IVA 21%', 'Total', 'Estado'],
      ...state.invoices.map((invoice) => {
        const project = state.projects.find((item) => item.id === invoice.projectId)
        const base = quoteTotal(invoice.lines)
        return [
          invoice.date,
          project?.reference ?? '',
          project?.client ?? '',
          project?.vehicle ?? '',
          (base / 100).toFixed(2).replace('.', ','),
          (Math.round(base * 0.21) / 100).toFixed(2).replace('.', ','),
          ((base + Math.round(base * 0.21)) / 100).toFixed(2).replace('.', ','),
          invoice.paid ? 'Cobro simulado' : 'Borrador',
        ]
      }),
    ])
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <span className="rr-eyebrow">CIERRE Y GESTORÍA</span>
          <h1>Facturación</h1>
        </div>
        <div className="rr-actions">
          <Button variant="outline" disabled={!state.invoices.length} onClick={exportCsv}>
            Descargar CSV de ejemplo
          </Button>
          <Button aria-haspopup="dialog" aria-expanded={adding} onClick={() => setAdding(true)}>
            + Preparar borrador
          </Button>
        </div>
      </div>
      <div className="rr-notice">
        <strong>Solo demostración.</strong> Los borradores no son facturas fiscales, no se envían y
        el CSV debe adaptarse al formato de la asesoría.
      </div>
      <FormDialog
        open={adding}
        onOpenChange={(open) => {
          setAdding(open)
          if (!open) setProjectId('')
        }}
        title="Preparar borrador"
        description="Se copian las líneas del presupuesto aprobado para su revisión."
      >
        <form className="rr-actions rr-invoice-form" onSubmit={create}>
          <Field label="Proyecto">
            <ProjectSelect
              projects={available}
              value={projectId}
              onChange={setProjectId}
              placeholder="Selecciona un proyecto aprobado"
            />
          </Field>
          <Button type="submit" disabled={!projectId}>
            Crear borrador
          </Button>
        </form>
      </FormDialog>
      <Section title="Borradores" subtitle="Importes de ejemplo con IVA del 21 %.">
        {state.invoices.length ? (
          <div className="rr-list">
            {state.invoices.map((invoice) => {
              const project = state.projects.find((item) => item.id === invoice.projectId)
              const base = quoteTotal(invoice.lines)
              return (
                <div className="rr-invoice" key={invoice.id}>
                  <div className="rr-list-row">
                    <div>
                      <strong>
                        {project?.reference} · {project?.client}
                      </strong>
                      <p>
                        {project?.vehicle} · {invoice.date} · Base {money(base)} + IVA{' '}
                        {money(Math.round(base * 0.21))}
                      </p>
                    </div>
                    <div className="rr-actions">
                      <strong>{money(base + Math.round(base * 0.21))}</strong>
                      <Badge tone={invoice.paid ? 'green' : 'amber'}>
                        {invoice.paid ? 'Cobro simulado' : 'Borrador'}
                      </Badge>
                      {!invoice.paid && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            change((current) => ({
                              ...current,
                              invoices: current.invoices.map((item) =>
                                item.id === invoice.id ? { ...item, paid: true } : item,
                              ),
                            }))
                          }
                        >
                          Simular cobro
                        </Button>
                      )}
                    </div>
                  </div>
                  <details>
                    <summary>Ver líneas del borrador</summary>
                    <ul>
                      {invoice.lines.map((line) => (
                        <li key={line.id}>
                          {line.description} · {line.quantity} × {money(line.price)} ={' '}
                          {money(line.quantity * line.price)}
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty>Aún no hay borradores.</Empty>
        )}
      </Section>
    </div>
  )
}
