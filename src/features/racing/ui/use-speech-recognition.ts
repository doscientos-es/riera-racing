import { useEffect, useRef, useState } from 'react'

import { createSpeechSession, type Recognition } from './speech-session'

type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition
  webkitSpeechRecognition?: new () => Recognition
}

export function useSpeechRecognition(
  onText: (text: string) => void,
  onComplete?: (text: string) => void,
) {
  const session = useRef<ReturnType<typeof createSpeechSession> | null>(null)
  const handlers = useRef({ onText, onComplete })
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')
  const [supported] = useState(
    () =>
      typeof window !== 'undefined' &&
      Boolean(
        (window as SpeechWindow).SpeechRecognition ??
        (window as SpeechWindow).webkitSpeechRecognition,
      ),
  )

  useEffect(() => {
    handlers.current = { onText, onComplete }
  }, [onText, onComplete])
  useEffect(() => {
    return () => {
      session.current?.cancel()
      session.current = null
    }
  }, [])

  const start = () => {
    if (session.current) return
    const speechWindow = window as SpeechWindow
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Constructor) {
      setError('Este navegador no puede escucharme. Puedes escribir tu indicación en el asistente.')
      return
    }
    try {
      setError('')
      const current = createSpeechSession(new Constructor(), {
        onText: (text) => handlers.current.onText(text),
        onComplete: (text) => handlers.current.onComplete?.(text),
        onError: setError,
        onEnd: () => {
          session.current = null
          setListening(false)
        },
      })
      session.current = current
      current.start()
      if (session.current === current) setListening(true)
    } catch {
      session.current?.cancel()
      session.current = null
      setListening(false)
      setError('No he podido activar el micrófono. Prueba de nuevo o escribe tu indicación.')
    }
  }
  const stop = () => session.current?.stop()
  const cancel = () => {
    session.current?.cancel()
    session.current = null
    setListening(false)
  }
  return { supported, listening, error, start, stop, cancel }
}
