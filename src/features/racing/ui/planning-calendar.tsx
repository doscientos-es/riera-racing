import { CalendarDays, ChevronLeft, ChevronRight, UsersRound } from 'lucide-react'
import { useState } from 'react'

import {
  absentOn,
  dateFromKey,
  localDate,
  planningWorkers,
  shiftDate,
  tasksOn,
  weekDays,
  weekStart,
} from '../application/planning-calendar'
import { setWorkerTaskDone } from '../application/worker-access'
import type { Task, Workshop } from '../domain/model'
import { scheduleTask } from '../domain/workshop'
import type { Change } from './shared'

const dayName = new Intl.DateTimeFormat('es-ES', { weekday: 'short' })
const fullDate = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const rangeDate = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' })

export function PlanningCalendar({
  state,
  change,
  worker,
}: {
  state: Workshop
  change: Change
  worker?: string | undefined
}) {
  const today = localDate(new Date())
  const [start, setStart] = useState(() => weekStart(today))
  const [selectedWorker, setSelectedWorker] = useState('')
  const days = weekDays(start)
  const allWorkers = planningWorkers(state, worker)
  const workers = selectedWorker ? allWorkers.filter((name) => name === selectedWorker) : allWorkers
  const unscheduled = state.tasks.filter(
    (task) => !task.date && workers.includes(task.worker.trim()),
  )
  const scheduled = state.tasks.filter(
    (task) => task.date && days.includes(task.date) && workers.includes(task.worker.trim()),
  )
  const lastDay = days[6] ?? start
  const range = `${rangeDate.format(dateFromKey(start))} – ${rangeDate.format(dateFromKey(lastDay))} ${dateFromKey(lastDay).getFullYear()}`

  const toggle = (task: Task, done: boolean) => {
    change((current) =>
      worker
        ? setWorkerTaskDone(current, worker, task.id, done)
        : {
            ...current,
            tasks: current.tasks.map((item) => (item.id === task.id ? { ...item, done } : item)),
          },
    )
  }
  const schedule = (task: Task, date: string) => {
    if (change((current) => scheduleTask(current, task.id, date)) && date) setStart(weekStart(date))
  }

  return (
    <div className="rr-planning">
      <div className="rr-planning-toolbar">
        <div className="rr-planning-period">
          <div className="rr-planning-period-icon">
            <CalendarDays size={19} aria-hidden="true" />
          </div>
          <div>
            <span>Semana</span>
            <h2>{range}</h2>
          </div>
        </div>
        <div className="rr-planning-controls">
          {!worker && (
            <label className="rr-planning-worker-filter">
              <UsersRound size={16} aria-hidden="true" />
              <span className="sr-only">Filtrar por trabajador</span>
              <select
                value={selectedWorker}
                onChange={(event) => setSelectedWorker(event.target.value)}
              >
                <option value="">Todo el equipo</option>
                {allWorkers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="rr-planning-nav" aria-label="Navegación del calendario">
            <button
              type="button"
              aria-label="Semana anterior"
              onClick={() => setStart(shiftDate(start, -7))}
            >
              <ChevronLeft size={16} />
            </button>
            <button type="button" onClick={() => setStart(weekStart(today))}>
              Hoy
            </button>
            <button
              type="button"
              aria-label="Semana siguiente"
              onClick={() => setStart(shiftDate(start, 7))}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="rr-planning-summary">
        <span>
          {scheduled.length} {scheduled.length === 1 ? 'tarea programada' : 'tareas programadas'}
        </span>
        <span>{unscheduled.length} sin fecha</span>
      </div>
      <p className="rr-calendar-scroll-hint">Desliza para ver todos los días</p>
      {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- The scrollable calendar must be keyboard accessible. */}
      <section
        className="rr-calendar-scroll"
        tabIndex={0}
        aria-label="Calendario semanal, desplazar horizontalmente"
      >
        <table className="rr-calendar" aria-label={`Planificación semanal ${range}`}>
          <thead>
            <tr>
              <th scope="col">{worker ? 'Trabajador' : 'Equipo'}</th>
              {days.map((day) => {
                const date = dateFromKey(day)
                return (
                  <th
                    scope="col"
                    key={day}
                    className={day === today ? 'is-today' : ''}
                    aria-label={fullDate.format(date)}
                  >
                    <span>{dayName.format(date)}</span>
                    <strong>{date.getDate()}</strong>
                    {day === today && <small>Hoy</small>}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {workers.map((name) => (
              <tr key={name}>
                <th scope="row" className="rr-calendar-person">
                  <span className="rr-calendar-avatar">
                    {name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toLocaleUpperCase('es')}
                  </span>
                  <span>
                    <strong>{name}</strong>
                    <small>
                      {
                        state.tasks.filter((task) => task.worker.trim() === name && !task.done)
                          .length
                      }{' '}
                      pendientes
                    </small>
                  </span>
                </th>
                {days.map((day) => (
                  <td key={day} className={day === today ? 'is-today' : ''}>
                    <div className="rr-calendar-cell">
                      {absentOn(state, name, day) && (
                        <div className="rr-calendar-absence">Ausencia</div>
                      )}
                      {tasksOn(state, name, day).map((task) => (
                        <CalendarTask
                          key={task.id}
                          task={task}
                          state={state}
                          worker={worker}
                          toggle={toggle}
                          schedule={schedule}
                        />
                      ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!workers.length && (
          <p className="rr-calendar-empty">No hay trabajadores con tareas o ausencias.</p>
        )}
      </section>
      {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */}
      {unscheduled.length > 0 && (
        <section className="rr-unscheduled" aria-labelledby="rr-unscheduled-title">
          <div className="rr-unscheduled-head">
            <h2 id="rr-unscheduled-title">
              Sin fecha <span>{unscheduled.length}</span>
            </h2>
          </div>
          <div className="rr-unscheduled-list">
            {unscheduled.map((task) => (
              <CalendarTask
                key={task.id}
                task={task}
                state={state}
                worker={worker}
                toggle={toggle}
                schedule={schedule}
                showWorker
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function CalendarTask({
  task,
  state,
  worker,
  toggle,
  schedule,
  showWorker = false,
}: {
  task: Task
  state: Workshop
  worker?: string | undefined
  toggle: (task: Task, done: boolean) => void
  schedule: (task: Task, date: string) => void
  showWorker?: boolean
}) {
  const project = state.projects.find((item) => item.id === task.projectId)
  return (
    <div className={`rr-calendar-task${task.done ? ' is-done' : ''}`}>
      <label className="rr-calendar-task-label">
        <input
          type="checkbox"
          checked={task.done}
          onChange={(event) => toggle(task, event.target.checked)}
        />
        <span>{task.description}</span>
      </label>
      <div className="rr-calendar-task-meta">
        {project ? `${project.reference} · ${project.vehicle}` : 'Proyecto no disponible'}
        {showWorker && !worker ? ` · ${task.worker}` : ''}
      </div>
      {!worker && (
        <label className="rr-calendar-date">
          <span className="sr-only">
            Fecha de {task.description}, {task.worker}
          </span>
          <input
            type="date"
            value={task.date ?? ''}
            onChange={(event) => schedule(task, event.target.value)}
          />
        </label>
      )}
    </div>
  )
}
