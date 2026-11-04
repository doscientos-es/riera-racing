import { Button } from '@doscientos/ui'
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  Plus,
  Wrench,
} from 'lucide-react'

import type { Workshop } from '../domain/model'
import { projectCosts, quoteTotal } from '../domain/workshop'
import { Section, Status, money } from './shared'

export type Page =
  | 'inicio'
  | 'proyectos'
  | 'presupuestos'
  | 'planificacion'
  | 'incidencias'
  | 'clientes'
  | 'gastos'
  | 'contabilidad'
  | 'informes'
  | 'actividad'
  | 'taller'
  | 'inventario'
  | 'compras'
  | 'facturacion'
  | 'equipo'

export function Dashboard({
  state,
  navigate,
  select,
}: {
  state: Workshop
  navigate: (page: Page) => void
  select: (id: string) => void
}) {
  const active = state.projects.filter((project) => project.status === 'en taller')
  const budgets = state.projects.filter((project) => project.status === 'presupuesto')
  const lowStock = state.products.filter((product) => product.stock <= product.minimum)
  const pending = state.purchases.filter((purchase) => purchase.status === 'pendiente')
  const openTasks = state.tasks.filter((task) => !task.done)
  const incidents = state.incidents.filter((incident) => !incident.resolved)
  const openInvoices = state.invoices.filter((invoice) => !invoice.paid)
  const attentionCount = lowStock.length + pending.length + openTasks.length + incidents.length
  return (
    <div className="rr-dashboard">
      <header className="rr-dash-welcome">
        <h1>Resumen</h1>
        <Button onClick={() => navigate('presupuestos')}>
          <Plus size={16} /> Nuevo presupuesto
        </Button>
      </header>

      <section className="rr-dash-stats" aria-label="Resumen del taller">
        <article className="rr-dash-stat rr-dash-stat-featured">
          <div className="rr-dash-stat-top">
            <span>En taller</span>
            <span className="rr-dash-stat-icon">
              <Wrench size={17} />
            </span>
          </div>
          <strong>{active.length.toString().padStart(2, '0')}</strong>
          <small>{active.length ? 'Actividad en curso' : 'Sin trabajos activos'}</small>
        </article>
        <article className="rr-dash-stat">
          <div className="rr-dash-stat-top">
            <span>Presupuestos</span>
            <span className="rr-dash-stat-icon rr-stat-icon-amber">
              <Clock3 size={17} />
            </span>
          </div>
          <strong>{budgets.length.toString().padStart(2, '0')}</strong>
          <small>{budgets.length ? 'Pendientes de aprobación' : 'Todo al día'}</small>
          <button className="rr-stat-link" onClick={() => navigate('presupuestos')}>
            Revisar <ArrowUpRight size={13} />
          </button>
        </article>
        <article className="rr-dash-stat">
          <div className="rr-dash-stat-top">
            <span>Por cobrar</span>
            <span className="rr-dash-stat-icon rr-stat-icon-green">
              <span>€</span>
            </span>
          </div>
          <strong className="rr-stat-money">
            {money(openInvoices.reduce((sum, invoice) => sum + quoteTotal(invoice.lines), 0))}
          </strong>
          <small>
            {openInvoices.length}{' '}
            {openInvoices.length === 1 ? 'factura pendiente' : 'facturas pendientes'}
          </small>
          <button className="rr-stat-link" onClick={() => navigate('facturacion')}>
            Ver facturación <ArrowUpRight size={13} />
          </button>
        </article>
        <article className="rr-dash-stat">
          <div className="rr-dash-stat-top">
            <span>Atención</span>
            <span className="rr-dash-stat-icon rr-stat-icon-red">
              <Bell size={17} />
            </span>
          </div>
          <strong>{attentionCount.toString().padStart(2, '0')}</strong>
          <small>{attentionCount ? 'Elementos por revisar' : 'Todo bajo control'}</small>
          <button className="rr-stat-link" onClick={() => navigate('incidencias')}>
            Ver pendientes <ArrowUpRight size={13} />
          </button>
        </article>
      </section>

      <div className="rr-dashboard-grid">
        <div className="rr-dash-main-column">
          <Section
            title="Proyectos en marcha"
            action={
              <button className="rr-dash-view-all" onClick={() => navigate('proyectos')}>
                Ver proyectos <ArrowRight size={14} />
              </button>
            }
          >
            {active.length ? (
              <div className="rr-dash-projects">
                {active.map((project, index) => {
                  const costs = projectCosts(state.parts, project.id)
                  const tasks = state.tasks.filter((task) => task.projectId === project.id)
                  const done = tasks.filter((task) => task.done).length
                  const progress = tasks.length
                    ? Math.round((done / tasks.length) * 100)
                    : Math.min(70, Math.max(18, Math.round((costs.hours / 24) * 100)))
                  return (
                    <button
                      className="rr-dash-project"
                      key={project.id}
                      onClick={() => {
                        select(project.id)
                        navigate('proyectos')
                      }}
                    >
                      <span className={`rr-project-avatar rr-project-avatar-${index % 4}`}>
                        {project.vehicle
                          .split(' ')
                          .slice(0, 2)
                          .map((word) => word[0])
                          .join('')}
                      </span>
                      <span className="rr-project-info">
                        <span className="rr-project-title">
                          <strong>{project.vehicle}</strong>
                          <Status status={project.status} />
                        </span>
                        <span className="rr-project-subtitle">
                          {project.reference} <i>·</i> {project.title}
                        </span>
                        <span className="rr-project-progress">
                          <span>
                            <i style={{ width: `${progress}%` }} />
                          </span>
                          <small>{progress}%</small>
                        </span>
                      </span>
                      <span className="rr-project-meta">
                        <strong>{money(quoteTotal(project.lines))}</strong>
                        <small>{costs.hours} h registradas</small>
                      </span>
                      <ArrowRight className="rr-project-arrow" size={16} />
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="rr-empty">No hay proyectos en taller.</p>
            )}
          </Section>

          <Section title="Operativa">
            <div className="rr-dash-overview">
              <button onClick={() => navigate('planificacion')}>
                <span className="rr-overview-icon rr-overview-blue">
                  <CalendarDays size={17} />
                </span>
                <span>
                  <strong>Planificación</strong>
                  <small>
                    {openTasks.length
                      ? `${openTasks.length} tareas por completar`
                      : 'Sin tareas pendientes'}
                  </small>
                </span>
                <b>{openTasks.length}</b>
                <ArrowRight size={14} />
              </button>
              <button onClick={() => navigate('inventario')}>
                <span className="rr-overview-icon rr-overview-violet">
                  <Wrench size={17} />
                </span>
                <span>
                  <strong>Inventario</strong>
                  <small>
                    {lowStock.length
                      ? `${lowStock.length} referencias bajo mínimo`
                      : 'Stock disponible'}
                  </small>
                </span>
                <b>{lowStock.length}</b>
                <ArrowRight size={14} />
              </button>
              <button onClick={() => navigate('compras')}>
                <span className="rr-overview-icon rr-overview-orange">
                  <ArrowUpRight size={17} />
                </span>
                <span>
                  <strong>Pedidos en camino</strong>
                  <small>
                    {pending.length ? 'Pendientes de recepción' : 'Sin recepciones pendientes'}
                  </small>
                </span>
                <b>{pending.length}</b>
                <ArrowRight size={14} />
              </button>
            </div>
          </Section>
        </div>

        <aside className="rr-dash-side-column">
          <Section
            title="Para hoy"
            action={<span className="rr-attention-count">{attentionCount}</span>}
          >
            <div className="rr-dash-tasks">
              {budgets.slice(0, 2).map((project) => (
                <button key={project.id} onClick={() => navigate('presupuestos')}>
                  <span className="rr-task-check rr-task-amber">
                    <Clock3 size={14} />
                  </span>
                  <span>
                    <strong>Revisar presupuesto</strong>
                    <small>
                      {project.vehicle} · {project.reference}
                    </small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
              {lowStock.slice(0, 2).map((product) => (
                <button key={product.id} onClick={() => navigate('inventario')}>
                  <span className="rr-task-check rr-task-red">
                    <CircleAlert size={14} />
                  </span>
                  <span>
                    <strong>Reponer {product.name}</strong>
                    <small>
                      {product.stock} uds. disponibles · mínimo {product.minimum}
                    </small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
              {pending.slice(0, 1).map((purchase) => (
                <button key={purchase.id} onClick={() => navigate('compras')}>
                  <span className="rr-task-check rr-task-blue">
                    <Clock3 size={14} />
                  </span>
                  <span>
                    <strong>Recibir pedido {purchase.reference}</strong>
                    <small>Comprueba las cantidades al recibir</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
              {openTasks.slice(0, 2).map((task) => {
                const project = state.projects.find((item) => item.id === task.projectId)
                return (
                  <button key={task.id} onClick={() => navigate('planificacion')}>
                    <span className="rr-task-check">
                      <Check size={14} />
                    </span>
                    <span>
                      <strong>{task.description}</strong>
                      <small>
                        {task.worker}
                        {project ? ` · ${project.reference}` : ''}
                      </small>
                    </span>
                    <ArrowRight size={14} />
                  </button>
                )
              })}
              {incidents.slice(0, 1).map((incident) => (
                <button key={incident.id} onClick={() => navigate('incidencias')}>
                  <span className="rr-task-check rr-task-red">
                    <CircleAlert size={14} />
                  </span>
                  <span>
                    <strong>Incidencia abierta</strong>
                    <small>{incident.description}</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
              {!attentionCount && (
                <div className="rr-all-clear">
                  <span>
                    <Check size={17} />
                  </span>
                  <strong>Todo al día</strong>
                  <small>No hay asuntos pendientes por ahora.</small>
                </div>
              )}
            </div>
            <button className="rr-dash-footer-link" onClick={() => navigate('actividad')}>
              Ver toda la actividad <ArrowRight size={14} />
            </button>
          </Section>
        </aside>
      </div>
    </div>
  )
}
