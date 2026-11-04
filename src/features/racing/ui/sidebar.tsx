import { Button } from '@doscientos/ui'
import { ChevronDown, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import type { AssistantPrincipal } from '../application/assistant-access'
import type { Workshop } from '../domain/model'
import type { Page } from './dashboard'

export type NavigationItem = { id: Page; label: string; icon: LucideIcon; group: string }

export function filterNavigation(items: NavigationItem[], query: string): NavigationItem[] {
  const normalize = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  const search = normalize(query.trim())
  return search ? items.filter((item) => normalize(item.label).includes(search)) : items
}

export function Sidebar({
  state,
  principal,
  navigation,
  page,
  navigate,
  reset,
  changeProfile,
}: {
  state: Workshop
  principal: AssistantPrincipal
  navigation: NavigationItem[]
  page: Page
  navigate: (page: Page) => void
  reset: () => void
  changeProfile: () => void
}) {
  const [query, setQuery] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const visible = filterNavigation(navigation, query)
  const groups = [...new Set(visible.map((item) => item.group))]
  const counts: Partial<Record<Page, number>> = {
    incidencias: state.incidents.filter((incident) => !incident.resolved).length,
    presupuestos: state.projects.filter((project) => project.status === 'presupuesto').length,
    inventario: state.products.filter((product) => product.stock <= product.minimum).length,
    compras: state.purchases.filter((purchase) => purchase.status === 'pendiente').length,
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === 'k' &&
        searchRef.current?.getClientRects().length
      ) {
        event.preventDefault()
        searchRef.current.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <aside className="rr-sidebar">
      <div className="rr-sidebar-user">
        <img className="rr-sidebar-logo" src="/icon.png" alt="" />
        <div>
          <strong>Riera Racing</strong>
        </div>
      </div>
      <label className="rr-sidebar-search">
        <Search size={16} aria-hidden="true" />
        <input
          ref={searchRef}
          type="search"
          aria-label="Buscar módulos"
          placeholder="Buscar módulos…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <kbd>Ctrl K</kbd>
      </label>
      <nav aria-label="Navegación principal" className="rr-navigation">
        {groups.map((group) => (
          <div className="rr-nav-group" key={group}>
            <p className="rr-sidebar-label">{group}</p>
            <ul>
              {visible
                .filter((item) => item.group === group)
                .map(({ id, label, icon: Icon }) => (
                  <li key={id}>
                    <button
                      type="button"
                      className={page === id ? 'active' : ''}
                      onClick={() => {
                        navigate(id)
                        setQuery('')
                      }}
                      aria-current={page === id ? 'page' : undefined}
                    >
                      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
                      <span>{label}</span>
                      {counts[id] ? <span className="rr-nav-count">{counts[id]}</span> : null}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {visible.length === 0 && <p className="rr-sidebar-empty">No hay módulos que coincidan.</p>}
      </nav>
      <div className="rr-sidebar-footer">
        <Button
          className="rr-sidebar-primary"
          onClick={() => navigate(principal.role === 'admin' ? 'presupuestos' : 'planificacion')}
        >
          {principal.role === 'admin' ? 'Ver presupuestos' : 'Mis tareas'}
        </Button>
        {principal.role === 'admin' && (
          <button type="button" className="rr-sidebar-reset" onClick={reset}>
            Restablecer datos iniciales
          </button>
        )}
        <div className={`rr-profile-menu ${profileOpen ? 'is-open' : ''}`}>
          {profileOpen && (
            <div className="rr-profile-actions">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false)
                  changeProfile()
                }}
              >
                Cambiar perfil
              </button>
              {principal.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    reset()
                  }}
                >
                  Restablecer datos iniciales
                </button>
              )}
            </div>
          )}
          <button
            type="button"
            className="rr-profile-trigger"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((open) => !open)}
          >
            <span className="rr-profile-avatar">
              {(principal.role === 'admin'
                ? 'RR'
                : principal.name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
              ).toUpperCase()}
            </span>
            <span className="rr-profile-copy">
              <strong>{principal.role === 'admin' ? 'Equipo Riera' : principal.name}</strong>
              <small>{principal.role === 'admin' ? 'Administrador' : 'Equipo de taller'}</small>
            </span>
            <ChevronDown size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
