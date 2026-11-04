import { Mic, MicOff, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { applyAssistantProposal, type AssistantPrincipal } from '../application/assistant-access'
import type { Proposal } from '../application/assistant-intent'
import { describeProposal, prepareVoiceAction } from '../application/assistant-run'
import type { Workshop } from '../domain/model'
import { AssistantForm } from './assistant-form'
import { today, uid, type Change } from './shared'
import { useSpeechRecognition } from './use-speech-recognition'

export function FloatingAssistant({
  state,
  change,
  principal,
  setPrincipal,
}: {
  state: Workshop
  change: Change
  principal: AssistantPrincipal
  setPrincipal: (principal: AssistantPrincipal) => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const run = (transcript: string) => {
    setText(transcript)
    setProposal(null)
    const id = uid()
    const prepared = prepareVoiceAction(transcript, state, principal, today(), id)
    if (prepared.status === 'error') {
      setResult(prepared.message)
      return
    }
    if (prepared.status === 'review') {
      setProposal(prepared.proposal)
      setResult(`Necesito que revises los datos: ${prepared.message}`)
      return
    }
    const saved = change((current) =>
      applyAssistantProposal(current, prepared.proposal, principal, id),
    )
    setResult(
      saved
        ? `Hecho en la demo: ${prepared.summary}. Guardado en este navegador.`
        : 'No se ha podido guardar la acción. Revisa el aviso de la página.',
    )
  }
  const speech = useSpeechRecognition(setText, run)
  const { cancel } = speech
  const close = () => {
    cancel()
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        cancel()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, cancel])
  const chooseRole = (role: string) => {
    speech.cancel()
    setProposal(null)
    setResult('')
    setPrincipal(role === 'worker' ? { role: 'worker', name: 'Àlex Ferrer' } : { role: 'admin' })
  }
  return (
    <>
      {open && (
        <div
          className={`rr-voice-glow${speech.listening ? ' is-listening' : ''}`}
          aria-hidden="true"
        />
      )}
      {open && (
        <section className="rr-voice-panel" aria-label="Asistente de voz simulado">
          <header className="rr-voice-head">
            <span className="rr-voice-mark">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Asistente de taller</strong>
              <small>Simulación · sin IA conectada</small>
            </div>
            <button
              type="button"
              className="rr-voice-close"
              aria-label="Cerrar asistente"
              onClick={close}
            >
              <X size={20} />
            </button>
          </header>
          <div className="rr-voice-body">
            <label className="rr-field">
              Perfil de demostración
              <select value={principal.role} onChange={(event) => chooseRole(event.target.value)}>
                <option value="admin">Administración</option>
                <option value="worker">Trabajador · Àlex Ferrer</option>
              </select>
            </label>
            <p className="rr-voice-note">
              Perfil simulado, no es seguridad. El dictado depende del navegador, que puede enviar
              el audio a su proveedor. Usa solo datos ficticios.
            </p>
            <label className="rr-field">
              Tu indicación
              <textarea
                rows={3}
                value={text}
                onChange={(event) => {
                  setText(event.target.value)
                  setProposal(null)
                  setResult('')
                }}
                placeholder="Ej.: Añadir tarea al BMW M3 E36; tarea: revisar frenos; responsable: Àlex Ferrer"
              />
            </label>
            <div className="rr-actions">
              <button
                type="button"
                className="rr-button"
                disabled={!speech.supported}
                onClick={() => {
                  if (speech.listening) speech.stop()
                  else {
                    setText('')
                    setResult('')
                    setProposal(null)
                    speech.start()
                  }
                }}
              >
                {speech.listening ? <MicOff size={17} /> : <Mic size={17} />}
                {speech.listening ? 'Terminar y ejecutar' : 'Hablar'}
              </button>
              <button
                type="button"
                className="rr-button rr-button-light"
                disabled={!text.trim() || speech.listening}
                onClick={() => run(text)}
              >
                Ejecutar texto
              </button>
            </div>
            <p className="rr-voice-note">
              {speech.listening
                ? 'Escuchando… Al terminar procesaré la transcripción definitiva.'
                : speech.supported
                  ? 'Una acción por indicación. Solo algunas órdenes exactas se guardan automáticamente; las demás requieren revisión.'
                  : 'Dictado no disponible en este navegador; puedes escribir.'}
            </p>
            {speech.error && (
              <p className="rr-warning" role="alert">
                {speech.error}
              </p>
            )}
            {result && <output className="rr-voice-result">{result}</output>}
            {proposal && (
              <AssistantForm
                proposal={proposal}
                setProposal={setProposal}
                state={state}
                change={change}
                principal={principal}
                cancel={() => {
                  setProposal(null)
                  setResult('Acción cancelada; no se ha guardado nada.')
                }}
                onSaved={() =>
                  setResult(
                    `Hecho en la demo: ${describeProposal(proposal, state)}. Guardado en este navegador.`,
                  )
                }
              />
            )}
          </div>
        </section>
      )}
      <button
        type="button"
        className="rr-voice-trigger"
        aria-label={open ? 'Cerrar asistente de voz' : 'Abrir asistente de voz y empezar a dictar'}
        aria-expanded={open}
        onClick={
          open
            ? close
            : () => {
                setText('')
                setResult('')
                setProposal(null)
                setOpen(true)
                speech.start()
              }
        }
      >
        {open ? <X size={23} /> : <Mic size={23} />}
      </button>
    </>
  )
}
