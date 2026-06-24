import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp, signInWithGoogle, configured } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(name.trim() || 'Learner', email, password)
      else await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setError(null)
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col justify-center px-5 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-xl text-[#f4efe4]">
          ✦
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink">Brilliant</h1>
        <p className="mt-1 text-ink-soft">Learn physics by doing. Start with projectile motion.</p>
      </div>

      {!configured && (
        <div className="mb-5 rounded-xl border border-streak/40 bg-brand-tint p-3 text-sm text-brand-strong">
          Firebase is not configured yet. Add your keys to a <code>.env</code> file (see
          <code> .env.example</code>) and restart the dev server to enable sign in.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 rounded-xl border border-line bg-surface-2 p-1">
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-ink text-[#f4efe4]' : 'text-ink-soft'}`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => setMode('signin')}
          className={`rounded-lg py-2 text-sm font-semibold transition ${mode === 'signin' ? 'bg-ink text-[#f4efe4]' : 'text-ink-soft'}`}
        >
          Log in
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-brand"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-brand"
        />
        <input
          type="password"
          placeholder="Password (6+ characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none transition focus:border-brand"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button type="submit" disabled={busy || !configured} className="btn-primary w-full py-3">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-ink-mute">
        <div className="h-px flex-1 bg-line" />
        OR
        <div className="h-px flex-1 bg-line" />
      </div>

      <button
        type="button"
        onClick={google}
        disabled={busy || !configured}
        className="w-full rounded-xl border border-line bg-surface py-3 font-semibold text-ink transition enabled:hover:border-brand/50 disabled:opacity-40"
      >
        Continue with Google
      </button>
    </div>
  )
}

function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.'
    case 'auth/email-already-in-use':
      return 'That email already has an account. Try logging in.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}
