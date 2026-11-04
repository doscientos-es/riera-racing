import {
  Bot,
  Boxes,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  Clock3,
  FileText,
  Gauge,
  ListChecks,
  Receipt,
  ShoppingCart,
  TriangleAlert,
  UsersRound,
  Wrench,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { loadWorkshop, saveWorkshop, WORKSHOP_KEY } from '../api'
import type { AssistantPrincipal } from '../application/assistant-access'
import type { Workshop } from '../domain/model'
import { AssistantPage } from './assistant'
import { BillingPage } from './billing'
import { Dashboard, type Page } from './dashboard'
import { FloatingAssistant } from './floating-assistant'
import { InventoryPage, PurchasesPage } from './inventory'
import { OperationsPage, TeamPage } from './operations'
import { ActivityPage, ClientsPage, FinanceOverviewPage } from './overview-pages'
import { IncidentsPage, PlanningPage } from './planning'
import { ProjectsPage } from './projects'
import type { Change } from './shared'
import { Sidebar, type NavigationItem } from './sidebar'

const navigation: NavigationItem[] = [
  { id: 'inicio', label: 'Inicio', icon: Gauge, group: 'Operativa' },
  { id: 'incidencias', label: 'Incidencias', icon: TriangleAlert, group: 'Operativa' },
  { id: 'presupuestos', label: 'Presupuestos', icon: FileText, group: 'Operativa' },
  { id: 'proyectos', label: 'Proyectos', icon: ClipboardList, group: 'Operativa' },
  { id: 'planificacion', label: 'Planificación', icon: ListChecks, group: 'Operativa' },
  { id: 'taller', label: 'Partes de taller', icon: Wrench, group: 'Operativa' },
  { id: 'inventario', label: 'Inventario', icon: Boxes, group: 'Operativa' },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, group: 'Operativa' },
  { id: 'clientes', label: 'Clientes', icon: UsersRound, group: 'Administración' },
  { id: 'equipo', label: 'Equipo y ausencias', icon: CalendarDays, group: 'Administración' },
  { id: 'facturacion', label: 'Facturación', icon: Receipt, group: 'Administración' },
  { id: 'gastos', label: 'Gastos', icon: Receipt, group: 'Administración' },
  { id: 'contabilidad', label: 'Contabilidad', icon: ChartColumn, group: 'Administración' },
  { id: 'informes', label: 'Informes', icon: ChartColumn, group: 'Administración' },
  { id: 'actividad', label: 'Actividad', icon: Clock3, group: 'Administración' },
  { id: 'asistente', label: 'Asistente IA', icon: Bot, group: 'Herramientas' },
]

type Loaded = { state: Workshop; error: null } | { state: null; error: string }
function read(): Loaded {
  try {
    return { state: loadWorkshop(window.localStorage), error: null }
  } catch {
    return {
      state: null,
      error:
        'No se han podido leer los datos locales. Comprueba que el navegador permite el almacenamiento o restablece la demo.',
    }
  }
}

export function RacingApp() {
  const [loaded, setLoaded] = useState<Loaded>(read)
  const [page, setPage] = useState<Page>('inicio')
  const [selected, setSelected] = useState('')
  const [message, setMessage] = useState('')
  const [principal, setPrincipal] = useState<AssistantPrincipal>({ role: 'admin' })
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === WORKSHOP_KEY) setLoaded(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const reset = () => {
    if (
      !window.confirm('¿Restablecer la demo? Se perderán los cambios guardados en este navegador.')
    )
      return
    try {
      window.localStorage.removeItem(WORKSHOP_KEY)
      setLoaded(read())
      setSelected('')
      setPage('inicio')
      setMessage('Datos de ejemplo restablecidos.')
    } catch {
      setMessage('No se han podido restablecer los datos locales.')
    }
  }
  const commit = (command: Parameters<Change>[0], source: string) => {
    if (!loaded.state) return false
    try {
      const updated = command(loaded.state)
      const next = {
        ...updated,
        activity: [
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            description: `Cambios guardados · ${source}`,
          },
          ...updated.activity,
        ].slice(0, 200),
      }
      saveWorkshop(window.localStorage, next)
      setLoaded({ state: next, error: null })
      setMessage('Cambios guardados en este navegador.')
      return true
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se han podido guardar los cambios.')
      return false
    }
  }
  const change: Change = (command) =>
    commit(command, navigation.find((item) => item.id === page)?.label ?? 'Taller')
  const assistantChange: Change = (command) => commit(command, 'Asistente simulado')
  if (!loaded.state)
    return (
      <main className="rr-failure">
        <h1>No se puede abrir la demo</h1>
        <p>{loaded.error}</p>
        <button className="rr-button" onClick={reset}>
          Restablecer datos de ejemplo
        </button>
        <output>{message}</output>
      </main>
    )
  const state = loaded.state
  return (
    <div className="rr-app">
      <a className="rr-skip" href="#contenido">
        Saltar al contenido
      </a>
      <Sidebar
        state={state}
        principal={principal}
        navigation={navigation}
        page={page}
        navigate={setPage}
        reset={reset}
      />
      <div className="rr-main">
        <header className="rr-topbar">
          <div>
            <img className="rr-mobile-brand" src="/icon.png" alt="" />
            <span>Riera Racing</span>
            <span className="rr-top-divider">/</span>
            <strong>{navigation.find((item) => item.id === page)?.label}</strong>
          </div>
          <span className="rr-top-demo">
            DEMO LOCAL <span />
          </span>
        </header>
        <main id="contenido" className="rr-content">
          <div className="rr-mobile-nav" aria-label="Secciones">
            {navigation.map(({ id, label }) => (
              <button
                key={id}
                className={page === id ? 'active' : ''}
                onClick={() => setPage(id)}
                aria-current={page === id ? 'page' : undefined}
              >
                {label}
              </button>
            ))}
          </div>
          {message && (
            <output className="rr-message">
              <span>{message}</span>
              <button aria-label="Cerrar aviso" onClick={() => setMessage('')}>
                ×
              </button>
            </output>
          )}
          {page === 'inicio' && <Dashboard state={state} navigate={setPage} select={setSelected} />}
          {(page === 'proyectos' || page === 'presupuestos') && (
            <ProjectsPage
              key={page}
              state={state}
              change={change}
              selected={selected}
              select={setSelected}
              budgetsOnly={page === 'presupuestos'}
            />
          )}
          {page === 'planificacion' && <PlanningPage state={state} change={change} />}
          {page === 'incidencias' && <IncidentsPage state={state} change={change} />}
          {page === 'clientes' && (
            <ClientsPage
              state={state}
              openProject={(id) => {
                setSelected(id)
                setPage('proyectos')
              }}
            />
          )}
          {page === 'taller' && <OperationsPage state={state} change={change} />}
          {page === 'inventario' && <InventoryPage state={state} change={change} />}
          {page === 'compras' && <PurchasesPage state={state} change={change} />}
          {page === 'facturacion' && <BillingPage state={state} change={change} />}
          {(page === 'gastos' || page === 'contabilidad' || page === 'informes') && (
            <FinanceOverviewPage state={state} mode={page} />
          )}
          {page === 'actividad' && <ActivityPage state={state} />}
          {page === 'equipo' && <TeamPage state={state} change={change} />}
          {page === 'asistente' && (
            <AssistantPage
              key={principal.role}
              state={state}
              change={assistantChange}
              principal={principal}
            />
          )}
          <footer className="rr-footer">
            Prototipo de demostración · Datos ficticios · Dictado según el navegador
            <button className="rr-reset-mobile" onClick={reset}>
              Restablecer datos de ejemplo
            </button>
          </footer>
        </main>
      </div>
      <FloatingAssistant
        state={state}
        change={assistantChange}
        principal={principal}
        setPrincipal={setPrincipal}
      />
    </div>
  )
}
