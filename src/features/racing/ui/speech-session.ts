export type SpeechResult = { isFinal: boolean; 0: { transcript: string } }
type SpeechEvent = { results: ArrayLike<SpeechResult> }
export type Recognition = {
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

export function createSpeechSession(
  instance: Recognition,
  handlers: {
    onText: (text: string) => void
    onComplete: (text: string) => void
    onError: (message: string) => void
    onEnd: () => void
  },
) {
  let finalText = ''
  let finished = false
  const detach = () => {
    instance.onresult = null
    instance.onerror = null
    instance.onend = null
  }
  const finish = () => {
    if (finished) return false
    finished = true
    detach()
    handlers.onEnd()
    return true
  }
  instance.lang = 'es-ES'
  instance.interimResults = true
  instance.continuous = false
  instance.onresult = (event) => {
    if (finished) return
    const result = readSpeechResults(event.results)
    finalText = result.final
    handlers.onText(result.text)
  }
  instance.onerror = (event) => {
    if (!finish()) return
    const message =
      event.error === 'not-allowed' || event.error === 'service-not-allowed'
        ? 'No tengo permiso para usar el micrófono. Puedes activarlo en tu navegador o escribir tu indicación.'
        : 'No he podido escuchar bien. Prueba de nuevo o escribe tu indicación.'
    handlers.onError(message)
  }
  instance.onend = () => {
    if (!finish()) return
    if (finalText) handlers.onComplete(finalText)
    else handlers.onError('No he escuchado ninguna frase. Prueba de nuevo o escribe tu indicación.')
  }
  return {
    start: () => instance.start(),
    stop: () => instance.stop(),
    cancel: () => {
      if (!finish()) return
      try {
        instance.abort()
      } catch {
        // A browser may reject abort when recognition never started.
      }
    },
  }
}
