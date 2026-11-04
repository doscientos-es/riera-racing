import type { Workshop } from '../domain/model'
import { quoteTotal } from '../domain/workshop'

export function workshopOverview(state: Workshop) {
  const labor = state.parts.reduce((sum, part) => sum + Math.round(part.hours * part.hourlyCost), 0)
  const materials = state.parts.reduce((sum, part) => sum + part.materialCost, 0)
  const expenses = state.parts.reduce((sum, part) => sum + part.expense, 0)
  const draftValue = state.invoices.reduce((sum, invoice) => sum + quoteTotal(invoice.lines), 0)
  return { labor, materials, expenses, draftValue, totalCost: labor + materials + expenses }
}

export function clientSummaries(state: Workshop) {
  const clients = new Map<string, typeof state.projects>()
  for (const project of state.projects) {
    const name = project.client.trim()
    clients.set(name, [...(clients.get(name) ?? []), project])
  }
  return [...clients].map(([name, projects]) => ({ name, projects }))
}
