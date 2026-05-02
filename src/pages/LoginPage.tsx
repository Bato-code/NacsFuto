import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true); setError('')
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error.message); return }
    // Redirect back — works for /election too
    navigate(redirectTo)
  }

  const comingFromElection = redirectTo === '/election'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full border-2 overflow-hidden mx-auto mb-3"
            style={{ borderColor: 'var(--accent)' }}>
            <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome Back</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {comingFromElection
              ? 'Sign in to access the NACSFUTO Election portal'
              : 'Sign in to your NACS FUTO account'}
          </p>
        </div>

        {/* Election redirect notice */}
        {comingFromElection && (
          <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--accent)' }}>🗳️ Election Login</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              You'll be redirected back to the election portal after signing in.
            </p>
          </div>
        )}

        <div className="glass-card p-5 sm:p-6">
          {error && (
            <div className="alert-error mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input className="cyber-input pl-10" type="email" placeholder="your.email@example.com"
                  value={email} onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
                <input className="cyber-input pl-10 pr-10" type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
                <button onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button onClick={handleLogin} disabled={loading} className="cyber-btn w-full mt-4">
            <Lock className="w-4 h-4" />
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          <div className="rounded-lg p-3 mt-4"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>For Students:</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Create your account via signup, then sign in with your{' '}
              <span style={{ color: 'var(--accent)' }}>email</span> and{' '}
              <span style={{ color: 'var(--accent)' }}>password</span>.<br />
              Use your verified FUTO matriculation number to register.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 mt-4">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Don't have an account?{' '}
              <Link to={`/signup${comingFromElection ? '?redirect=/election' : ''}`}
                style={{ color: 'var(--accent)' }} className="hover:underline">
                Sign up here
              </Link>
            </p>
            <button className="text-xs hover:underline" style={{ color: 'var(--text-muted)' }}>
              Forgot your password?
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          🔒 Secure login protected by encryption
        </p>
      </div>
    </div>
  )
}
