import { useEffect, useState } from 'react'
import './ConceptReview.css'

function ConceptReview({ onSessionExpired, refreshKey = 0 }) {
  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadReview() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/quizzes/concept-review', {
          credentials: 'include',
          signal: AbortSignal.timeout(15000),
        })

        if (!active) return

        if (response.status === 401) {
          onSessionExpired()
          return
        }

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Unable to load concept review.'
          )
        }

        if (active) setReview(data)
      } catch (requestError) {
        if (!active) return

        setError(
          requestError.name === 'TimeoutError'
            ? 'Loading took too long. Please refresh the review.'
            : 'Could not load your concepts. Please try again.'
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    loadReview()

    return () => {
      active = false
    }
  }, [onSessionExpired, refreshKey, refreshCount])

  return (
    <section className="concept-section" id="concept-review">
      <div className="section-heading">
        <div>
          <p className="eyebrow">NOTICE THE PATTERNS</p>
          <h2>Misconception Detective</h2>
        </div>

        <button
          className="concept-refresh"
          type="button"
          disabled={loading}
          onClick={() => setRefreshCount((count) => count + 1)}
        >
          {loading ? 'Loading…' : 'Refresh review'}
        </button>
      </div>

      <p className="concept-description">
        Find concepts to revisit using your saved quiz answers.
        Repeated mistakes are a signal to review a topic.
      </p>

      {loading && (
        <p className="concept-helper" role="status">
          Reviewing your recent practice…
        </p>
      )}

      {error && (
        <p className="concept-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && review && (
        <>
          {review.reviewedQuestions === 0 ? (
            <div className="concept-empty">
              <h3>Start building your learning picture.</h3>
              <p>
                Complete a quiz to see which concepts may need
                another look.
              </p>
              <a className="concept-link" href="#practice">
                Start practicing <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : (
            <>
              <div className="concept-stats">
                <div>
                  <strong>{review.reviewedQuestions}</strong>
                  <span>Distinct questions reviewed</span>
                </div>

                <div>
                  <strong>{review.incorrectQuestions}</strong>
                  <span>Latest answers incorrect</span>
                </div>

                <div>
                  <strong>{review.repeatedConcepts}</strong>
                  <span>Concepts with repeated mistakes</span>
                </div>
              </div>

              {review.concepts.length === 0 ? (
                <div className="concept-empty">
                  <h3>No concepts currently flagged.</h3>
                  <p>
                    Your latest answers to the reviewed questions
                    are correct. Keep practicing with new questions.
                  </p>
                </div>
              ) : (
                <div className="concept-grid">
                  {review.concepts.slice(0, 12).map((concept) => (
                    <article
                      className="concept-card"
                      key={concept.id}
                    >
                      <span
                        className={`concept-badge ${
                          concept.repeatedMistakes
                            ? 'concept-repeated'
                            : 'concept-single'
                        }`}
                      >
                        {concept.repeatedMistakes
                          ? 'Repeated mistakes'
                          : 'One question to revisit'}
                      </span>

                      <h3>{concept.concept}</h3>
                      <p className="concept-document">
                        {concept.documentTitle}
                      </p>

                      <p className="concept-count">
                        <strong>{concept.incorrectQuestions}</strong>
                        {' of '}
                        {concept.reviewedQuestions}
                        {' reviewed questions answered incorrectly.'}
                      </p>

                      <div className="concept-suggestion">
                        <span>Try asking your notes</span>
                        <p>
                          What does this document say about{' '}
                          {concept.concept}?
                        </p>
                      </div>

                      <p className="concept-helper">
                        Select this document in Ask your notes,
                        then use the question above.
                      </p>

                      <a className="concept-link" href="#ask-notes">
                        Review with your notes
                        <span aria-hidden="true">↗</span>
                      </a>
                    </article>
                  ))}
                </div>
              )}

              {review.concepts.length > 12 && (
                <p className="concept-helper">
                  Showing the first 12 of {review.concepts.length}
                  {' concepts, prioritizing repeated mistakes.'}
                </p>
              )}

              <p className="concept-helper">
                Based on your latest {review.analyzedAttempts}
                {' saved '}
                {review.analyzedAttempts === 1 ? 'attempt' : 'attempts'}
                {' '}— up to {review.attemptLimit}. Only the latest
                answer to each question counts. Repeated mistakes
                require two different questions with the same
                concept label in the same document.
              </p>
            </>
          )}
        </>
      )}
    </section>
  )
}

export default ConceptReview