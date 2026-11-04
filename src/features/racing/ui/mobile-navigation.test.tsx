import { Gauge, ListChecks, Receipt, TriangleAlert, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { canVisitPage } from '../application/worker-access'
import { seedWorkshop } from '../infrastructure/seed'
import { MobileNavigation } from './mobile-navigation'
import type { NavigationItem } from './sidebar'

// Render the dialog contents on the server so the menu's actual items can be checked.
vi.mock('@doscientos/ui', () => ({
  DialogRoot: ({ children }: { children: ReactNode }) => <>{children}</>,
  DialogContent: ({ children }: { children: ReactNode }) => <section>{children}</section>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}))

const navigation: NavigationItem[] = [
  { id: 'inicio', label: 'Inicio', icon: Gauge, group: 'Operativa' },
  { id: 'planificacion', label: 'Mis tareas', icon: ListChecks, group: 'Operativa' },
  { id: 'incidencias', label: 'Incidencias', icon: TriangleAlert, group: 'Operativa' },
  { id: 'equipo', label: 'Mis vacaciones', icon: UsersRound, group: 'Operativa' },
  { id: 'facturacion', label: 'Facturación', icon: Receipt, group: 'Administración' },
]

describe('navegación móvil', () => {
  it('ofrece accesos directos, todos los módulos y el cambio de perfil', () => {
    const html = renderToStaticMarkup(
      <MobileNavigation
        navigation={navigation}
        page="facturacion"
        state={seedWorkshop()}
        navigate={vi.fn()}
        changeProfile={vi.fn()}
      />,
    )
    expect(html).toContain('aria-label="Navegación móvil"')
    expect(html).toContain('aria-haspopup="dialog"')
    expect(html).toContain('Todos los módulos')
    expect(html).toContain('Facturación')
    expect(html).toContain('Cambiar perfil')
    expect(html).toContain('aria-current="page"')
  })

  it('no añade al menú módulos restringidos para el trabajador', () => {
    const worker = { role: 'worker', name: 'Àlex Ferrer' } as const
    const html = renderToStaticMarkup(
      <MobileNavigation
        navigation={navigation.filter((item) => canVisitPage(worker, item.id))}
        page="inicio"
        state={seedWorkshop()}
        navigate={vi.fn()}
        changeProfile={vi.fn()}
      />,
    )
    expect(html).toContain('Mis tareas')
    expect(html).toContain('Mis vacaciones')
    expect(html).not.toContain('Facturación')
  })
})
