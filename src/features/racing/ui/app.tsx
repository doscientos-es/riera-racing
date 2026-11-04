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
import { useCallback, useEffect, useState } from 'react'

import { loadWorkshop, saveWorkshop, WORKSHOP_KEY } from '../api'
import type { AssistantPrincipal } from '../application/assistant-access'
import type { Proposal } from '../application/assistant-intent'
import {
  DEMO_SESSION_KEY,
  isLoginScreen,
  readDemoPrincipal,
  saveDemoPrincipal,
} from '../application/demo-session'
import type { Workshop } from '../domain/model'
import { AssistantPage } from './assistant'
import { BillingPage } from './billing'
import { Dashboard, type Page } from './dashboard'
import { FloatingAssistant } from './floating-assistant'
import { InventoryPage, PurchasesPage } from './inventory'
import { LoginPage } from './login-page'
import { OperationsPage, TeamPage } from './operations'
import { ActivityPage, ClientsPage, FinanceOverviewPage } from './overview-pages'
import { IncidentsPage, PlanningPage } from './planning'
import { ProjectsPage } from './projects'
import { FormErrorContext, type Change } from './shared'
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

function readPrincipal(): AssistantPrincipal | null {
  try {
    return readDemoPrincipal(window.localStorage)
  } catch {
    return null
  }
}

export function RacingApp() {
  const [loaded, setLoaded] = useState<Loaded>(read)
  const [page, setPage] = useState<Page>('inicio')
  const [selected, setSelected] = useState('')
  const [assistantDraft, setAssistantDraft] = useState<{
    id: string
    text: string
    proposal: Proposal | null
  } | null>(null)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const clearFormError = useCallback(() => setFormError(''), [])
  const [principal, setPrincipal] = useState<AssistantPrincipal | null>(readPrincipal)
  const [pathname, setPathname] = useState(() => (principal ? window.location.pathname : '/login'))
  const [loginError, setLoginError] = useState('')
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
        setPage('inicio')
        setSelected('')
        setAssistantDraft(null)
      }
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
      setAssistantDraft(null)
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
  const assistantChange: Change = (command) => commit(command, 'Asistente simulado')
  const changeProfile = () => {
    window.history.pushState(null, '', '/login')
    setPathname('/login')
    setLoginError('')
  }
  const signIn = (id: 'admin' | 'worker') => {
    try {
      saveDemoPrincipal(window.localStorage, id)
      setPrincipal(readDemoPrincipal(window.localStorage))
      setPage('inicio')
      setSelected('')
      setAssistantDraft(null)
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
    <FormErrorContext.Provider value={{ error: formError, clear: clearFormError }}>
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
          changeProfile={changeProfile}
        />
        <div className="rr-main">
          <header className="rr-topbar">
            <div>
              <img className="rr-mobile-brand" src="/icon.png" alt="" />
              <span>Riera Racing</span>
              <span className="rr-top-divider">/</span>
              <strong>{navigation.find((item) => item.id === page)?.label}</strong>
            </div>
            <div className="rr-top-session">
              <span className="rr-top-demo">
                DEMO LOCAL <span />
              </span>
              <button type="button" className="rr-change-profile-mobile" onClick={changeProfile}>
                Cambiar perfil
              </button>
            </div>
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
            {page === 'inicio' && (
              <Dashboard state={state} navigate={setPage} select={setSelected} />
            )}
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
                key={`${principal.role}-${assistantDraft?.id ?? ''}`}
                state={state}
                change={assistantChange}
                principal={principal}
                initialText={assistantDraft?.text}
                initialProposal={assistantDraft?.proposal}
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
          key={principal.role}
          state={state}
          change={assistantChange}
          principal={principal}
          openAssistant={(text, proposal) => {
            setAssistantDraft({ id: crypto.randomUUID(), text, proposal })
            setPage('asistente')
          }}
        />
      </div>
    </FormErrorContext.Provider>
  )
}
