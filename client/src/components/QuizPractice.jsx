import { useEffect, useState } from 'react'
import './QuizPractice.css'

async function requestJson(url, options = {}, timeout = 90000) {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    signal: AbortSignal.timeout(timeout),
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.message || 'The request failed.')
    error.status = response.status
    throw error
  }

  return data
}

function errorMessage(error) {
  if (error.name === 'TimeoutError') {
    return 'The request took too long. Please try again.'
  }

  if (error instanceof TypeError) {
    return 'Could not reach the server. Check that your backend is running.'
  }

  return error.message || 'Something went wrong. Please try again.'
}

function QuizPractice({ onSessionExpired, onAttemptSaved }) {
  const [documents, setDocuments] = useState([])
  const [documentId, setDocumentId] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  const [loadingDocuments, setLoadingDocuments] = useState(true)
  const [documentError, setDocumentError] = useState('')

  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)

  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const busy = generating || submitting

  useEffect(() => {
    let active = true

    async function loadDocuments() {
      setLoadingDocuments(true)
      setDocumentError('')

      try {
        const data = await requestJson('/api/documents', {}, 15000)

        if (!active) return

        setDocuments(data.documents)
        setDocumentId((currentId) =>
          data.documents.some((document) => document.id === currentId)
            ? currentId
            : ''
        )
      } catch (requestError) {
        if (!active) return

        if (requestError.status === 401) {
          onSessionExpired()
          return
        }

        setDocumentError(errorMessage(requestError))
      } finally {
        if (active) setLoadingDocuments(false)
      }
    }

    loadDocuments()

    return () => {
      active = false
    }
  }, [refreshCount, onSessionExpired])

  async function generateQuiz() {
    if (!documentId || busy) return

    setGenerating(true)
    setError('')

    try {
      const data = await requestJson('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      })

      setQuiz(data.quiz)
      setAnswers({})
      setResult(null)
    } catch (requestError) {
      if (requestError.status === 401) {
        onSessionExpired()
        return
      }

      setError(errorMessage(requestError))
    } finally {
      setGenerating(false)
    }
  }

  async function submitQuiz(event) {
    event.preventDefault()

    if (!quiz || busy || result) return

    const allAnswered = quiz.questions.every((question) =>
      Number.isInteger(answers[question.id])
    )

    if (!allAnswered) {
      setError('Choose an answer for every question.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const data = await requestJson(
        `/api/quizzes/${quiz.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answers: quiz.questions.map((question) => ({
              questionId: question.id,
              selectedAnswerIndex: answers[question.id],
            })),
          }),
        }
      )

      setResult(data)
      onAttemptSaved?.()
    } catch (requestError) {
      if (requestError.status === 401) {
        onSessionExpired()
        return
      }

      setError(errorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  const answeredCount = quiz
    ? quiz.questions.filter((question) =>
        Number.isInteger(answers[question.id])
      ).length
    : 0

  return (
    <section className="quiz-section" id="practice">
      <div className="section-heading">
        <div>
          <p className="eyebrow">PUT YOUR UNDERSTANDING TO WORK</p>
          <h2>Practice with your notes</h2>
        </div>
        <p>Small quizzes. Clear explanations.</p>
      </div>

      <div className="quiz-controls">
        <div className="quiz-control-heading">
          <label htmlFor="quiz-document">Choose a document</label>

          <button
            className="quiz-refresh"
            type="button"
            disabled={loadingDocuments || busy}
            onClick={() => setRefreshCount((count) => count + 1)}
          >
            {loadingDocuments ? 'Loading…' : 'Refresh list'}
          </button>
        </div>

        <select
          id="quiz-document"
          value={documentId}
          disabled={
            loadingDocuments ||
            busy ||
            Boolean(documentError) ||
            documents.length === 0
          }
          onChange={(event) => {
            setDocumentId(event.target.value)
            setQuiz(null)
            setAnswers({})
            setResult(null)
            setError('')
          }}
        >
          <option value="">Select your PDF</option>
          {documents.map((document) => (
            <option key={document.id} value={document.id}>
              {document.title}
            </option>
          ))}
        </select>

        <p className="quiz-helper">
          Uploaded a new PDF? Refresh the list to select it.
        </p>

        {!loadingDocuments &&
          !documentError &&
          documents.length === 0 && (
            <p className="quiz-helper">
              Upload a PDF in your document library first.
            </p>
          )}

        {documentError && (
          <p className="quiz-error" role="alert">
            {documentError}
          </p>
        )}

        <button
          className="primary-button quiz-button"
          type="button"
          onClick={generateQuiz}
          disabled={
            !documentId ||
            busy ||
            loadingDocuments ||
            Boolean(documentError)
          }
        >
          {generating
            ? 'Creating your quiz…'
            : quiz
              ? 'Generate a new quiz'
              : 'Generate quiz'}
          <span aria-hidden="true">↗</span>
        </button>
      </div>

      {generating && (
        <p className="quiz-helper" role="status">
          Preparing up to five questions from your document…
        </p>
      )}

      {error && (
        <p className="quiz-error" role="alert">
          {error}
        </p>
      )}

      {quiz && !result && !generating && (
        <form className="quiz-form" onSubmit={submitQuiz}>
          <div className="quiz-progress">
            <h3>{quiz.title}</h3>
            <span aria-live="polite">
              {answeredCount}/{quiz.questions.length} answered
            </span>
          </div>

          {quiz.questions.map((question, questionIndex) => (
            <fieldset
              className="quiz-question"
              key={question.id}
              disabled={submitting}
            >
              <legend>
                {questionIndex + 1}. {question.question}
              </legend>

              <div className="quiz-options">
                {question.options.map((option, optionIndex) => (
                  <label
                    className={`quiz-option ${
                      answers[question.id] === optionIndex
                        ? 'quiz-option-selected'
                        : ''
                    }`}
                    key={optionIndex}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={optionIndex}
                      checked={answers[question.id] === optionIndex}
                      required
                      onChange={() => {
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: optionIndex,
                        }))
                        setError('')
                      }}
                    />

                    <span className="quiz-option-letter">
                      {String.fromCharCode(65 + optionIndex)}
                    </span>

                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <button
            className="primary-button quiz-button"
            type="submit"
            disabled={
              submitting || answeredCount !== quiz.questions.length
            }
          >
            {submitting ? 'Checking answers…' : 'Submit answers'}
            <span aria-hidden="true">↗</span>
          </button>
        </form>
      )}

      {result && !generating && (
        <div className="quiz-review">
          <div className="quiz-score" role="status">
            <div>
              <p className="eyebrow">PRACTICE COMPLETE</p>
              <h3>
                {result.score} / {result.totalQuestions} correct
              </h3>
              <p>Review the explanations and check the source passages.</p>
            </div>
            <strong>{result.percentage}%</strong>
          </div>

          {result.results.map((item, index) => (
            <article className="quiz-review-card" key={item.questionId}>
              <span
                className={`quiz-result-label ${
                  item.isCorrect ? 'quiz-correct' : 'quiz-revisit'
                }`}
              >
                {item.isCorrect ? 'Correct' : 'Revisit this concept'}
              </span>

              <h4>
                {index + 1}. {item.question}
              </h4>

              <p>
                <strong>Your answer: </strong>
                {item.options[item.selectedAnswerIndex]}
              </p>

              {!item.isCorrect && (
                <p>
                  <strong>Correct answer: </strong>
                  {item.options[item.correctAnswerIndex]}
                </p>
              )}

              <p className="quiz-explanation">{item.explanation}</p>
              <p className="quiz-helper">Concept: {item.concept}</p>

              {item.citations.map((citation) => (
                <details className="quiz-source" key={citation.sourceId}>
                  <summary>
                    Page {citation.pageNumber} · Passage{' '}
                    {citation.sourceId + 1}
                  </summary>
                  <p>{citation.text}</p>
                </details>
              ))}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default QuizPractice