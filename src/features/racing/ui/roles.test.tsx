import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { DEMO_SESSION_KEY } from '../application/demo-session'
import { workerWorkshop } from '../application/worker-access'
import { seedWorkshop } from '../infrastructure/seed'
import { RacingApp } from './app'
import { OperationsPage, TeamPage } from './operations'
import { PlanningPage } from './planning'
import { WorkerProjects } from './worker-pages'

function renderProfile(profile: 'admin' | 'worker') {
  vi.stubGlobal('window', {
    localStorage: { getItem: (key: string) => (key === DEMO_SESSION_KEY ? profile : null) },
    location: { pathname: '/' },
  })
  return renderToStaticMarkup(<RacingApp />)
}

afterEach(() => vi.unstubAllGlobals())

describe('navegación por perfil', () => {
  it('muestra solo la operativa personal al trabajador', () => {
    const html = renderProfile('worker')
    expect(html).toContain('Mis proyectos')
    expect(html).toContain('Mis tareas')
    expect(html).toContain('Mis partes')
    expect(html).toContain('Mis vacaciones')
    expect(html).toContain('BMW M3 E36')
    expect(html).not.toContain('Porsche 911 GT3')
    expect(html).not.toContain('Facturación')
    expect(html).not.toContain('Informes')
    expect(html).not.toContain('Ver presupuestos')
    expect(html).not.toContain('Restablecer datos iniciales')
    expect(html).not.toMatch(/demo local|prototipo|datos ficticios/i)
  })

  it('mantiene la navegación completa para administración y el botón flotante', () => {
    const html = renderProfile('admin')
    expect(html).toContain('Facturación')
    expect(html).toContain('Informes')
    expect(html).toContain('Ver presupuestos')
    expect(html).toContain('Abrir asistente y empezar a dictar')
    expect(html).toContain('rr-mobile-dock')
    expect(html).not.toContain('rr-topbar')
    expect(html).not.toContain('Asistente IA')
    expect(html).not.toMatch(/demo local|prototipo|datos ficticios/i)
  })

  it('mantiene las pantallas del trabajador centradas en su actividad', () => {
    const worker = 'Àlex Ferrer'
    const state = workerWorkshop(seedWorkshop(), worker)
    const change = vi.fn(() => true)
    const projects = renderToStaticMarkup(<WorkerProjects state={state} />)
    const tasks = renderToStaticMarkup(<PlanningPage state={state} change={change} worker={worker} />)
    const parts = renderToStaticMarkup(<OperationsPage state={state} change={change} worker={worker} />)
    const absences = renderToStaticMarkup(<TeamPage state={state} change={change} worker={worker} />)
    expect(projects).toContain('BMW M3 E36')
    expect(projects).not.toContain('Porsche 911 GT3')
    expect(projects).not.toContain('Presupuesto')
    expect(tasks).toContain('Montar el kit de frenos')
    expect(tasks).not.toContain('Asignar tarea')
    expect(tasks).not.toContain('Ausencias registradas')
    expect(parts).toContain('Mis partes')
    expect(parts).not.toContain('coste</')
    expect(absences).toContain('Mis vacaciones')
  })
})
