import { useState } from 'react'
import './SignupForm.css'

function SignupForm() {
  const [feedback, setFeedback] = useState({
    type: 'idle',
    message: '',
  })

  const isSubmitting = feedback.type === 'loading'

  async function handleSubmit(event) {
    event.preventDefault()

    const form = event.currentTarget
    const formData = new FormData(form)

    const name = formData.get('name').trim()
    const email = formData.get('email').trim()
    const password = formData.get('password')

    if (new TextEncoder().encode(password).length > 72) {
      setFeedback({
        type: 'error',
        message: 'Your password must be at most 72 bytes.',
      })
      return
    }

    setFeedback({
      type: 'loading',
      message: 'Creating your account…',
    })

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setFeedback({
          type: 'error',
          message: data.message || 'Unable to create your account.',
        })
        return
      }

      form.reset()

      setFeedback({
        type: 'success',
        message: 'Account created successfully. Login is our next step!',
      })
    } catch {
      setFeedback({
        type: 'error',
        message: 'Could not reach the server. Please try again.',
      })
    }
  }

  return (
    <section className="signup-panel" id="signup">
      <div className="signup-introduction">
        <p className="eyebrow">YOUR NEXT CHAPTER</p>
        <h2>Make room for better learning.</h2>
        <p>
          Create your account to start building your personal study space.
        </p>
        <span className="signup-note">
          One place for your notes, practice, and progress.
        </span>
      </div>

      <form className="signup-form" onSubmit={handleSubmit}>
        <h3>Create an account</h3>
        <p className="signup-description">
          Start with a few simple details.
        </p>

        <fieldset disabled={isSubmitting}>
          <div className="form-field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Your name"
              autoComplete="name"
              minLength={2}
              maxLength={80}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="signup-email">Email address</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              minLength={12}
              maxLength={72}
              aria-describedby="password-help"
              required
            />
            <p className="field-help" id="password-help">
              Use at least 12 characters. Maximum 72 bytes.
            </p>
          </div>

          <button className="signup-button" type="submit">
            {isSubmitting ? 'Creating account…' : 'Create account'}
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
      </form>
    </section>
  )
}

export default SignupForm