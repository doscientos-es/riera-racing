import { describe, expect, it, vi } from 'vitest'

import { createSpeechSession, readSpeechResults, type Recognition } from './speech-session'

describe('transcripción progresiva', () => {
  it('distingue las palabras provisionales de las definitivas', () => {
    const results = [
      { isFinal: true, 0: { transcript: 'Registrar parte' } },
      { isFinal: false, 0: { transcript: 'en el BMW' } },
    ]
    expect(readSpeechResults(results)).toEqual({
      final: 'Registrar parte',
      text: 'Registrar parte en el BMW',
    })
    results[1] = { isFinal: true, 0: { transcript: 'en el Porsche' } }
    expect(readSpeechResults(results)).toEqual({
      final: 'Registrar parte en el Porsche',
      text: 'Registrar parte en el Porsche',
    })
  })
})

describe('sesión de reconocimiento', () => {
  function setup() {
    const recognition: Recognition = {
      lang: '',
      interimResults: false,
      continuous: true,
      onresult: null,
      onerror: null,
      onend: null,
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
    }
    const handlers = { onText: vi.fn(), onComplete: vi.fn(), onError: vi.fn(), onEnd: vi.fn() }
    return { recognition, handlers, session: createSpeechSession(recognition, handlers) }
  }

  it('muestra el texto provisional y ejecuta solo el resultado final al terminar', () => {
    const { recognition, handlers, session } = setup()
    session.start()
    expect(recognition.start).toHaveBeenCalledOnce()
    expect(recognition.interimResults).toBe(true)
    expect(recognition.continuous).toBe(false)
    recognition.onresult?.({ results: [{ isFinal: false, 0: { transcript: 'Aprobar' } }] })
    expect(handlers.onText).toHaveBeenCalledWith('Aprobar')
    expect(handlers.onComplete).not.toHaveBeenCalled()
    recognition.onresult?.({
      results: [{ isFinal: true, 0: { transcript: 'Aprobar presupuesto' } }],
    })
    recognition.onend?.()
    expect(handlers.onComplete).toHaveBeenCalledExactlyOnceWith('Aprobar presupuesto')
    expect(handlers.onEnd).toHaveBeenCalledOnce()
  })

  it('no ejecuta transcripciones provisionales ni callbacks tardíos tras cancelar', () => {
    const { recognition, handlers, session } = setup()
    recognition.onresult?.({ results: [{ isFinal: false, 0: { transcript: 'Aprobar' } }] })
    const lateEnd = recognition.onend
    session.cancel()
    lateEnd?.()
    expect(recognition.abort).toHaveBeenCalledOnce()
    expect(handlers.onComplete).not.toHaveBeenCalled()
    expect(handlers.onError).not.toHaveBeenCalled()
    expect(handlers.onEnd).toHaveBeenCalledOnce()
  })

  it('informa de los permisos sin ejecutar texto ni procesar un fin posterior', () => {
    const { recognition, handlers } = setup()
    recognition.onresult?.({
      results: [{ isFinal: true, 0: { transcript: 'Aprobar presupuesto' } }],
    })
    const lateEnd = recognition.onend
    recognition.onerror?.({ error: 'not-allowed' })
    lateEnd?.()
    expect(handlers.onError).toHaveBeenCalledWith(expect.stringContaining('permiso'))
    expect(handlers.onComplete).not.toHaveBeenCalled()
    expect(handlers.onEnd).toHaveBeenCalledOnce()
  })

  it('ofrece reintentar si no llega una transcripción final', () => {
    const { recognition, handlers } = setup()
    recognition.onend?.()
    expect(handlers.onError).toHaveBeenCalledWith(expect.stringContaining('No he escuchado'))
    expect(handlers.onComplete).not.toHaveBeenCalled()
  })
})
