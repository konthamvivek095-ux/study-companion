import { useEffect, useState } from 'react'
import SignupForm from './components/SignupForm'
import LoginForm from './components/LoginForm'
import Dashboard from './components/Dashboard'
import './App.css'

const features = [
  {
    number: '01',
    title: 'Ask your notes',
    description:
      'Find clear answers in your study materials, with references to the original pages.',
    label: 'Document questions',
  },
  {
    number: '02',
    title: 'Put knowledge into practice',
    description:
      'Turn your notes into focused quizzes and check how much you understand.',
    label: 'Practice quizzes',
  },
  {
    number: '03',
    title: 'Understand your mistakes',
    description:
      'Explain your reasoning, uncover possible misconceptions, and revisit the right concepts.',
    label: 'Misconception Detective',
  },
]

function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [user, setUser] = useState(null)
  const [sessionStatus, setSessionStatus] = useState('checking')

  useEffect(() => {
    const controller = new AbortController()

    async function checkBackend() {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Backend request failed')
        }

        const data = await response.json()

        setBackendStatus(data.status === 'ok' ? 'connected' : 'offline')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setBackendStatus('offline')
        }
      }
    }

    checkBackend()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function checkSession() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (response.status === 401) {
          setUser(null)
          setSessionStatus('ready')
          return
        }

        if (!response.ok) {
          throw new Error('Session check failed')
        }

        const data = await response.json()

        setUser(data.user)
        setSessionStatus('ready')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSessionStatus('error')
        }
      }
    }

    checkSession()

    return () => controller.abort()
  }, [])

  const statusLabel =
    backendStatus === 'checking'
      ? 'Connecting…'
      : backendStatus === 'connected'
        ? 'Backend connected'
        : 'Backend unavailable'

  if (sessionStatus === 'checking') {
    return (
      <div className="app">
        <main className="hero">
          <p className="eyebrow" role="status">
            Loading your study space…
          </p>
        </main>
      </div>
    )
  }

  if (sessionStatus === 'error') {
    return (
      <div className="app">
        <main className="hero">
          <h1>Connection interrupted.</h1>

          <p className="hero-description" role="alert">
            We couldn’t check your session. Please try again.
          </p>

          <button
            className="primary-button dashboard-logout"
            type="button"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </main>
      </div>
    )
  }

  if (user) {
    return (
      <Dashboard
        user={user}
        onLogout={() => setUser(null)}
      />
    )
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

        <nav className="navigation" aria-label="Main navigation">
          <a href="#features">Explore features</a>
          <a href="#login">Log in</a>

          <a className="nav-cta" href="#signup">
            Get started <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </header>

      <main>
        <section className="hero">
          <p className="eyebrow">
            <span className="status-dot" aria-hidden="true" />
            A little clarity. A deeper understanding.
          </p>

          <h1>
            Make sense of
            <br />
            <span>what you study.</span>
          </h1>

          <p className="hero-description">
            Bring your notes. Find answers, test your knowledge, and
            understand the mistakes that help you learn.
          </p>

          <div className="hero-actions">
            <a className="primary-button" href="#signup">
              Create your account <span aria-hidden="true">↗</span>
            </a>

            <a className="text-link" href="#features">
              See how it works <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="hero-caption">
            YOUR MATERIALS <span aria-hidden="true">/</span>
            YOUR PACE <span aria-hidden="true">/</span>
            YOUR PROGRESS
          </div>
        </section>

        <section className="features-section" id="features">
          <div className="section-heading">
            <div>
              <p className="eyebrow">BUILT FOR UNDERSTANDING</p>
              <h2>More than another set of notes.</h2>
            </div>

            <p>Three ways to move your learning forward.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.number}>
                <span className="feature-number">
                  {feature.number}
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <span className="feature-label">
                  {feature.label}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="workspace" id="workspace">
          <div className="workspace-symbol" aria-hidden="true">
            +
          </div>

          <div>
            <p className="eyebrow">YOUR WORKSPACE</p>
            <h2>A fresh space for your next subject.</h2>
            <p>
              This is where your documents and learning sessions will live.
              PDF uploads are coming as we build the next part.
            </p>
          </div>

          <span
            className={`workspace-tag status-${backendStatus}`}
            role="status"
          >
            {statusLabel}
          </span>
        </section>

        <SignupForm />
        <LoginForm onLogin={setUser} />
      </main>

      <footer className="footer">
        <span>Study Companion</span>
        <span>Built around the way you learn.</span>
      </footer>
    </div>
  )
}

export default App