'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CircleAlert, CircleCheck } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { forgotPassword, login, signup } from './actions'

type AuthMode = 'login' | 'signup' | 'forgot'

function SubmitButton({
  idleLabel,
  loadingLabel,
  className,
}: {
  idleLabel: string
  loadingLabel: string
  className: string
}) {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingLabel}
        </>
      ) : (
        idleLabel
      )}
    </button>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const queryMode = searchParams.get('mode')
  const initialMode: AuthMode =
    queryMode === 'signup' || queryMode === 'forgot' || queryMode === 'login' ? queryMode : 'login'

  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [fieldErrors, setFieldErrors] = useState<{ displayName?: string; phone?: string; email?: string; password?: string }>({})
  const [clientMessage, setClientMessage] = useState<string | null>(null)

  const queryError = searchParams.get('error')
  const queryMessage = searchParams.get('message')
  const querySuccess = searchParams.get('success')

  const title = mode === 'login' ? 'Log into Wealth AI' : mode === 'signup' ? 'Create your account' : 'Forgot password'
  const submitLabel = mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create new account' : 'Send reset link'

  const switchMode = (nextMode: AuthMode) => {
    if (nextMode === mode) return
    setFieldErrors({})
    setClientMessage(null)
    setMode(nextMode)
  }

  const validate = (formData: FormData) => {
    const displayName = String(formData.get('display_name') ?? '').trim()
    const phone = String(formData.get('phone_number') ?? '').trim()
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')
    const nextErrors: { displayName?: string; phone?: string; email?: string; password?: string } = {}

    if (mode === 'signup') {
      if (!displayName) {
        nextErrors.displayName = 'Display name is required.'
      } else if (displayName.length > 50) {
        nextErrors.displayName = 'Display name must be 50 characters or fewer.'
      }

      if (!phone) {
        nextErrors.phone = 'Phone number is required.'
      } else if (!/^(\+?60|0)1[0-9][\s-]?\d{7,8}$/.test(phone.replace(/\s/g, ''))) {
        nextErrors.phone = 'Enter a valid Malaysian number (e.g. 012-3456789).'
      }
    }

    if (!email) {
      nextErrors.email = 'Email is required.'
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.'
    }

    if (mode !== 'forgot') {
      if (!password) {
        nextErrors.password = 'Password is required.'
      } else if (password.length < 12) {
        nextErrors.password = 'Password must be at least 12 characters.'
      } else if (password.length > 128) {
        nextErrors.password = 'Password must be no more than 128 characters.'
      }
    }

    setFieldErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setClientMessage('Please correct the highlighted fields.')
      return false
    }

    setClientMessage(null)
    return true
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget)
    if (!validate(formData)) {
      event.preventDefault()
    }
  }

  const formAction = mode === 'login' ? login : mode === 'signup' ? signup : forgotPassword

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{title}</h1>
          <p className="auth-subtitle">Use your credentials to access your finance dashboard.</p>
        </div>
        <div key={mode} className="auth-mode-content">
          <form action={formAction} onSubmit={handleSubmit} className="auth-form">
            <input type="hidden" name="mode" value={mode} />

            {(queryError || queryMessage || querySuccess || clientMessage) && (
              <div className="auth-alert-stack" aria-live="polite">
                {(queryError || clientMessage) && (
                  <div className="auth-alert auth-alert-error" role="alert">
                    <CircleAlert className="h-4 w-4" />
                    {queryError ?? clientMessage}
                  </div>
                )}
                {queryMessage && (
                  <div className="auth-alert auth-alert-info" role="status">
                    <CircleCheck className="h-4 w-4" />
                    {queryMessage}
                  </div>
                )}
                {querySuccess && (
                  <div className="auth-alert auth-alert-success" role="status">
                    <CircleCheck className="h-4 w-4" />
                    {querySuccess}
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <>
                <div>
                  <label htmlFor="display_name" className="auth-label">
                    Display name
                  </label>
                  <input
                    id="display_name"
                    name="display_name"
                    type="text"
                    required
                    maxLength={50}
                    autoComplete="nickname"
                    placeholder="How should we call you?"
                    className={`auth-input ${fieldErrors.displayName ? 'auth-input-error' : ''}`}
                  />
                  {fieldErrors.displayName && <p className="auth-field-error">{fieldErrors.displayName}</p>}
                </div>

                <div>
                  <label htmlFor="phone_number" className="auth-label">
                    Phone number
                  </label>
                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="012-3456789"
                    className={`auth-input ${fieldErrors.phone ? 'auth-input-error' : ''}`}
                  />
                  {fieldErrors.phone && <p className="auth-field-error">{fieldErrors.phone}</p>}
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="auth-label">
                Mobile number, username or email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="Mobile number, username or email"
                className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
              />
              {fieldErrors.email && <p className="auth-field-error">{fieldErrors.email}</p>}
            </div>

            {mode !== 'forgot' && (
              <div>
                <label htmlFor="password" className="auth-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={12}
                  maxLength={128}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder="Password"
                  className={`auth-input ${fieldErrors.password ? 'auth-input-error' : ''}`}
                />
                {fieldErrors.password && <p className="auth-field-error">{fieldErrors.password}</p>}
              </div>
            )}

            <SubmitButton
              idleLabel={submitLabel}
              loadingLabel={mode === 'forgot' ? 'Sending...' : 'Loading...'}
              className="auth-primary-button"
            />
          </form>

          {mode !== 'signup' && (
            <div className="auth-links">
              {mode === 'login' && (
                <button type="button" className="auth-text-link" onClick={() => switchMode('forgot')}>
                  Forgot password?
                </button>
              )}
              {mode === 'forgot' && (
                <button type="button" className="auth-text-link" onClick={() => switchMode('login')}>
                  Back to log in
                </button>
              )}
            </div>
          )}

          {mode === 'login' ? (
            <button type="button" onClick={() => switchMode('signup')} className="auth-outline-button">
              Create new account
            </button>
          ) : mode === 'signup' ? (
            <button type="button" onClick={() => switchMode('login')} className="auth-outline-button">
              Already have an account? Log in
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="auth-screen">
      <Suspense
        fallback={
          <div className="auth-wrap">
            <div className="auth-card auth-loading-card">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  )
}
