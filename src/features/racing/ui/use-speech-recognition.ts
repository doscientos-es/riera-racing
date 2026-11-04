import { useEffect, useRef, useState } from 'react'

type SpeechResult = { isFinal: boolean; 0: { transcript: string } }
type SpeechEvent = { results: ArrayLike<SpeechResult> }
type Recognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  onresult: ((event: SpeechEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition
  webkitSpeechRecognition?: new () => Recognition
}

export function readSpeechResults(results: ArrayLike<SpeechResult>) {
  let final = ''
  let interim = ''
  for (let index = 0; index < results.length; index++) {
    const result = results[index]
    if (!result?.[0]) continue
    if (result.isFinal) final += `${result[0].transcript} `
    else interim += `${result[0].transcript} `
  }
  return { final: final.trim(), text: `${final}${interim}`.trim() }
}

export function useSpeechRecognition(
  onText: (text: string) => void,
  onComplete?: (text: string) => void,
) {
  const recognition = useRef<Recognition | null>(null)
  const handlers = useRef({ onText, onComplete })
  const finalText = useRef('')
  const cancelled = useRef(false)
  const active = useRef(false)
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
    const speechWindow = window as SpeechWindow
    const Constructor = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition
    if (!Constructor) return
    const instance = new Constructor()
    instance.lang = 'es-ES'
    instance.interimResults = true
    instance.continuous = false
    instance.onresult = (event) => {
      if (cancelled.current) return
      const result = readSpeechResults(event.results)
      finalText.current = result.final
      handlers.current.onText(result.text)
    }
    instance.onerror = () => {
      cancelled.current = true
      setError('No se pudo reconocer el audio. Comprueba el micrófono o escribe la nota.')
    }
    instance.onend = () => {
      active.current = false
      setListening(false)
      const text = finalText.current
      finalText.current = ''
      if (!cancelled.current && text) handlers.current.onComplete?.(text)
      else if (!cancelled.current && !text)
        setError('No se ha reconocido ninguna frase. Inténtalo de nuevo o escribe la indicación.')
    }
    recognition.current = instance
    return () => {
      cancelled.current = true
      instance.onresult = null
      instance.onerror = null
      instance.onend = null
      instance.abort()
      recognition.current = null
    }
  }, [])

  const start = () => {
    if (!recognition.current || listening) return
    if (active.current) {
      setError('El micrófono se está deteniendo. Inténtalo de nuevo en un momento.')
      return
    }
    try {
      finalText.current = ''
      cancelled.current = false
      setError('')
      recognition.current.start()
      active.current = true
      setListening(true)
    } catch {
      setError('No se pudo iniciar el micrófono. Escribe la nota o inténtalo de nuevo.')
    }
  }
  const stop = () => recognition.current?.stop()
  const cancel = () => {
    cancelled.current = true
    recognition.current?.abort()
    setListening(false)
  }
  return { supported, listening, error, start, stop, cancel }
}
