import { useSpeechRecognition } from './use-speech-recognition'

export function SpeechInput({ onText }: { onText: (text: string) => void }) {
  const { supported, listening, error, start, stop } = useSpeechRecognition(onText)
  return (
    <div className="rr-stack">
      <div className="rr-actions">
        <button
          type="button"
          className="rr-button rr-button-light"
          disabled={!supported}
          onClick={listening ? stop : start}
        >
          {listening ? 'Detener dictado' : 'Dictar con el micrófono'}
        </button>
        <output className="rr-hint">
          {listening
            ? 'Escuchando…'
            : supported
              ? 'Permiso de micrófono necesario.'
              : 'Dictado no disponible en este navegador; escribe la nota.'}
        </output>
      </div>
      {error && (
        <p className="rr-warning" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
