import type { AssistantPrincipal } from './assistant-access'

export const DEMO_SESSION_KEY = 'riera-racing:session:v1'

export const demoProfiles: { id: 'admin' | 'worker'; principal: AssistantPrincipal }[] = [
  { id: 'admin', principal: { role: 'admin' } },
  { id: 'worker', principal: { role: 'worker', name: 'Àlex Ferrer' } },
]

export function readDemoPrincipal(storage: Pick<Storage, 'getItem'>): AssistantPrincipal | null {
  const id = storage.getItem(DEMO_SESSION_KEY)
  return demoProfiles.find((profile) => profile.id === id)?.principal ?? null
}

export function saveDemoPrincipal(storage: Pick<Storage, 'setItem'>, id: 'admin' | 'worker') {
  storage.setItem(DEMO_SESSION_KEY, id)
}

export function isLoginScreen(pathname: string, principal: AssistantPrincipal | null): boolean {
  return !principal || pathname.replace(/\/+$/, '') === '/login'
}
