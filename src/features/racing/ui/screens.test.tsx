import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { seedWorkshop } from '../api'
import { AssistantPage } from './assistant'
import { AssistantForm } from './assistant-form'
import { BillingPage } from './billing'
import { InventoryPage, PurchasesPage } from './inventory'
import { OperationsPage, TeamPage } from './operations'
import { ClientsPage, FinanceOverviewPage } from './overview-pages'
import { IncidentsPage, PlanningPage } from './planning'
import { ProjectsPage } from './projects'

describe('pantallas de la demo de taller', () => {
  const state = seedWorkshop()
  const change = vi.fn(() => true)

  it('muestra el vehículo, piezas y costes de su proyecto', () => {
    const html = renderToStaticMarkup(
      <ProjectsPage state={state} change={change} selected="p1" select={vi.fn()} />,
    )
    expect(html).toContain('BMW M3 E36')
    expect(html).toContain('Kit de frenos competición')
    expect(html).toContain('Coste registrado')
    expect(html).not.toContain('hectáreas')
  })

  it('presenta el pedido pendiente y no confunde el borrador con una factura fiscal', () => {
    const purchases = renderToStaticMarkup(<PurchasesPage state={state} change={change} />)
    const billing = renderToStaticMarkup(<BillingPage state={state} change={change} />)
    expect(purchases).toContain('PED-001')
    expect(purchases).toContain('Revisar recepción')
    expect(billing).toContain('no son facturas fiscales')
    expect(billing).toContain('CSV debe adaptarse')
  })

  it('deja claros los límites del asistente y permite revisar acciones', () => {
    const html = renderToStaticMarkup(
      <AssistantPage state={state} change={change} principal={{ role: 'admin' }} />,
    )
    expect(html).toContain('Simulación sin IA')
    expect(html).toContain('puede enviar audio')
    expect(html).toContain('Preparar propuesta')
    expect(html).toContain('el archivo no se lee ni se sube')
  })

  it('recibe la propuesta de voz para revisarla sin guardarla', () => {
    const save = vi.fn(() => true)
    const html = renderToStaticMarkup(
      <AssistantPage
        state={state}
        change={save}
        principal={{ role: 'admin' }}
        initialText="Recibir pedido PED-001"
        initialProposal={{ kind: 'receive', values: { purchaseId: 'o1', quantity: '1' } }}
      />,
    )
    expect(html).toContain('Recibir pedido PED-001')
    expect(html).toContain('Pedido de 2 unidades; se cerrará con 1')
    expect(html).toContain('Confirmar y guardar')
    expect(save).not.toHaveBeenCalled()
  })

  it('muestra la diferencia de recepción antes de confirmar el cambio de stock', () => {
    const html = renderToStaticMarkup(
      <AssistantForm
        proposal={{ kind: 'receive', values: { purchaseId: 'o1', quantity: '1' } }}
        setProposal={vi.fn()}
        state={state}
        change={change}
        principal={{ role: 'admin' }}
        cancel={vi.fn()}
      />,
    )
    expect(html).toContain('Pedido de 2 unidades; se cerrará con 1')
    expect(html).toContain('Confirmo la diferencia')
    expect(html).toContain('Confirmar y guardar')
  })

  it('conecta las nuevas vistas con los proyectos y aclara los límites contables', () => {
    const clients = renderToStaticMarkup(<ClientsPage state={state} openProject={vi.fn()} />)
    const planning = renderToStaticMarkup(<PlanningPage state={state} change={change} />)
    const incidents = renderToStaticMarkup(<IncidentsPage state={state} change={change} />)
    const finance = renderToStaticMarkup(<FinanceOverviewPage state={state} mode="contabilidad" />)
    expect(clients).toContain('Jordi Serra')
    expect(clients).toContain('BMW M3 E36')
    expect(planning).toContain('Montar el kit de frenos')
    expect(incidents).toContain('Registrar incidencia')
    expect(finance).toContain('cobros marcados son simulados')
    expect(finance).toContain('no son facturas emitidas')
  })

  it('ofrece acciones para abrir formularios sin mostrarlos de entrada', () => {
    const pages = [
      [
        <PlanningPage key="planning" state={state} change={change} />,
        'Asignar tarea',
        'Añadir tarea',
      ],
      [
        <IncidentsPage key="incidents" state={state} change={change} />,
        'Registrar incidencia',
        'Guardar incidencia',
      ],
      [
        <InventoryPage key="inventory" state={state} change={change} />,
        'Nueva pieza',
        'Guardar pieza',
      ],
      [
        <PurchasesPage key="purchases" state={state} change={change} />,
        'Nuevo pedido',
        'Crear pedido',
      ],
      [
        <OperationsPage key="operations" state={state} change={change} />,
        'Registrar parte',
        'Guardar parte',
      ],
      [
        <TeamPage key="team" state={state} change={change} />,
        'Añadir vacaciones',
        'Guardar vacaciones',
      ],
      [
        <BillingPage key="billing" state={state} change={change} />,
        'Preparar borrador',
        'Crear borrador',
      ],
      [
        <ProjectsPage
          key="projects"
          state={state}
          change={change}
          selected="p1"
          select={vi.fn()}
        />,
        'Nuevo proyecto',
        'Crear proyecto',
      ],
    ] as const

    for (const [page, action, submit] of pages) {
      const html = renderToStaticMarkup(page)
      expect(html).toContain(action)
      expect(html).toContain('aria-haspopup="dialog"')
      expect(html).not.toContain(submit)
      expect(html).not.toContain('<form')
    }
  })
})
