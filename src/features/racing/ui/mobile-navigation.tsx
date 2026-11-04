import { DialogContent, DialogRoot, DialogTitle } from '@doscientos/ui'
import { ArrowRight, MoreHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { Workshop } from '../domain/model'
import type { Page } from './dashboard'
import type { NavigationItem } from './sidebar'

const shortcuts: Page[] = ['inicio', 'proyectos', 'planificacion']

export function MobileNavigation({
  navigation,
  page,
  state,
  navigate,
  changeProfile,
}: {
  navigation: NavigationItem[]
  page: Page
  state: Workshop
  navigate: (page: Page) => void
  changeProfile: () => void
}) {
  const [open, setOpen] = useState(false)
  const counts: Partial<Record<Page, number>> = {
    incidencias: state.incidents.filter((incident) => !incident.resolved).length,
    presupuestos: state.projects.filter((project) => project.status === 'presupuesto').length,
    inventario: state.products.filter((product) => product.stock <= product.minimum).length,
    compras: state.purchases.filter((purchase) => purchase.status === 'pendiente').length,
  }
  const visibleShortcuts = shortcuts
    .map((id) => navigation.find((item) => item.id === id))
    .filter((item): item is NavigationItem => Boolean(item))
    .slice(0, 3)
  const groups = [...new Set(navigation.map((item) => item.group))]

  useEffect(() => {
    const desktop = window.matchMedia?.('(min-width: 761px)')
    if (!desktop) return
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false)
    }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  const selectPage = (next: Page) => {
    setOpen(false)
    navigate(next)
  }

  return (
    <>
      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent
          className="rr-mobile-menu"
          overlaySlot="rr-mobile-menu-overlay"
          showCloseButton={false}
        >
          <header>
            <div>
              <DialogTitle>Todos los módulos</DialogTitle>
            </div>
            <button type="button" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              <X size={19} />
            </button>
          </header>
          <div className="rr-mobile-menu-content">
            {groups.map((group) => (
              <div className="rr-mobile-menu-group" key={group}>
                <p>{group}</p>
                {navigation
                  .filter((item) => item.group === group)
                  .map(({ id, label, icon: Icon }) => (
                    <button
                      type="button"
                      key={id}
                      className={page === id ? 'active' : ''}
                      aria-current={page === id ? 'page' : undefined}
                      onClick={() => selectPage(id)}
                    >
                      <span className="rr-mobile-menu-icon">
                        <Icon size={18} />
                      </span>
                      <span>{label}</span>
                      {counts[id] ? <b>{counts[id]}</b> : null}
                      <ArrowRight size={15} />
                    </button>
                  ))}
              </div>
            ))}
          </div>
          <footer>
            <span>Desliza y elige una sección para continuar</span>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                changeProfile()
              }}
            >
              Cambiar perfil
            </button>
          </footer>
        </DialogContent>
      </DialogRoot>
      <nav className="rr-mobile-dock" aria-label="Navegación móvil">
        {visibleShortcuts.map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={page === id ? 'active' : ''}
            aria-current={page === id ? 'page' : undefined}
            onClick={() => selectPage(id)}
          >
            <span className="rr-dock-icon">
              <Icon size={19} strokeWidth={1.8} />
            </span>
            <span>{label === 'Planificación' ? 'Agenda' : label}</span>
          </button>
        ))}
        <button
          type="button"
          className={open || !visibleShortcuts.some((item) => item.id === page) ? 'active' : ''}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="rr-dock-icon">
            <MoreHorizontal size={20} strokeWidth={1.8} />
          </span>
          <span>Más</span>
        </button>
      </nav>
    </>
  )
}
