import type { Workshop } from '../domain/model'

export function localDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateFromKey(key: string): Date {
  return new Date(`${key}T12:00:00`)
}

export function shiftDate(key: string, days: number): string {
  const date = dateFromKey(key)
  date.setDate(date.getDate() + days)
  return localDate(date)
}

export function weekStart(key: string): string {
  const weekday = dateFromKey(key).getDay()
  return shiftDate(key, -((weekday + 6) % 7))
}

export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, index) => shiftDate(start, index))
}

export function planningWorkers(state: Workshop, worker?: string): string[] {
  if (worker) return [worker]
  return [
    ...new Set(
      [
        ...state.projects.map((project) => project.responsible?.trim() ?? ''),
        ...state.tasks.map((task) => task.worker.trim()),
        ...state.absences.map((absence) => absence.worker.trim()),
      ].filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, 'es'))
}

export function tasksOn(state: Workshop, worker: string, date: string) {
  return state.tasks.filter((task) => task.worker.trim() === worker && task.date === date)
}

export function absentOn(state: Workshop, worker: string, date: string): boolean {
  return state.absences.some(
    (absence) => absence.worker.trim() === worker && absence.from <= date && date <= absence.to,
  )
}
