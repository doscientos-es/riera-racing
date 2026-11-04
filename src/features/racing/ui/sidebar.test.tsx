import { Gauge, Wrench } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { seedWorkshop } from '../infrastructure/seed'
import { filterNavigation, Sidebar, type NavigationItem } from './sidebar'

const navigation: NavigationItem[] = [
  { id: 'inicio', label: 'Inicio', icon: Gauge, group: 'Operativa' },
  { id: 'planificacion', label: 'Planificación', icon: Wrench, group: 'Operativa' },
]

describe('navegación lateral', () => {
  it('filtra módulos sin distinguir mayúsculas ni tildes y conserva todos con búsqueda vacía', () => {
    expect(filterNavigation(navigation, ' PLANIFICACION ')).toEqual([navigation[1]])
    expect(filterNavigation(navigation, 'xyz')).toEqual([])
    expect(filterNavigation(navigation, ' ')).toEqual(navigation)
  })

  it('muestra la página activa sin el resumen de proyectos terminados', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        state={seedWorkshop()}
        principal={{ role: 'admin' }}
        navigation={navigation}
        page="inicio"
        navigate={vi.fn()}
        reset={vi.fn()}
        changeProfile={vi.fn()}
      />,
    )
    expect(html).toContain('aria-current="page"')
    expect(html).not.toContain('Proyectos terminados')
    expect(html).toContain('Buscar módulos')
    expect(html).toContain('Ver presupuestos')
    expect(html).toContain('Equipo Riera')
    expect(html).toContain('Restablecer datos iniciales')
    expect(html).not.toMatch(/demo|prototipo|datos ficticios/i)
  })
})
