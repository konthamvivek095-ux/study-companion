import ConceptReview from './ConceptReview'
import PracticeHistory from './PracticeHistory'
import QuizPractice from './QuizPractice'
import { useState } from 'react'
import DocumentLibrary from './DocumentLibrary'
import AskNotes from './AskNotes'

function Dashboard({ user, onLogout }) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState('')
  const [practiceRevision, setPracticeRevision] = useState(0)

  async function handleLogout() {
    setIsLoggingOut(true)
    setError('')

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Logout failed')
      }

      onLogout()
    } catch {
      setError('Could not log out. Please try again.')
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <a className="brand" href="#" aria-label="Study Companion home">
          <span className="brand-mark" aria-hidden="true">
            s.
          </span>
          <span>study companion</span>
        </a>

        <button
          className="primary-button dashboard-logout"
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">YOUR LEARNING SPACE</p>

          <h1>
            Welcome back,
            <br />
            <span>{user.name}.</span>
          </h1>

          <p className="hero-description">
            Bring your notes. Build your understanding, one concept at a time.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#documents">
              Add your first notes <span aria-hidden="true">↓</span>
            </a>
          </div>

          <p className="dashboard-error" role="status">
            {error}
          </p>
        </section>

        <DocumentLibrary onSessionExpired={onLogout} />
        <AskNotes onSessionExpired={onLogout} />
        <QuizPractice
  onSessionExpired={onLogout}
  onAttemptSaved={() =>
    setPracticeRevision((revision) => revision + 1)
  }
/>

<PracticeHistory
  onSessionExpired={onLogout}
  refreshKey={practiceRevision}
/>
<ConceptReview
  onSessionExpired={onLogout}
  refreshKey={practiceRevision}
/>


        <section className="features-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">YOUR NEXT STEPS</p>
              <h2>Turn your notes into understanding.</h2>
            </div>
          </div>

          <div className="feature-grid">
            <article className="feature-card">
              <span className="feature-number">01</span>
              <h3>Ask your notes</h3>
                <p>
                Choose a document above and ask questions with source passages
                you can check.
         </p>
              <span className="feature-label">
                Questions and answers
              </span>
            </article>

            <article className="feature-card">
              <span className="feature-number">02</span>
              <h3>Your practice</h3>
              <p>
                Your quizzes and practice results will appear here.
              </p>
              <span className="feature-label">
                Practice history
              </span>
            </article>

            <article className="feature-card">
              <span className="feature-number">03</span>
              <h3>Concepts to revisit</h3>
              <p>
                Track misunderstandings and revisit them as you learn.
              </p>
              <span className="feature-label">
                Misconception Detective
              </span>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>Study Companion</span>
        <span>Built around the way you learn.</span>
      </footer>
    </div>
  )
}

export default Dashboard