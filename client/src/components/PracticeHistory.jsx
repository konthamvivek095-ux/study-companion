import { useEffect, useState } from 'react'
import './PracticeHistory.css'

function PracticeHistory({ onSessionExpired, refreshKey = 0 }) {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadHistory() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/quizzes/attempts', {
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
            data.message || 'Unable to load practice history.'
          )
        }

        if (active) setAttempts(data.attempts)
      } catch (requestError) {
        if (!active) return

        setError(
          requestError.name === 'TimeoutError'
            ? 'Loading took too long. Please refresh your history.'
            : 'Could not load practice history. Please try again.'
        )
      } finally {
        if (active) setLoading(false)
      }
    }

    loadHistory()

    return () => {
      active = false
    }
  }, [onSessionExpired, refreshKey, refreshCount])

  return (
    <section className="history-section" id="practice-history">
      <div className="section-heading">
        <div>
          <p className="eyebrow">KEEP TRACK OF YOUR PRACTICE</p>
          <h2>Your recent attempts</h2>
        </div>

        <button
          className="history-refresh"
          type="button"
          disabled={loading}
          onClick={() => setRefreshCount((count) => count + 1)}
        >
          {loading ? 'Loading…' : 'Refresh history'}
        </button>
      </div>

      {loading && (
        <p className="history-helper" role="status">
          Loading your saved attempts…
        </p>
      )}

      {error && (
        <p className="history-error" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && attempts.length === 0 && (
        <div className="history-empty">
          <h3>Your first attempt starts here.</h3>
          <p>
            Complete a quiz above to save your score and begin
            tracking your progress.
          </p>
        </div>
      )}

      {!loading && !error && attempts.length > 0 && (
        <>
          <p className="history-helper">
            Your latest {attempts.length} saved{' '}
            {attempts.length === 1 ? 'attempt' : 'attempts'},
            with the most recent first.
          </p>

          <ul className="history-list">
            {attempts.map((attempt) => (
              <li className="history-item" key={attempt.id}>
                <div>
                  <h3>{attempt.documentTitle}</h3>

                  <time dateTime={attempt.completedAt}>
                    {new Date(attempt.completedAt).toLocaleString(
                      undefined,
                      {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      }
                    )}
                  </time>
                </div>

                <div className="history-score">
                  <strong>{attempt.percentage}%</strong>
                  <span>
                    {attempt.score}/{attempt.totalQuestions} correct
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default PracticeHistory