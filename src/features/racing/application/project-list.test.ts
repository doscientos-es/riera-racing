import { describe, expect, it } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import { filterProjects, paginateProjects } from './project-list'

describe('listado de proyectos', () => {
  const projects = seedWorkshop().projects

  it('combina términos sin distinguir acentos o mayúsculas con el estado', () => {
    expect(filterProjects(projects, '  ALEX   bmw ', 'en taller').map((item) => item.id)).toEqual([
      'p1',
    ])
    expect(filterProjects(projects, 'bmw', 'terminado')).toEqual([])
    expect(filterProjects(projects, 'GI-7392', 'todos').map((item) => item.id)).toEqual(['p2'])
  })

  it('pagina y ajusta la página cuando se reducen los resultados', () => {
    const project = projects[0]
    if (!project) throw new Error('Falta el proyecto de prueba')
    const many = Array.from({ length: 23 }, (_, index) => ({ ...project, id: String(index) }))
    expect(paginateProjects(many, 2, 10)).toMatchObject({ page: 2, pages: 3, start: 11, end: 20 })
    expect(paginateProjects(many, 9, 10)).toMatchObject({ page: 3, pages: 3, start: 21, end: 23 })
    expect(paginateProjects([], 3, 10)).toMatchObject({
      items: [],
      page: 1,
      pages: 1,
      start: 0,
      end: 0,
    })
  })
})
