import type { Project, ProjectStatus } from '../domain/model'

export type ProjectFilter = 'todos' | ProjectStatus

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
}

export function filterProjects(
  projects: Project[],
  query: string,
  status: ProjectFilter,
): Project[] {
  const terms = normalize(query.trim()).split(/\s+/).filter(Boolean)
  return projects.filter((project) => {
    if (status !== 'todos' && project.status !== status) return false
    const searchable = normalize(
      [
        project.reference,
        project.client,
        project.vehicle,
        project.plate,
        project.title,
        project.responsible ?? '',
      ].join(' '),
    )
    return terms.every((term) => searchable.includes(term))
  })
}

export function paginateProjects(projects: Project[], requestedPage: number, pageSize: number) {
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 1
  const pages = Math.max(1, Math.ceil(projects.length / size))
  const page = Number.isFinite(requestedPage)
    ? Math.max(1, Math.min(Math.floor(requestedPage), pages))
    : 1
  const start = (page - 1) * size
  return {
    items: projects.slice(start, start + size),
    page,
    pages,
    start: projects.length ? start + 1 : 0,
    end: Math.min(start + size, projects.length),
  }
}
