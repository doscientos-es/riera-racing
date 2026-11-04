import { Button } from '@doscientos/ui'
import { ArrowLeft } from 'lucide-react'

import type { Workshop } from '../domain/model'
import type { Page } from './dashboard'
import { ProjectList } from './project-list'
import { Badge, Empty, Section, Status } from './shared'

export function WorkerDashboard({
  state,
  name,
  navigate,
}: {
  state: Workshop
  name: string
  navigate: (page: Page) => void
}) {
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <h1>Hola, {name}</h1>
      </div>
      <div className="rr-metrics rr-dashboard-metrics">
        <div>
          <span>Proyectos asignados</span>
          <strong>{state.projects.length}</strong>
        </div>
        <div>
          <span>Tareas pendientes</span>
          <strong>{state.tasks.filter((task) => !task.done).length}</strong>
        </div>
        <div>
          <span>Mis partes</span>
          <strong>{state.parts.length}</strong>
        </div>
        <div>
          <span>Incidencias abiertas</span>
          <strong>{state.incidents.filter((incident) => !incident.resolved).length}</strong>
        </div>
      </div>
      <Section
        title="Mis tareas"
        action={
          <Button variant="outline" size="sm" onClick={() => navigate('planificacion')}>
            Ver tareas
          </Button>
        }
      >
        {state.tasks.filter((task) => !task.done).length ? (
          <div className="rr-list">
            {state.tasks
              .filter((task) => !task.done)
              .map((task) => (
                <div className="rr-list-row" key={task.id}>
                  <div>
                    <strong>{task.description}</strong>
                    <p>
                      {state.projects.find((project) => project.id === task.projectId)?.vehicle}
                    </p>
                  </div>
                  <Badge tone="amber">Pendiente</Badge>
                </div>
              ))}
          </div>
        ) : (
          <Empty>No tienes tareas pendientes.</Empty>
        )}
      </Section>
    </div>
  )
}

export function WorkerProjects({
  state,
  selected,
  select,
}: {
  state: Workshop
  selected: string
  select: (id: string) => void
}) {
  const project = state.projects.find((item) => item.id === selected)
  const tasks = state.tasks.filter((task) => task.projectId === selected)
  const incidents = state.incidents.filter((incident) => incident.projectId === selected)
  return (
    <div className="rr-stack">
      <div className="rr-project-list-page" hidden={Boolean(selected)}>
        <div className="rr-heading">
          <h1>Mis proyectos</h1>
        </div>
        <ProjectList projects={state.projects} onOpen={select} worker />
      </div>
      {selected && (
        <div className="rr-stack">
          <div className="rr-project-detail-heading">
            <button type="button" className="rr-project-back" onClick={() => select('')}>
              <ArrowLeft size={16} aria-hidden="true" /> Mis proyectos
            </button>
            {project && (
              <div className="rr-heading">
                <h1>{project.vehicle}</h1>
                <Status status={project.status} />
              </div>
            )}
          </div>
          {project ? (
            <>
              <Section title={project.title} subtitle={`${project.reference} · ${project.plate}`}>
                <div className="rr-project-detail-info">
                  <span>Responsable</span>
                  <strong>{project.responsible || 'Sin asignar'}</strong>
                </div>
              </Section>
              <Section title="Mis tareas">
                {tasks.length ? (
                  <div className="rr-list">
                    {tasks.map((task) => (
                      <div className="rr-list-row" key={task.id}>
                        <strong>{task.description}</strong>
                        <Badge tone={task.done ? 'green' : 'amber'}>
                          {task.done ? 'Completada' : 'Pendiente'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty>No tienes tareas asignadas en este proyecto.</Empty>
                )}
              </Section>
              <Section title="Incidencias">
                {incidents.length ? (
                  <div className="rr-list">
                    {incidents.map((incident) => (
                      <div className="rr-list-row" key={incident.id}>
                        <div>
                          <strong>{incident.description}</strong>
                          <p>{incident.date}</p>
                        </div>
                        <Badge tone={incident.resolved ? 'green' : 'amber'}>
                          {incident.resolved ? 'Resuelta' : 'Abierta'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty>No hay incidencias registradas.</Empty>
                )}
              </Section>
            </>
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
