import { describe, expect, it } from 'vitest'

import { readSpeechResults } from './use-speech-recognition'

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
