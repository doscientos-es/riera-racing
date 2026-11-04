import { Button } from '@doscientos/ui'

import { clientSummaries, workshopOverview } from '../application/overview'
import type { Workshop } from '../domain/model'
import { quoteTotal } from '../domain/workshop'
import { Badge, Empty, Section, money } from './shared'

export function ClientsPage({
  state,
  openProject,
}: {
  state: Workshop
  openProject: (id: string) => void
}) {
  const clients = clientSummaries(state)
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <h1>Clientes</h1>
        </div>
      </div>
      <Section
        title="Clientes de proyectos"
        subtitle="Vista obtenida de los proyectos; los nombres iguales se agrupan."
      >
        {clients.length ? (
          <div className="rr-list">
            {clients.map(({ name, projects }) => (
              <div className="rr-client" key={name}>
                <strong>{name}</strong>
                <p>
                  {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
                </p>
                <div className="rr-actions">
                  {projects.map((project) => (
                    <Button
                      key={project.id}
                      variant="outline"
                      onClick={() => openProject(project.id)}
                    >
                      {project.reference} · {project.vehicle}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>No hay clientes todavía.</Empty>
        )}
      </Section>
    </div>
  )
}

export function FinanceOverviewPage({
  state,
  mode,
}: {
  state: Workshop
  mode: 'gastos' | 'contabilidad' | 'informes'
}) {
  const totals = workshopOverview(state)
  const expenses = state.parts.filter((part) => part.expense > 0)
  const paidDrafts = state.invoices.filter((invoice) => invoice.paid)
  const unpaidDrafts = state.invoices.filter((invoice) => !invoice.paid)
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <h1>
            {mode === 'gastos' ? 'Gastos' : mode === 'contabilidad' ? 'Contabilidad' : 'Informes'}
          </h1>
        </div>
      </div>
      <div className="rr-notice">
        Cifras orientativas: no son contabilidad ni beneficio fiscal. Los borradores no son facturas
        emitidas.
      </div>
      {mode === 'gastos' ? (
        <Section title="Gastos imputados" subtitle={`Total registrado: ${money(totals.expenses)}`}>
          {expenses.length ? (
            <div className="rr-list">
              {expenses.map((part) => (
                <div className="rr-list-row" key={part.id}>
                  <div>
                    <strong>{part.description}</strong>
                    <p>
                      {state.projects.find((project) => project.id === part.projectId)?.reference} ·{' '}
                      {part.date} · {part.worker}
                    </p>
                  </div>
                  <Badge>{money(part.expense)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <Empty>No hay gastos en los partes. Añádelos desde Partes de taller.</Empty>
          )}
        </Section>
      ) : mode === 'contabilidad' ? (
        <Section
          title="Seguimiento de borradores"
          subtitle="Importes sin IVA; marcar un pago no realiza ningún cobro."
        >
          <div className="rr-metrics rr-metrics-small">
            <div>
              <span>Sin pago marcado</span>
              <strong>
                {money(unpaidDrafts.reduce((sum, invoice) => sum + quoteTotal(invoice.lines), 0))}
              </strong>
              <small>{unpaidDrafts.length} borradores</small>
            </div>
            <div>
              <span>Con pago marcado</span>
              <strong>
                {money(paidDrafts.reduce((sum, invoice) => sum + quoteTotal(invoice.lines), 0))}
              </strong>
              <small>{paidDrafts.length} borradores</small>
            </div>
            <div>
              <span>Costes registrados</span>
              <strong>{money(totals.totalCost)}</strong>
              <small>solo partes de taller</small>
            </div>
          </div>
        </Section>
      ) : (
        <>
          <div className="rr-metrics rr-metrics-small">
            <div>
              <span>Mano de obra</span>
              <strong>{money(totals.labor)}</strong>
              <small>coste imputado</small>
            </div>
            <div>
              <span>Piezas consumidas</span>
              <strong>{money(totals.materials)}</strong>
              <small>coste registrado</small>
            </div>
            <div>
              <span>Otros gastos</span>
              <strong>{money(totals.expenses)}</strong>
              <small>en partes</small>
            </div>
          </div>
          <Section
            title="Resumen de proyectos"
            subtitle={`Coste registrado ${money(totals.totalCost)} · Borradores ${money(totals.draftValue)} sin IVA`}
          >
            <div className="rr-list">
              {state.projects.map((project) => (
                <div className="rr-list-row" key={project.id}>
                  <div>
                    <strong>
                      {project.vehicle} · {project.title}
                    </strong>
                    <p>
                      {project.reference} · {project.client} · {project.status}
                    </p>
                  </div>
                  <Badge>{money(quoteTotal(project.lines))} presupuestado</Badge>
                </div>
              ))}
            </div>
          </Section>
        </>
      )}
    </div>
  )
}

export function ActivityPage({ state }: { state: Workshop }) {
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <h1>Actividad</h1>
        </div>
      </div>
      <Section
        title="Historial local"
        subtitle="No registra cambios anteriores ni identifica usuarios."
      >
        {state.activity.length ? (
          <div className="rr-list">
            {state.activity.map((event) => (
              <div className="rr-list-row" key={event.id}>
                <strong>{event.description}</strong>
                <span>{new Date(event.at).toLocaleString('es-ES')}</span>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Todavía no hay actividad registrada.</Empty>
        )}
      </Section>
    </div>
  )
}
