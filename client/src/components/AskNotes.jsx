import { useEffect, useState } from 'react'
import './AskNotes.css'

function AskNotes({ onSessionExpired }) {
  const [documents, setDocuments] = useState([])
  const [documentId, setDocumentId] = useState('')
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState(null)

  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isAsking, setIsAsking] = useState(false)

  const [documentError, setDocumentError] = useState('')
  const [questionError, setQuestionError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadDocuments() {
      setIsLoadingDocuments(true)
      setDocumentError('')

      try {
        const response = await fetch('/api/documents', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (response.status === 401) {
          onSessionExpired()
          return
        }

        if (!response.ok) {
          throw new Error('Unable to load documents')
        }

        const data = await response.json()

        setDocuments(data.documents)

        setDocumentId((currentId) => {
          const stillExists = data.documents.some(
            (document) => document.id === currentId
          )

          return stillExists ? currentId : ''
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setDocumentError(
            'Could not load your documents. Please refresh the list.'
          )
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDocuments(false)
        }
      }
    }

    loadDocuments()

    return () => controller.abort()
  }, [refreshCount, onSessionExpired])

  async function handleAsk(event) {
    event.preventDefault()

    if (isAsking) return

    const cleanQuestion = question.trim()

    if (!documentId || cleanQuestion.length < 3) {
      setQuestionError('Choose a document and enter your question.')
      return
    }

    setIsAsking(true)
    setQuestionError('')
    setResult(null)

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          question: cleanQuestion,
        }),
      })

      if (response.status === 401) {
        onSessionExpired()
        return
      }

      const data = await response.json()

      if (!response.ok) {
        setQuestionError(
          data.message || 'Unable to answer your question.'
        )
        return
      }

      setResult({
        ...data,
        question: cleanQuestion,
      })
    } catch {
      setQuestionError(
        'Could not reach the server. Please try again.'
      )
    } finally {
      setIsAsking(false)
    }
  }

  function handleDocumentChange(event) {
    setDocumentId(event.target.value)
    setResult(null)
    setQuestionError('')
  }

  return (
    <section className="ask-section" id="ask-notes">
      <div className="section-heading">
        <div>
          <p className="eyebrow">A LITTLE MORE CLARITY</p>
          <h2>Ask your notes</h2>
        </div>

        <p>Answers grounded in your study materials.</p>
      </div>

      <form className="ask-form" onSubmit={handleAsk}>
        <div className="ask-document-heading">
          <label htmlFor="ask-document">Choose a document</label>

          <button
            className="ask-refresh"
            type="button"
            disabled={isLoadingDocuments || isAsking}
            onClick={() => {
              setResult(null)
              setRefreshCount((count) => count + 1)
            }}
          >
            {isLoadingDocuments ? 'Loading…' : 'Refresh list'}
          </button>
        </div>

        <select
          id="ask-document"
          value={documentId}
          onChange={handleDocumentChange}
          disabled={
            isLoadingDocuments ||
            isAsking ||
            Boolean(documentError) ||
            documents.length === 0
          }
          required
        >
          <option value="">Select your PDF</option>

          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.title} — {document.pageCount} pages
            </option>
          ))}
        </select>

        <p className="ask-helper">
          Uploaded a new PDF? Click Refresh list to select it.
        </p>

        {documentError && (
          <p className="ask-error" role="alert">
            {documentError}
          </p>
        )}

        {!isLoadingDocuments &&
          !documentError &&
          documents.length === 0 && (
            <p className="ask-helper">
              Upload a PDF in your document library first.
            </p>
          )}

        <label htmlFor="ask-question">Your question</label>

        <textarea
          id="ask-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="For example: How does this document explain overfitting?"
          rows={4}
          minLength={3}
          maxLength={1000}
          disabled={isAsking}
          required
        />

        <div className="ask-actions">
          <span className="ask-helper">
            {question.length}/1000 characters
          </span>

          <button
            className="primary-button ask-submit"
            type="submit"
            disabled={
              isAsking ||
              isLoadingDocuments ||
              Boolean(documentError) ||
              !documentId ||
              question.trim().length < 3
            }
          >
            {isAsking ? 'Finding an answer…' : 'Ask question'}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>

      {isAsking && (
        <p className="ask-helper" role="status">
          Reading relevant passages and preparing your answer…
        </p>
      )}

      {questionError && (
        <p className="ask-error" role="alert">
          {questionError}
        </p>
      )}

      {result && (
        <article className="answer-card">
          <p className="eyebrow">
            {result.supported
              ? 'ANSWER FROM YOUR NOTES'
              : 'MORE INFORMATION NEEDED'}
          </p>

          <h3>{result.question}</h3>

          <p className="answer-text">{result.answer}</p>

          {result.citations.length > 0 && (
            <div className="answer-sources">
              <h4>Check the source passages</h4>

              <p className="ask-helper">
                Expand a source and compare it with the answer.
              </p>

              {result.citations.map((citation) => (
                <details
                  className="source-passage"
                  key={citation.sourceId}
                >
                  <summary>
                    Page {citation.pageNumber}
                    {' · '}
                    Passage {citation.sourceId + 1}
                  </summary>

                  <p>{citation.text}</p>
                </details>
              ))}
            </div>
          )}
        </article>
      )}
    </section>
  )
}

export default AskNotes