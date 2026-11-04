import { ArrowUpRight, LoaderCircle, Mic, Sparkles, Square, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { applyAssistantProposal, type AssistantPrincipal } from '../application/assistant-access'
import type { Proposal } from '../application/assistant-intent'
import { prepareVoiceAction } from '../application/assistant-run'
import type { Workshop } from '../domain/model'
import { today, uid, type Change } from './shared'
import { useSpeechRecognition } from './use-speech-recognition'

function TypedReply({ text }: { text: string }) {
  const [visible, setVisible] = useState('')
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(text)
      return
    }
    setVisible('')
    let count = 0
    const timer = window.setInterval(() => {
      count = Math.min(count + 3, text.length)
      setVisible(text.slice(0, count))
      if (count === text.length) window.clearInterval(timer)
    }, 30)
    return () => window.clearInterval(timer)
  }, [text])
  return (
    <output className="rr-voice-result" aria-live="polite">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{visible}</span>
    </output>
  )
}

export function FloatingAssistant({
  state,
  change,
  principal,
  openAssistant,
}: {
  state: Workshop
  change: Change
  principal: AssistantPrincipal
  openAssistant: (text: string, proposal: Proposal | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [processing, setProcessing] = useState(false)
  const pending = useRef<number | null>(null)
  const run = (transcript: string) => {
    setText(transcript)
    setProcessing(true)
    pending.current = window.setTimeout(() => {
      pending.current = null
      const id = uid()
      const prepared = prepareVoiceAction(transcript, state, principal, today(), id)
      if (prepared.status === 'error') setResult(prepared.message)
      else if (prepared.status === 'review') {
        setProposal(prepared.proposal)
        setResult(`Necesito que revises los datos: ${prepared.message}`)
      } else {
        const saved = change((current) =>
          applyAssistantProposal(current, prepared.proposal, principal, id),
        )
        setResult(
          saved
            ? `Hecho en la demo: ${prepared.summary}. Guardado en este navegador.`
            : 'No he podido guardar la acción. Revisa el aviso de la página.',
        )
      }
      setProcessing(false)
    }, 0)
  }
  const speech = useSpeechRecognition(setText, run)
  const { cancel } = speech
  const close = () => {
    if (pending.current !== null) window.clearTimeout(pending.current)
    pending.current = null
    setProcessing(false)
    cancel()
    setOpen(false)
  }
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (pending.current !== null) window.clearTimeout(pending.current)
        pending.current = null
        setProcessing(false)
        cancel()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, cancel])
  useEffect(
    () => () => {
      if (pending.current !== null) window.clearTimeout(pending.current)
    },
    [],
  )
  const start = () => {
    setText('')
    setResult('')
    setProposal(null)
    setOpen(true)
    speech.start()
  }
  const reply = result || speech.error
  const status = processing
    ? 'Preparando acción'
    : speech.listening
      ? 'Escuchando'
      : 'Asistente de taller'
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
            <div className="rr-voice-status">
              <span className={speech.listening ? 'is-listening' : ''} />
              {status}
            </div>
            <p className={`rr-voice-transcript${text ? '' : ' is-placeholder'}`}>
              {text ||
                (speech.listening ? 'Te escucho. ¿Qué necesitas?' : '¿En qué puedo ayudarte?')}
            </p>
            {speech.listening && (
              <p className="rr-voice-hint">
                Habla con naturalidad. Al terminar, prepararé tu acción.
              </p>
            )}
            {processing && <p className="rr-voice-hint">Preparando tu indicación…</p>}
            {reply && (
              <div className="rr-voice-reply">
                <Sparkles size={17} />
                <TypedReply text={reply} />
              </div>
            )}
            {(proposal || speech.error || (reply && !speech.listening)) && (
              <button
                type="button"
                className="rr-voice-link"
                onClick={() => {
                  close()
                  openAssistant(text, proposal)
                }}
              >
                {proposal ? 'Revisar acción' : 'Abrir asistente de texto'}{' '}
                <ArrowUpRight size={16} />
              </button>
            )}
          </div>
          <p className="rr-voice-privacy">
            El navegador puede enviar el audio a su proveedor. Usa solo datos ficticios.
          </p>
        </section>
      )}
      <button
        type="button"
        className={`rr-voice-trigger${speech.listening ? ' is-listening' : ''}`}
        aria-label={
          processing
            ? 'Preparando acción'
            : speech.listening
              ? 'Terminar y ejecutar'
              : open
                ? 'Volver a hablar'
                : 'Abrir asistente y empezar a dictar'
        }
        aria-expanded={open}
        aria-busy={processing}
        disabled={processing}
        onClick={speech.listening ? speech.stop : start}
      >
        {processing ? (
          <LoaderCircle className="rr-voice-spinner" size={23} />
        ) : speech.listening ? (
          <Square size={19} fill="currentColor" />
        ) : (
          <Mic size={23} />
        )}
      </button>
    </>
  )
}
