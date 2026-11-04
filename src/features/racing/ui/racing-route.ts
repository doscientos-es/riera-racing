import type { Page } from './dashboard'

export type RacingRoute = { page: Page; projectId: string }

export function readRacingRoute(pathname: string, pages: readonly Page[]): RacingRoute {
  const parts = pathname.split('/').filter(Boolean)
  const page = pages.find((item) => item === parts[0]) ?? 'inicio'
  if (parts.length > 2 || (parts[1] && page !== 'proyectos' && page !== 'presupuestos'))
    return { page: 'inicio', projectId: '' }
  try {
    return { page, projectId: parts[1] ? decodeURIComponent(parts[1]) : '' }
  } catch {
    return { page, projectId: '' }
  }
}

export function racingPath(page: Page, projectId = ''): string {
  const base = page === 'inicio' ? '/' : `/${page}`
  return projectId && (page === 'proyectos' || page === 'presupuestos')
    ? `${base}/${encodeURIComponent(projectId)}`
    : base
}
