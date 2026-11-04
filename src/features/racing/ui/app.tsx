import {
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
import { useCallback, useEffect, useState } from 'react'

import { loadWorkshop, saveWorkshop, WORKSHOP_KEY } from '../api'
import type { AssistantPrincipal } from '../application/assistant-access'
import {
  DEMO_SESSION_KEY,
  isLoginScreen,
  readDemoPrincipal,
  saveDemoPrincipal,
} from '../application/demo-session'
import { canVisitPage, workerWorkshop } from '../application/worker-access'
import type { Workshop } from '../domain/model'
import { BillingPage } from './billing'
import { Dashboard, type Page } from './dashboard'
import { FloatingAssistant } from './floating-assistant'
import { InventoryPage, PurchasesPage } from './inventory'
import { LoginPage } from './login-page'
import { MobileNavigation } from './mobile-navigation'
import { OperationsPage, TeamPage } from './operations'
import { ActivityPage, ClientsPage, FinanceOverviewPage } from './overview-pages'
import { IncidentsPage, PlanningPage } from './planning'
import { ProjectsPage } from './projects'
import { racingPath, readRacingRoute } from './racing-route'
import { FormErrorContext, type Change } from './shared'
import { Sidebar, type NavigationItem } from './sidebar'
import { WorkerDashboard, WorkerProjects } from './worker-pages'

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
]

type Loaded = { state: Workshop; error: null } | { state: null; error: string }
function read(): Loaded {
  try {
    return { state: loadWorkshop(window.localStorage), error: null }
  } catch {
    return {
      state: null,
      error:
        'No se han podido leer los datos locales. Comprueba que el navegador permite el almacenamiento o restablece los datos iniciales.',
    }
  }
}

function readPrincipal(): AssistantPrincipal | null {
  try {
    return readDemoPrincipal(window.localStorage)
  } catch {
    return null
  }
}

export function RacingApp() {
  const [loaded, setLoaded] = useState<Loaded>(read)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const clearFormError = useCallback(() => setFormError(''), [])
  const [principal, setPrincipal] = useState<AssistantPrincipal | null>(readPrincipal)
  const [pathname, setPathname] = useState(() => (principal ? window.location.pathname : '/login'))
  const [loginError, setLoginError] = useState('')
  const { page, projectId: selected } = readRacingRoute(
    pathname,
    navigation.map((item) => item.id),
  )
  useEffect(() => {
    const onPopState = () => {
      if (!principal && window.location.pathname !== '/login') {
        window.history.replaceState(null, '', '/login')
      }
      setPathname(window.location.pathname)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [principal])
  useEffect(() => {
    if (!principal && window.location.pathname !== '/login') {
      window.history.replaceState(null, '', '/login')
    }
  }, [principal])
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === WORKSHOP_KEY || event.key === null) setLoaded(read())
      if (event.key === DEMO_SESSION_KEY || event.key === null) {
        const next = readPrincipal()
        setPrincipal(next)
        if (!next) {
          window.history.replaceState(null, '', '/login')
          setPathname('/login')
        }
        if (next) {
          window.history.replaceState(null, '', '/')
          setPathname('/')
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  const reset = () => {
    if (
      !window.confirm(
        '¿Restablecer los datos iniciales? Se perderán los cambios guardados en este navegador.',
      )
    )
      return
    try {
      window.localStorage.removeItem(WORKSHOP_KEY)
      setLoaded(read())
      window.history.replaceState(null, '', '/')
      setPathname('/')
      setMessage('Datos iniciales restablecidos.')
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
      setFormError('')
      setMessage('Cambios guardados en este navegador.')
      return true
    } catch (error) {
      const text = error instanceof Error ? error.message : 'No se han podido guardar los cambios.'
      setFormError(text)
      setMessage(text)
      return false
    }
  }
  const change: Change = (command) =>
    commit(command, navigation.find((item) => item.id === page)?.label ?? 'Taller')
  const assistantChange: Change = (command) => commit(command, 'Asistente')
  const changeProfile = () => {
    window.history.pushState(null, '', '/login')
    setPathname('/login')
    setLoginError('')
  }
  const signIn = (id: 'admin' | 'worker') => {
    try {
      saveDemoPrincipal(window.localStorage, id)
      setPrincipal(readDemoPrincipal(window.localStorage))
      setMessage('')
      setFormError('')
      setLoginError('')
      window.history.replaceState(null, '', '/')
      setPathname('/')
    } catch {
      setLoginError('No se ha podido guardar el perfil. Comprueba el almacenamiento del navegador.')
    }
  }
  if (isLoginScreen(pathname, principal) || !principal)
    return <LoginPage principal={principal} onSelect={signIn} error={loginError} />
  if (!loaded.state)
    return (
      <main className="rr-failure">
        <h1>No se puede abrir la aplicación</h1>
        <p>{loaded.error}</p>
        <button className="rr-button" onClick={reset}>
          Restablecer datos iniciales
        </button>
        <output>{message}</output>
      </main>
    )
  const worker = principal.role === 'worker' ? principal.name : undefined
  const state = worker ? workerWorkshop(loaded.state, worker) : loaded.state
  const visibleNavigation = navigation
    .filter((item) => canVisitPage(principal, item.id))
    .map((item) =>
      worker && item.id === 'proyectos'
        ? { ...item, label: 'Mis proyectos' }
        : worker && item.id === 'planificacion'
          ? { ...item, label: 'Mis tareas' }
          : worker && item.id === 'taller'
            ? { ...item, label: 'Mis partes' }
            : worker && item.id === 'equipo'
              ? { ...item, label: 'Mis vacaciones', group: 'Operativa' }
              : item,
    )
  const currentPage = canVisitPage(principal, page) ? page : 'inicio'
  const go = (path: string) => {
    if (window.location.pathname === path) return
    window.history.pushState(null, '', path)
    setPathname(path)
  }
  const navigate = (next: Page) => {
    if (canVisitPage(principal, next)) go(racingPath(next))
  }
  const selectProject = (id: string, target: 'proyectos' | 'presupuestos' = 'proyectos') => {
    if (canVisitPage(principal, target)) go(racingPath(target, id))
  }
  return (
    <FormErrorContext.Provider value={{ error: formError, clear: clearFormError }}>
      <div className="rr-app">
        <a className="rr-skip" href="#contenido">
          Saltar al contenido
        </a>
        <Sidebar
          state={state}
          principal={principal}
          navigation={visibleNavigation}
          page={currentPage}
          navigate={navigate}
          reset={reset}
          changeProfile={changeProfile}
        />
        <div className="rr-main">
          <main id="contenido" className="rr-content">
            {message && (
              <output className="rr-message">
                <span>{message}</span>
                <button aria-label="Cerrar aviso" onClick={() => setMessage('')}>
                  ×
                </button>
              </output>
            )}
            {currentPage === 'inicio' &&
              (worker ? (
                <WorkerDashboard state={state} name={worker} navigate={navigate} />
              ) : (
                <Dashboard state={state} navigate={navigate} openProject={selectProject} />
              ))}
            {worker && currentPage === 'proyectos' && (
              <WorkerProjects state={state} selected={selected} select={selectProject} />
            )}
            {!worker && (currentPage === 'proyectos' || currentPage === 'presupuestos') && (
              <ProjectsPage
                key={currentPage}
                state={state}
                change={change}
                selected={selected}
                select={(id) => selectProject(id, currentPage)}
                budgetsOnly={currentPage === 'presupuestos'}
              />
            )}
            {currentPage === 'planificacion' && (
              <PlanningPage key={principal.role} state={state} change={change} worker={worker} />
            )}
            {currentPage === 'incidencias' && (
              <IncidentsPage key={principal.role} state={state} change={change} worker={worker} />
            )}
            {currentPage === 'clientes' && (
              <ClientsPage state={state} openProject={selectProject} />
            )}
            {currentPage === 'taller' && (
              <OperationsPage key={principal.role} state={state} change={change} worker={worker} />
            )}
            {currentPage === 'inventario' && <InventoryPage state={state} change={change} />}
            {currentPage === 'compras' && <PurchasesPage state={state} change={change} />}
            {currentPage === 'facturacion' && <BillingPage state={state} change={change} />}
            {(currentPage === 'gastos' ||
              currentPage === 'contabilidad' ||
              currentPage === 'informes') && (
              <FinanceOverviewPage state={state} mode={currentPage} />
            )}
            {currentPage === 'actividad' && <ActivityPage state={state} />}
            {currentPage === 'equipo' && (
              <TeamPage key={principal.role} state={state} change={change} worker={worker} />
            )}
            {!worker && (
              <footer className="rr-footer">
                <button className="rr-reset-mobile" onClick={reset}>
                  Restablecer datos iniciales
                </button>
              </footer>
            )}
          </main>
        </div>
        <MobileNavigation
          navigation={visibleNavigation}
          page={currentPage}
          state={state}
          navigate={navigate}
          changeProfile={changeProfile}
        />
        <FloatingAssistant
          key={principal.role}
          state={state}
          change={assistantChange}
          principal={principal}
        />
      </div>
    </FormErrorContext.Provider>
  )
}
