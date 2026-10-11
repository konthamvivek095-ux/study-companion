import { useEffect, useState } from 'react'
import IndexDocumentButton from './IndexDocumentButton'
import './DocumentLibrary.css'

function DocumentLibrary({ onSessionExpired }) {
  const [documents, setDocuments] = useState([])
  const [listStatus, setListStatus] = useState('loading')
  const [listError, setListError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  const [feedback, setFeedback] = useState({
    type: 'idle',
    message: '',
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadDocuments() {
      setListStatus('loading')
      setListError('')

      try {
        const response = await fetch('/api/documents', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (response.status === 401) {
          onSessionExpired()
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load documents.'
          )
        }

        setDocuments(data.documents)
        setListStatus('ready')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setListError(
            'Could not load your documents. Please try again.'
          )
          setListStatus('error')
        }
      }
    }

    loadDocuments()

    return () => controller.abort()
  }, [refreshCount, onSessionExpired])

  async function handleUpload(event) {
    event.preventDefault()

    if (isUploading) return

    const form = event.currentTarget
    const formData = new FormData(form)
    const file = formData.get('file')

    if (!file || file.size === 0) {
      setFeedback({
        type: 'error',
        message: 'Please select a non-empty PDF.',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'Please select a PDF smaller than 5 MB.',
      })
      return
    }

    setIsUploading(true)

    setFeedback({
      type: 'loading',
      message: 'Uploading and reading your PDF…',
    })

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      if (response.status === 401) {
        onSessionExpired()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: data.message || 'Unable to upload this PDF.',
        })
        return
      }

      form.reset()

      setFeedback({
        type: 'success',
        message:
          `"${data.document.title}" was uploaded — ` +
          `${data.document.pageCount} pages processed. ` +
          'Click Prepare search beside it to enable questions.',
      })

      setRefreshCount((count) => count + 1)
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not reach the server. Please try again.',
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="documents-section" id="documents">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR MATERIALS</p>
          <h2>Document library</h2>
        </div>

        <p>Start with the notes you already have.</p>
      </div>

      <form
        className="document-upload-form"
        onSubmit={handleUpload}
      >
        <div className="document-upload-details">
          <label htmlFor="document-file">Add a PDF</label>

          <p id="document-upload-help">
            Text-based PDFs · Up to 5 MB · Maximum 100 pages
          </p>

          <input
            id="document-file"
            name="file"
            type="file"
            accept=".pdf,application/pdf"
            aria-describedby="document-upload-help"
            disabled={isUploading}
            required
          />
        </div>

        <button
          className="primary-button document-button"
          type="submit"
          disabled={isUploading}
        >
          {isUploading ? 'Processing…' : 'Upload PDF'}
          <span aria-hidden="true">↑</span>
        </button>
      </form>

      <p
        className={
          `document-feedback ` +
          `document-feedback-${feedback.type}`
        }
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {feedback.message}
      </p>

      {listStatus === 'loading' && (
        <p className="document-empty" role="status">
          Loading your library…
        </p>
      )}

      {listStatus === 'error' && (
        <div className="document-empty">
          <p role="alert">{listError}</p>

          <button
            className="primary-button document-button"
            type="button"
            onClick={() =>
              setRefreshCount((count) => count + 1)
            }
          >
            Try again
          </button>
        </div>
      )}

      {listStatus === 'ready' && documents.length === 0 && (
        <div className="document-empty">
          <h3>Your next subject starts here.</h3>

          <p>
            Upload your first PDF to begin building your library.
          </p>
        </div>
      )}

      {listStatus === 'ready' && documents.length > 0 && (
        <>
          <p className="document-list-caption">
            Your newest documents · Showing up to 50
          </p>

          <ul className="document-list">
            {documents.map((document) => (
              <li
                className="document-item"
                key={document.id}
              >
                <span
                  className="document-icon"
                  aria-hidden="true"
                >
                  PDF
                </span>

                <div className="document-information">
                  <h3>{document.title}</h3>

                  <p>
                    {document.pageCount} pages
                    {' · '}
                    {(
                      document.fileSize /
                      (1024 * 1024)
                    ).toFixed(2)} MB
                    {' · '}
                    {new Date(
                      document.createdAt
                    ).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                <IndexDocumentButton
                  documentId={document.id}
                  onSessionExpired={onSessionExpired}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default DocumentLibrary