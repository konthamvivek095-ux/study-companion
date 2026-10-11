import { useState } from 'react'
import './SignupForm.css'

function LoginForm({ onLogin }) {
  const [feedback, setFeedback] = useState({
    type: 'idle',
    message: '',
  })

  const isSubmitting = feedback.type === 'loading'

  async function handleSubmit(event) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const email = formData.get('email').trim()
    const password = formData.get('password')

    setFeedback({
      type: 'loading',
      message: 'Signing you in…',
    })

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: data.message || 'Unable to log in.',
        })
        return
      }

      form.reset()

      setFeedback({
        type: 'success',
        message: `Welcome back, ${data.user.name}! You are logged in.`,
      })

      onLogin(data.user)
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not sign in. Please try again.',
      })
    }
  }

  return (
    <section className="signup-panel" id="login">
      <div className="signup-introduction">
        <p className="eyebrow">WELCOME BACK</p>

        <h2>Pick up where you left off.</h2>

        <p>
          Sign in to your account and continue building your understanding.
        </p>

        <span className="signup-note">
          Small steps. Clearer concepts. Steady progress.
        </span>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <h3>Log in</h3>

        <p className="signup-description">
          Use the details you registered with.
        </p>

        <fieldset disabled={isSubmitting}>
          <div className="form-field">
            <label htmlFor="login-email">Email address</label>

            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>

            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="signup-button" type="submit">
            {isSubmitting ? 'Signing in…' : 'Log in'}
            <span aria-hidden="true">↗</span>
          </button>
        </fieldset>

        <p
          className={`form-feedback feedback-${feedback.type}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {feedback.message}
        </p>

        <p className="signup-description">
          New here?{' '}
          <a className="text-link" href="#signup">
            Create an account
          </a>
        </p>
      </form>
    </section>
  )
}

export default LoginForm