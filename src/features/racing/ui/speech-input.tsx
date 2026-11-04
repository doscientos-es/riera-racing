import { useEffect, useRef, useState } from 'react'

type SpeechResult = { isFinal: boolean; 0: { transcript: string } }
type SpeechEvent = { resultIndex: number; results: ArrayLike<SpeechResult> }
type Recognition = {
  lang: string
  interimResults: boolean
  onresult: ((event: SpeechEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechWindow = Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition }

export function SpeechInput({ onText }: { onText: (text: string) => void }) {
  const recognition = useRef<Recognition | null>(null)
  const onTextRef = useRef(onText)
  onTextRef.current = onText
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [supported, setSupported] = useState(false)

  useEffect(() => {
    const speechWindow = window as SpeechWindow
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Constructor) return
    setSupported(true)
    const instance = new Constructor()
    instance.lang = 'es-ES'
    instance.interimResults = false
    instance.onresult = (event) => {
      const texts: string[] = []
      for (let index = event.resultIndex; index < event.results.length; index++) {
        const result = event.results[index]
        if (result?.isFinal && result[0]) texts.push(result[0].transcript)
      }
      if (texts.length) onTextRef.current(texts.join(' '))
    }
    instance.onerror = () => setError('No se pudo reconocer el audio. Comprueba el permiso del micrófono o escribe la nota.')
    instance.onend = () => setListening(false)
    recognition.current = instance
    return () => {
      instance.onresult = null
      instance.onerror = null
      instance.onend = null
      instance.abort()
      recognition.current = null
    }
  }, [])

  const toggle = () => {
    if (!recognition.current) return
    if (listening) { recognition.current.stop(); return }
    try {
      setError('')
      recognition.current.start()
      setListening(true)
    } catch {
      setError('No se pudo iniciar el micrófono. Escribe la nota o inténtalo de nuevo.')
    }
  }
  return (
    <div className="rr-stack">
      <div className="rr-actions">
        <button type="button" className="rr-button rr-button-light" disabled={!supported} onClick={toggle}>
          {listening ? 'Detener dictado' : 'Dictar con el micrófono'}
        </button>
        <span className="rr-hint" role="status">{listening ? 'Escuchando…' : supported ? 'Permiso de micrófono necesario.' : 'Dictado no disponible en este navegador; escribe la nota.'}</span>
      </div>
      {error && <p className="rr-warning" role="alert">{error}</p>}
    </div>
  )
}