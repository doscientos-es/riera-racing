import { Button } from '@doscientos/ui'
import { useState, type FormEvent } from 'react'

import { localDate } from '../application/planning-calendar'
import { addWorkerIncident, setWorkerIncidentResolved } from '../application/worker-access'
import type { Workshop } from '../domain/model'
import { addIncident, addTask } from '../domain/workshop'
import { PlanningCalendar } from './planning-calendar'
import {
  Badge,
  Empty,
  Field,
  FormDialog,
  ProjectSelect,
  Section,
  formText,
  today,
  uid,
  type Change,
} from './shared'

export function PlanningPage({
  state,
  change,
  worker,
}: {
  state: Workshop
  change: Change
  worker?: string | undefined
}) {
  const [adding, setAdding] = useState(false)
  const [projectId, setProjectId] = useState('')
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (
      change((current) =>
        addTask(current, {
          id: uid(),
          projectId,
          description: formText(data, 'description').trim(),
          worker: formText(data, 'worker').trim(),
          date: formText(data, 'date'),
          done: false,
        }),
      )
    ) {
      form.reset()
      setProjectId('')
      setAdding(false)
    }
  }
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <h1>{worker ? 'Mis tareas' : 'Planificación'}</h1>
        </div>
        {!worker && (
          <Button aria-haspopup="dialog" aria-expanded={adding} onClick={() => setAdding(true)}>
            + Asignar tarea
          </Button>
        )}
      </div>
      <FormDialog
        open={adding}
        onOpenChange={(open) => {
          setAdding(open)
          if (!open) setProjectId('')
        }}
        title="Asignar tarea"
        description="Las tareas también aparecen en el detalle del proyecto."
      >
        <form className="rr-form-grid" onSubmit={save}>
          <Field label="Proyecto">
            <ProjectSelect projects={state.projects} value={projectId} onChange={setProjectId} />
          </Field>
          <Field label="Tarea">
            <input name="description" required />
          </Field>
          <Field label="Responsable">
            <input name="worker" required />
          </Field>
          <Field label="Fecha">
            <input name="date" type="date" defaultValue={localDate(new Date())} required />
          </Field>
          <Button type="submit">Añadir tarea</Button>
        </form>
      </FormDialog>
      <PlanningCalendar state={state} change={change} worker={worker} />
    </div>
  )
}

export function IncidentsPage({
  state,
  change,
  worker,
}: {
  state: Workshop
  change: Change
  worker?: string | undefined
}) {
  const [adding, setAdding] = useState(false)
  const [projectId, setProjectId] = useState('')
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    if (
      change((current) => {
        const incident = {
          id: uid(),
          projectId,
          date: formText(data, 'date'),
          description: formText(data, 'description').trim(),
          resolved: false,
        }
        return worker
          ? addWorkerIncident(current, worker, incident)
          : addIncident(current, incident)
      })
    ) {
      form.reset()
      setProjectId('')
      setAdding(false)
    }
  }
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <h1>Incidencias</h1>
        </div>
        <Button aria-haspopup="dialog" aria-expanded={adding} onClick={() => setAdding(true)}>
          + Registrar incidencia
        </Button>
      </div>
      <FormDialog
        open={adding}
        onOpenChange={(open) => {
          setAdding(open)
          if (!open) setProjectId('')
        }}
        title="Registrar incidencia"
      >
        <form className="rr-form-grid" onSubmit={save}>
          <Field label="Proyecto">
            <ProjectSelect projects={state.projects} value={projectId} onChange={setProjectId} />
          </Field>
          <Field label="Fecha">
            <input type="date" name="date" defaultValue={today()} required />
          </Field>
          <Field label="Descripción">
            <input name="description" required />
          </Field>
          <Button type="submit">Guardar incidencia</Button>
        </form>
      </FormDialog>
      <Section title="Incidencias registradas">
        {state.incidents.length ? (
          <div className="rr-list">
            {state.incidents.map((incident) => {
              const project = state.projects.find((item) => item.id === incident.projectId)
              return (
                <div className="rr-list-row" key={incident.id}>
                  <div>
                    <strong>{incident.description}</strong>
                    <p>
                      {project?.reference} · {project?.vehicle} · {incident.date}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      change((current) =>
                        worker
                          ? setWorkerIncidentResolved(
                              current,
                              worker,
                              incident.id,
                              !incident.resolved,
                            )
                          : {
                              ...current,
                              incidents: current.incidents.map((item) =>
                                item.id === incident.id
                                  ? { ...item, resolved: !item.resolved }
                                  : item,
                              ),
                            },
                      )
                    }
                  >
                    {incident.resolved ? 'Reabrir' : 'Resolver'}
                  </Button>
                  <Badge tone={incident.resolved ? 'green' : 'amber'}>
                    {incident.resolved ? 'Resuelta' : 'Abierta'}
                  </Badge>
                </div>
              )
            })}
          </div>
        ) : (
          <Empty>No hay incidencias registradas.</Empty>
        )}
      </Section>
    </div>
  )
}
