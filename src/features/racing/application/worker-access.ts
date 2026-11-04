import type { Absence, Incident, Part, Workshop } from '../domain/model'
import { addAbsence, addIncident, addPart } from '../domain/workshop'
import type { AssistantPrincipal } from './assistant-access'

const workerPages = new Set(['inicio', 'proyectos', 'planificacion', 'incidencias', 'taller', 'equipo'])

export function canVisitPage(principal: AssistantPrincipal, page: string): boolean {
  return principal.role === 'admin' || workerPages.has(page)
}

export function isWorkerAssigned(state: Workshop, name: string, projectId: string): boolean {
  const project = state.projects.find((item) => item.id === projectId)
  return Boolean(project && (project.responsible === name || state.tasks.some(
    (task) => task.projectId === projectId && task.worker === name,
  )))
}

export function workerWorkshop(state: Workshop, name: string): Workshop {
  const projects = state.projects.filter((project) => isWorkerAssigned(state, name, project.id))
  const ids = new Set(projects.map((project) => project.id))
  return {
    ...state,
    projects: projects.map((project) => ({ ...project, lines: [] })),
    tasks: state.tasks.filter((task) => task.worker === name && ids.has(task.projectId)),
    parts: state.parts.filter((part) => part.worker === name && ids.has(part.projectId)),
    absences: state.absences.filter((absence) => absence.worker === name),
    incidents: state.incidents.filter((incident) => ids.has(incident.projectId)),
    purchases: [], invoices: [], activity: [],
  }
}

function requireAssignment(state: Workshop, name: string, projectId: string) {
  if (!isWorkerAssigned(state, name, projectId))
    throw new Error('Solo puedes trabajar en proyectos asignados.')
}

export function setWorkerTaskDone(state: Workshop, name: string, taskId: string, done: boolean): Workshop {
  const task = state.tasks.find((item) => item.id === taskId)
  if (!task || task.worker !== name) throw new Error('Solo puedes modificar tus tareas asignadas.')
  requireAssignment(state, name, task.projectId)
  return { ...state, tasks: state.tasks.map((item) => item.id === taskId ? { ...item, done } : item) }
}

export function addWorkerPart(state: Workshop, name: string, part: Omit<Part, 'materialCost' | 'worker'>): Workshop {
  requireAssignment(state, name, part.projectId)
  return addPart(state, { ...part, worker: name })
}

export function addWorkerAbsence(state: Workshop, name: string, absence: Omit<Absence, 'worker'>): Workshop {
  return addAbsence(state, { ...absence, worker: name })
}

export function addWorkerIncident(state: Workshop, name: string, incident: Incident): Workshop {
  requireAssignment(state, name, incident.projectId)
  return addIncident(state, incident)
}

export function setWorkerIncidentResolved(state: Workshop, name: string, id: string, resolved: boolean): Workshop {
  const incident = state.incidents.find((item) => item.id === id)
  if (!incident) throw new Error('No se ha encontrado la incidencia.')
  requireAssignment(state, name, incident.projectId)
  return { ...state, incidents: state.incidents.map((item) => item.id === id ? { ...item, resolved } : item) }
}