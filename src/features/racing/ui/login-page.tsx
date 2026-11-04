import { ArrowRight } from 'lucide-react'

import type { AssistantPrincipal } from '../application/assistant-access'
import { demoProfiles } from '../application/demo-session'

export function LoginPage({
  principal,
  onSelect,
  error,
}: {
  principal: AssistantPrincipal | null
  onSelect: (id: 'admin' | 'worker') => void
  error: string
}) {
  return (
    <main className="rr-login">
      <div className="rr-login-content">
        <img src="/icon.png" alt="Riera Racing" className="rr-login-logo" />
        <h1>Elige quién eres</h1>
        <p className="rr-login-intro">
          Accede a la demo del taller seleccionando un perfil. Los datos son ficticios y se guardan
          en este navegador.
        </p>
        <div className="rr-login-grid">
          {demoProfiles.map(({ id, principal: profile }) => (
            <section key={id} className="rr-login-card" aria-labelledby={`login-${id}`}>
              <header>
                <h2 id={`login-${id}`}>{id === 'admin' ? 'Administración' : 'Taller'}</h2>
                <p>
                  {id === 'admin'
                    ? 'Presupuestos, planificación y gestión del taller.'
                    : 'Partes y vacaciones del equipo.'}
                </p>
              </header>
              <button type="button" onClick={() => onSelect(id)} className="rr-login-user">
                <span>
                  <strong>
                    {profile.role === 'admin' ? 'Administración' : profile.name}
                    {principal?.role === id && <small> · sesión actual</small>}
                  </strong>
                  <span>{id === 'admin' ? 'Administrador' : 'Trabajador'}</span>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </section>
          ))}
        </div>
        {error && (
          <p className="rr-login-error" role="alert">
            {error}
          </p>
        )}
        <p className="rr-login-disclaimer">
          Acceso simulado, sin contraseña ni seguridad real. El perfil limita las acciones del
          asistente, pero no protege el resto de la aplicación.
        </p>
      </div>
    </main>
  )
}
