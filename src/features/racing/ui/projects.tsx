import { Button } from '@doscientos/ui'
import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'

import type { LineKind, Project, Workshop } from '../domain/model'
import {
  addProject,
  addQuoteLine,
  addTask,
  approveProject,
  finishProject,
  projectCosts,
  quoteTotal,
  removeQuoteLine,
  updateQuoteLine,
} from '../domain/workshop'
import { ProjectList } from './project-list'
import {
  Badge,
  Empty,
  Field,
  FormDialog,
  Section,
  Status,
  eurosToCents,
  formText,
  money,
  uid,
  type Change,
} from './shared'

export function ProjectsPage({
  state,
  change,
  selected,
  select,
  budgetsOnly = false,
}: {
  state: Workshop
  change: Change
  selected: string
  select: (id: string) => void
  budgetsOnly?: boolean
}) {
  const [creating, setCreating] = useState(false)
  const project = state.projects.find((item) => item.id === selected)
  const create = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const id = uid()
    const project: Project = {
      id,
      reference: `RR-${String(Date.now()).slice(-6)}`,
      client: formText(data, 'client').trim(),
      vehicle: formText(data, 'vehicle').trim(),
      plate: formText(data, 'plate').trim(),
      title: formText(data, 'title').trim(),
      responsible: formText(data, 'responsible').trim(),
      status: 'presupuesto',
      lines: [],
    }
    if (change((current) => addProject(current, project))) {
      select(id)
      setCreating(false)
    }
  }
  return (
    <div className="rr-stack">
      <div className="rr-project-list-page" hidden={Boolean(selected)}>
        <div className="rr-heading">
          <div>
            <h1>{budgetsOnly ? 'Presupuestos' : 'Proyectos de taller'}</h1>
          </div>
          <Button aria-haspopup="dialog" aria-expanded={creating} onClick={() => setCreating(true)}>
            + Nuevo proyecto
          </Button>
        </div>
        <FormDialog open={creating} onOpenChange={setCreating} title="Nuevo proyecto">
          <form className="rr-form-grid" onSubmit={create}>
            <Field label="Cliente">
              <input name="client" required placeholder="Nombre del cliente" />
            </Field>
            <Field label="Vehículo">
              <input name="vehicle" required placeholder="Marca y modelo" />
            </Field>
            <Field label="Matrícula o referencia">
              <input name="plate" required placeholder="Matrícula o referencia interna" />
            </Field>
            <Field label="Trabajo">
              <input name="title" required placeholder="Preparación, revisión…" />
            </Field>
            <Field label="Responsable (opcional)">
              <input name="responsible" placeholder="Operario responsable" />
            </Field>
            <Button type="submit">Crear proyecto</Button>
          </form>
        </FormDialog>
        <ProjectList projects={state.projects} onOpen={select} budgetsOnly={budgetsOnly} />
      </div>
      {selected && (
        <div className="rr-stack">
          <div className="rr-project-detail-heading">
            <button type="button" className="rr-project-back" onClick={() => select('')}>
              <ArrowLeft size={16} aria-hidden="true" />{' '}
              {budgetsOnly ? 'Presupuestos' : 'Proyectos'}
            </button>
            {project && (
              <div className="rr-heading">
                <h1>{project.vehicle}</h1>
                <Status status={project.status} />
              </div>
            )}
          </div>
          {project ? (
            <ProjectDetail key={project.id} project={project} state={state} change={change} />
          ) : (
            <Section title="Proyecto no encontrado">
              <Empty>El proyecto no está disponible.</Empty>
            </Section>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectDetail({
  project,
  state,
  change,
}: {
  project: Project
  state: Workshop
  change: Change
}) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [kind, setKind] = useState<LineKind>('pieza')
  const editedLine = project.lines.find((line) => line.id === editing)
  const costs = projectCosts(state.parts, project.id)
  const parts = state.parts.filter((item) => item.projectId === project.id)
  const invoices = state.invoices.filter((item) => item.projectId === project.id)
  const addLine = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const line = {
      id: editing ?? uid(),
      kind,
      description: formText(data, 'description').trim(),
      supplier: formText(data, 'supplier').trim(),
      quantity: Number(data.get('quantity')),
      price: eurosToCents(formText(data, 'price')),
    }
    if (
      change((current) =>
        editing
          ? updateQuoteLine(current, project.id, line)
          : addQuoteLine(current, project.id, line),
      )
    ) {
      setAdding(false)
      setEditing(null)
    }
  }
  return (
    <div className="rr-stack">
      <Section
        title={project.title}
        subtitle={`${project.reference} · ${project.client} · ${project.vehicle} · ${project.plate}${project.responsible ? ` · Responsable: ${project.responsible}` : ''}`}
        action={<Status status={project.status} />}
      >
        <div className="rr-metrics rr-metrics-small">
          <div>
            <span>Presupuestado</span>
            <strong>{money(quoteTotal(project.lines))}</strong>
            <small>sin IVA</small>
          </div>
          <div>
            <span>Coste registrado</span>
            <strong>{money(costs.labor + costs.materials + costs.expenses)}</strong>
            <small>{costs.hours} h imputadas</small>
          </div>
          <div>
            <span>En borradores</span>
            <strong>
              {money(invoices.reduce((sum, invoice) => sum + quoteTotal(invoice.lines), 0))}
            </strong>
            <small>no son facturas fiscales</small>
          </div>
        </div>
        <div className="rr-section-line">
          <div>
            <h3>Presupuesto</h3>
            <p>Piezas y mano de obra · importes sin IVA</p>
          </div>
          {project.status === 'presupuesto' && (
            <Button
              variant="outline"
              aria-haspopup="dialog"
              aria-expanded={adding}
              onClick={() => {
                setAdding(true)
                setEditing(null)
                setKind('pieza')
              }}
            >
              + Añadir partida
            </Button>
          )}
        </div>
        {project.lines.length ? (
          <div className="rr-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Proveedor</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Importe</th>
                  {project.status === 'presupuesto' && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {project.lines.map((line) => (
                  <tr key={line.id}>
                    <td>
                      <strong>{line.description}</strong>
                      <small>{line.kind}</small>
                    </td>
                    <td>{line.supplier || '—'}</td>
                    <td>{line.quantity}</td>
                    <td>{money(line.price)}</td>
                    <td>{money(line.price * line.quantity)}</td>
                    {project.status === 'presupuesto' && (
                      <td>
                        <Button
                          variant="link"
                          size="sm"
                          aria-haspopup="dialog"
                          onClick={() => {
                            setEditing(line.id)
                            setKind(line.kind)
                            setAdding(true)
                          }}
                        >
                          Editar
                        </Button>{' '}
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => {
                            if (window.confirm('¿Eliminar esta partida?'))
                              change((current) => removeQuoteLine(current, project.id, line.id))
                          }}
                        >
                          Eliminar
                        </Button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>Añade piezas o mano de obra al presupuesto.</Empty>
        )}
        <FormDialog
          open={adding}
          onOpenChange={setAdding}
          title={editing ? 'Editar partida' : 'Añadir partida'}
        >
          <form key={editing ?? 'new'} className="rr-form-grid" onSubmit={addLine}>
            <Field label="Tipo">
              <select value={kind} onChange={(event) => setKind(event.target.value as LineKind)}>
                <option value="pieza">Pieza</option>
                <option value="mano de obra">Mano de obra</option>
              </select>
            </Field>
            <Field label="Concepto">
              <input name="description" defaultValue={editedLine?.description ?? ''} required />
            </Field>
            <Field label="Proveedor">
              <input
                name="supplier"
                defaultValue={editedLine?.supplier ?? ''}
                placeholder="Opcional"
              />
            </Field>
            <Field label="Cantidad">
              <input
                name="quantity"
                type="number"
                min="0.01"
                step="0.01"
                defaultValue={editedLine?.quantity ?? 1}
                required
              />
            </Field>
            <Field label="Precio unitario (€)">
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editedLine ? editedLine.price / 100 : ''}
                required
              />
            </Field>
            <Button type="submit">Guardar partida</Button>
          </form>
        </FormDialog>
        <div className="rr-actions">
          {project.status === 'presupuesto' && (
            <Button onClick={() => change((current) => approveProject(current, project.id))}>
              Aprobar y pasar a taller
            </Button>
          )}
          {project.status === 'en taller' && (
            <Button
              variant="outline"
              onClick={() => change((current) => finishProject(current, project.id))}
            >
              Marcar trabajo terminado
            </Button>
          )}
          <span className="rr-hint">La aprobación se registra aquí; no se envía al cliente.</span>
        </div>
      </Section>
      <ProjectTasks project={project} state={state} change={change} />
      <Section
        title="Actividad del taller"
        subtitle="Horas, piezas y gastos imputados a este proyecto."
      >
        {parts.length ? (
          <div className="rr-list">
            {parts.map((part) => (
              <div className="rr-list-row" key={part.id}>
                <div>
                  <strong>{part.description}</strong>
                  <p>
                    {part.worker} · {part.date} · {part.hours} h
                  </p>
                </div>
                <Badge>
                  {money(
                    Math.round(part.hours * part.hourlyCost) + part.materialCost + part.expense,
                  )}{' '}
                  coste
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <Empty>Todavía no hay partes registrados.</Empty>
        )}
      </Section>
    </div>
  )
}

function ProjectTasks({
  project,
  state,
  change,
}: {
  project: Project
  state: Workshop
  change: Change
}) {
  const [adding, setAdding] = useState(false)
  const tasks = state.tasks.filter((task) => task.projectId === project.id)
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const description = formText(data, 'task').trim()
    const worker = formText(data, 'worker').trim()
    const date = formText(data, 'date')
    if (
      change((current) =>
        addTask(current, {
          id: uid(),
          projectId: project.id,
          description,
          worker,
          date,
          done: false,
        }),
      )
    ) {
      form.reset()
      setAdding(false)
    }
  }
  return (
    <Section
      title="Tareas del proyecto"
      action={
        <Button
          variant="outline"
          aria-haspopup="dialog"
          aria-expanded={adding}
          onClick={() => setAdding(true)}
        >
          + Añadir tarea
        </Button>
      }
    >
      {tasks.length ? (
        <div className="rr-list">
          {tasks.map((task) => (
            <label className="rr-list-row" key={task.id}>
              <span>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={(event) =>
                    change((current) => ({
                      ...current,
                      tasks: current.tasks.map((item) =>
                        item.id === task.id ? { ...item, done: event.target.checked } : item,
                      ),
                    }))
                  }
                />{' '}
                <strong>{task.description}</strong>
                <p>
                  {task.worker}
                  {task.date ? ` · ${task.date}` : ' · Sin fecha'}
                </p>
              </span>
              <Badge tone={task.done ? 'green' : 'amber'}>
                {task.done ? 'Completada' : 'Pendiente'}
              </Badge>
            </label>
          ))}
        </div>
      ) : (
        <Empty>No hay tareas asignadas.</Empty>
      )}
      <FormDialog open={adding} onOpenChange={setAdding} title="Añadir tarea">
        <form className="rr-form-grid" onSubmit={save}>
          <Field label="Tarea">
            <input name="task" required />
          </Field>
          <Field label="Responsable">
            <input name="worker" required defaultValue={project.responsible ?? ''} />
          </Field>
          <Field label="Fecha (opcional)">
            <input name="date" type="date" />
          </Field>
          <Button type="submit">Añadir tarea</Button>
        </form>
      </FormDialog>
    </Section>
  )
}
