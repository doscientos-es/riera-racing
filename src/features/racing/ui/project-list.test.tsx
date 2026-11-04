import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import { ProjectsPage } from './projects'

describe('vista de proyectos', () => {
  const state = seedWorkshop()
  const change = vi.fn(() => true)

  it('muestra un listado completo con búsqueda y filtro por estado', () => {
    const html = renderToStaticMarkup(
      <ProjectsPage state={state} change={change} selected="" select={vi.fn()} />,
    )
    expect(html).toContain('<table')
    expect(html).toContain('Buscar proyectos')
    expect(html).toContain('Filtrar por estado')
    expect(html).toContain('BMW M3 E36')
    expect(html).toContain('Porsche 911 GT3')
    expect(html).not.toContain('Coste registrado')
  })

  it('mantiene oculto el listado al abrir el detalle y muestra un enlace de vuelta', () => {
    const html = renderToStaticMarkup(
      <ProjectsPage state={state} change={change} selected="p1" select={vi.fn()} />,
    )
    expect(html).toContain('class="rr-project-list-page" hidden=""')
    expect(html).toContain('rr-project-back')
    expect(html).toContain('Coste registrado')
  })

  it('muestra los presupuestos primero y pagina listas largas', () => {
    const budgets = renderToStaticMarkup(
      <ProjectsPage state={state} change={change} selected="" select={vi.fn()} budgetsOnly />,
    )
    expect(budgets).toContain('Porsche 911 GT3')
    expect(budgets).not.toContain('BMW M3 E36')

    const project = state.projects[0]
    if (!project) throw new Error('Falta el proyecto de prueba')
    const projects = Array.from({ length: 11 }, (_, index) => ({
      ...project,
      id: String(index),
      vehicle: `Vehículo ${index + 1}`,
    }))
    const html = renderToStaticMarkup(
      <ProjectsPage state={{ ...state, projects }} change={change} selected="" select={vi.fn()} />,
    )
    expect(html).toContain('Vehículo 10')
    expect(html).not.toContain('Vehículo 11')
    expect(html).toContain('Página 2')
  })
})
