import { Pagination } from '@doscientos/ui'
import { ArrowUpRight, Search } from 'lucide-react'
import { useState } from 'react'

import { filterProjects, paginateProjects, type ProjectFilter } from '../application/project-list'
import type { Project } from '../domain/model'
import { quoteTotal } from '../domain/workshop'
import { Status, money } from './shared'

const filters: { value: ProjectFilter; label: string }[] = [
  { value: 'todos', label: 'Todos' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'en taller', label: 'En taller' },
  { value: 'terminado', label: 'Terminados' },
]

export function ProjectList({
  projects,
  onOpen,
  budgetsOnly = false,
  worker = false,
}: {
  projects: Project[]
  onOpen: (id: string) => void
  budgetsOnly?: boolean
  worker?: boolean
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectFilter>(budgetsOnly ? 'presupuesto' : 'todos')
  const [requestedPage, setPage] = useState(1)
  const filtered = filterProjects(projects, query, status)
  const { items, page, pages, start, end } = paginateProjects(filtered, requestedPage, 10)
  const title = worker ? 'Mis proyectos' : budgetsOnly ? 'Presupuestos' : 'Proyectos'

  return (
    <div className="rr-projects-list">
      <div className="rr-project-filters">
        <fieldset className="rr-project-filter-tabs" aria-label="Filtrar por estado">
          {filters.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={status === filter.value ? 'is-active' : ''}
              aria-pressed={status === filter.value}
              onClick={() => {
                setStatus(filter.value)
                setPage(1)
              }}
            >
              {filter.label}{' '}
              <span>
                {filter.value === 'todos'
                  ? projects.length
                  : projects.filter((project) => project.status === filter.value).length}
              </span>
            </button>
          ))}
        </fieldset>
        <label className="rr-project-search">
          <Search size={17} aria-hidden="true" />
          <span className="sr-only">Buscar proyectos</span>
          <input
            type="search"
            placeholder="Buscar vehículo, matrícula o cliente…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
          />
        </label>
      </div>
      <section className="rr-project-table-card" aria-labelledby="rr-project-list-title">
        <div className="rr-project-table-heading">
          <h2 id="rr-project-list-title">
            {title} <span>{filtered.length}</span>
          </h2>
          <span>{filtered.length === 1 ? '1 resultado' : `${filtered.length} resultados`}</span>
        </div>
        {items.length ? (
          <div className="rr-table-wrap rr-project-table-wrap">
            <table aria-label={title} className="rr-project-table">
              <thead>
                <tr>
                  <th scope="col">Vehículo y trabajo</th>
                  <th scope="col" className="rr-project-secondary">
                    Cliente
                  </th>
                  <th scope="col" className="rr-project-secondary">
                    Responsable
                  </th>
                  <th scope="col" className="rr-project-secondary">
                    Estado
                  </th>
                  {!worker && (
                    <th scope="col" className="rr-project-secondary rr-project-amount">
                      Presupuesto
                    </th>
                  )}
                  <th scope="col">
                    <span className="sr-only">Abrir proyecto</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((project) => (
                  <tr key={project.id} onClick={() => onOpen(project.id)}>
                    <td>
                      <button
                        className="rr-project-open"
                        type="button"
                        aria-label={`Abrir ${project.reference}, ${project.vehicle}`}
                        onClick={(event) => {
                          event.stopPropagation()
                          onOpen(project.id)
                        }}
                      >
                        <strong>{project.vehicle}</strong>
                        <span>
                          {project.reference} · {project.plate} · {project.title}
                        </span>
                        <span className="rr-project-mobile-status">
                          <Status status={project.status} />
                        </span>
                      </button>
                    </td>
                    <td className="rr-project-secondary">{project.client}</td>
                    <td className="rr-project-secondary">{project.responsible || '—'}</td>
                    <td className="rr-project-secondary">
                      <Status status={project.status} />
                    </td>
                    {!worker && (
                      <td className="rr-project-secondary rr-project-amount">
                        <strong>{money(quoteTotal(project.lines))}</strong>
                      </td>
                    )}
                    <td className="rr-project-arrow-cell">
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rr-project-empty">
            {projects.length
              ? 'No hay proyectos que coincidan con los filtros.'
              : 'No hay proyectos registrados.'}
          </div>
        )}
        <div className="rr-project-pagination">
          {pages > 1 ? (
            <Pagination
              page={page}
              pageCount={pages}
              onPageChange={setPage}
              ariaLabel={`Páginas de ${title}`}
              summary={`${start}–${end} de ${filtered.length}`}
            />
          ) : (
            <span>{`${start}–${end} de ${filtered.length}`}</span>
          )}
        </div>
      </section>
    </div>
  )
}
