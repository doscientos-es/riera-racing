import { Button } from '@doscientos/ui'

import type { Workshop } from '../domain/model'
import type { Page } from './dashboard'
import { Badge, Empty, Section, Status } from './shared'

export function WorkerDashboard({ state, name, navigate }: {
  state: Workshop
  name: string
  navigate: (page: Page) => void
}) {
  return (
    <div className="rr-stack">
      <div className="rr-heading"><h1>Hola, {name}</h1></div>
      <div className="rr-metrics rr-dashboard-metrics">
        <div><span>Proyectos asignados</span><strong>{state.projects.length}</strong></div>
        <div><span>Tareas pendientes</span><strong>{state.tasks.filter((task) => !task.done).length}</strong></div>
        <div><span>Mis partes</span><strong>{state.parts.length}</strong></div>
        <div><span>Incidencias abiertas</span><strong>{state.incidents.filter((incident) => !incident.resolved).length}</strong></div>
      </div>
      <Section title="Mis tareas" action={<Button variant="outline" size="sm" onClick={() => navigate('planificacion')}>Ver tareas</Button>}>
        {state.tasks.filter((task) => !task.done).length ? (
          <div className="rr-list">
            {state.tasks.filter((task) => !task.done).map((task) => (
              <div className="rr-list-row" key={task.id}>
                <div><strong>{task.description}</strong><p>{state.projects.find((project) => project.id === task.projectId)?.vehicle}</p></div>
                <Badge tone="amber">Pendiente</Badge>
              </div>
            ))}
          </div>
        ) : <Empty>No tienes tareas pendientes.</Empty>}
      </Section>
    </div>
  )
}

export function WorkerProjects({ state }: { state: Workshop }) {
  return (
    <div className="rr-stack">
      <div className="rr-heading"><h1>Mis proyectos</h1></div>
      <Section title="Vehículos asignados">
        {state.projects.length ? <div className="rr-list">
          {state.projects.map((project) => (
            <div className="rr-list-row" key={project.id}>
              <div><strong>{project.vehicle}</strong><p>{project.reference} · {project.title} · {project.plate}</p></div>
              <Status status={project.status} />
            </div>
          ))}
        </div> : <Empty>No tienes proyectos asignados.</Empty>}
      </Section>
    </div>
  )
}