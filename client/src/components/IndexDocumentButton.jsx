import { useState } from 'react'
import './IndexDocumentButton.css'

function IndexDocumentButton({
  documentId,
  onSessionExpired,
}) {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')

  async function handleIndex() {
    if (status === 'loading' || status === 'ready') {
      return
    }

    setStatus('loading')
    setMessage('Preparing your passages…')

    try {
      const response = await fetch(
        `/api/documents/${documentId}/index`,
        {
          method: 'POST',
          credentials: 'include',
        }
      )

      if (response.status === 401) {
        onSessionExpired()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setMessage(
          data.message || 'Unable to prepare this document.'
        )
        return
      }

      setStatus('ready')
      setMessage(`${data.totalChunks} passages ready`)
    } catch {
      setStatus('error')
      setMessage('Could not reach the server. Please try again.')
    }
  }

  const buttonLabel =
    status === 'loading'
      ? 'Preparing…'
      : status === 'ready'
        ? 'Search ready'
        : status === 'error'
          ? 'Retry preparation'
          : 'Prepare search'

  return (
    <div className="index-control">
      <button
        className="index-button"
        type="button"
        onClick={handleIndex}
        disabled={status === 'loading' || status === 'ready'}
      >
        {buttonLabel}
      </button>

      <p
        className={`index-message index-message-${status}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {message}
      </p>
    </div>
  )
}

export default IndexDocumentButton