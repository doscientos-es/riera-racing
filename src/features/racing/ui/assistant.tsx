import { useState } from 'react'

import { canUseAction, type AssistantPrincipal } from '../application/assistant-access'
import {
  ACTIONS,
  suggestAction,
  type ActionKind,
  type Proposal,
} from '../application/assistant-intent'
import type { Workshop } from '../domain/model'
import { AssistantForm } from './assistant-form'
import { Badge, Field, Section, today, type Change } from './shared'
import { SpeechInput } from './speech-input'

const examples = [
  'Registrar parte en BMW M3 E36: 2 horas; trabajo: montar frenos; operario: Àlex Ferrer',
  'Añadir tarea al BMW M3 E36; tarea: revisar frenos; responsable: Àlex Ferrer',
  'Crear pedido de Latiguillos metálicos para BMW M3 E36; cantidad: 2',
  'Recibir pedido PED-001; cantidad: 1',
  'Crear borrador de factura del BMW M3 E36',
]

export function AssistantPage({
  state,
  change,
  principal,
  initialText = '',
  initialProposal = null,
}: {
  state: Workshop
  change: Change
  principal: AssistantPrincipal
  initialText?: string
  initialProposal?: Proposal | null
}) {
  const [text, setText] = useState(initialText)
  const [proposal, setProposal] = useState<Proposal | null>(initialProposal)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const changeText = (value: string) => {
    setText(value)
    setProposal(null)
    setError('')
  }
  const suggest = () => {
    let result = suggestAction(text, state, today())
    if (result && !canUseAction(principal, result.kind)) {
      setProposal(null)
      setError('Esta acción no está disponible para el perfil de trabajador.')
      return
    }
    if (result && principal.role === 'worker' && !result.values.worker)
      result = { ...result, values: { ...result.values, worker: principal.name } }
    setProposal(result)
    setError(
      result
        ? ''
        : 'No he identificado una única acción. Prueba un ejemplo o selecciona la acción manualmente.',
    )
  }
  return (
    <div className="rr-stack">
      <div className="rr-heading">
        <div>
          <span className="rr-eyebrow">ASISTENCIA AL TALLER</span>
          <h1>Asistente con IA</h1>
        </div>
        <Badge tone="amber">Simulación</Badge>
      </div>
      <div className="rr-notice">
        <strong>Simulación sin IA.</strong> Reconoce frases sencillas, no entiende lenguaje libre.
        El dictado depende del navegador y puede enviar audio a su proveedor de reconocimiento. Usa
        solo datos ficticios. Los cambios confirmados se guardan en este navegador. El perfil
        elegido al entrar es simulado y no constituye un control de acceso real.
      </div>
      <Section
        title="Dicta o escribe una acción"
        subtitle="Indica una acción cada vez. También puedes seleccionar el tipo manualmente."
      >
        <div className="rr-stack">
          <SpeechInput onText={changeText} />
          <Field label="Nota transcrita o escrita">
            <textarea
              value={text}
              onChange={(event) => changeText(event.target.value)}
              placeholder="Ej.: Registrar parte en BMW M3 E36: 2 horas; trabajo: montar frenos; operario: Àlex Ferrer"
              rows={4}
            />
          </Field>
          <div className="rr-actions">
            <button className="rr-button" disabled={!text.trim()} onClick={suggest}>
              Preparar propuesta
            </button>
            <Field label="O selecciona una acción">
              <select
                value=""
                onChange={(event) => {
                  const kind = event.target.value as ActionKind
                  if (ACTIONS.some((action) => action.kind === kind)) {
                    setProposal({
                      kind,
                      values: {
                        date: today(),
                        ...(principal.role === 'worker' ? { worker: principal.name } : {}),
                      },
                    })
                    setError('')
                  }
                }}
              >
                <option value="">Seleccionar</option>
                {ACTIONS.filter((action) => canUseAction(principal, action.kind)).map((action) => (
                  <option key={action.kind} value={action.kind}>
                    {action.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          {error && (
            <p className="rr-warning" role="alert">
              {error}
            </p>
          )}
          <div className="rr-example">
            <strong>Prueba un ejemplo</strong>
            <div className="rr-actions">
              {examples.map((example) => (
                <button
                  type="button"
                  className="rr-text-button"
                  key={example}
                  onClick={() => changeText(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>
      {proposal && (
        <AssistantForm
          proposal={proposal}
          setProposal={setProposal}
          state={state}
          change={change}
          principal={principal}
          cancel={() => setProposal(null)}
        />
      )}
      <Section
        title="Lectura de albaranes y facturas"
        subtitle="Ejemplo simulado: el archivo no se lee ni se sube."
      >
        <div className="rr-stack">
          <Field label="Seleccionar PDF de ejemplo">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
            />
          </Field>
          {fileName && (
            <div className="rr-example">
              <strong>Ejemplo fijo · {fileName}</strong>
              <p>Pedido: 2 kits de frenos · recepción de ejemplo: 1</p>
              <p>La diferencia se mostraría para revisión antes de actualizar el stock.</p>
              <small>
                El archivo no se lee ni se sube. Para probar la recepción manual, utiliza Compras.
              </small>
            </div>
          )}
        </div>
      </Section>
    </div>
  )
}
