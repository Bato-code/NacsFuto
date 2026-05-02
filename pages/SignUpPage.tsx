import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, User, Lock, Mail, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function SignUpPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const { signUp } = useAuth()
  const [step, setStep] = useState(1)
  const [matric, setMatric] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Username availability state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const usernameTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check username availability with debounce
  useEffect(() => {
    if (!username.trim() || username.length < 3) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    if (usernameTimeout.current) clearTimeout(usernameTimeout.current)
    usernameTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('username', username.trim().toLowerCase())
        .maybeSingle()
      setUsernameStatus(data ? 'taken' : 'available')
    }, 600)
    return () => { if (usernameTimeout.current) clearTimeout(usernameTimeout.current) }
  }, [username])

  const verifyMatric = async () => {
    if (!matric.trim()) { setError('Please enter your matriculation number'); return }
    setLoading(true); setError('')

    // Check whitelist
    const { data: whitelisted } = await supabase
      .from('whitelisted_matric_numbers')
      .select('*')
      .eq('matric_number', matric.trim())
      .eq('is_active', true)
      .single()

    if (!whitelisted) {
      setLoading(false)
      setError('Matric number not found or not eligible. Contact your admin.')
      return
    }

    // Check if already registered — specific message
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('matric_number', matric.trim())
      .maybeSingle()

    setLoading(false)

    if (existing) {
      setError('This registration number has already been used to create an account. Please contact the admin if you believe this is an error.')
      return
    }

    setStep(2)
  }

  const handleSignUp = async () => {
    if (!name || !email || !username || !password) { setError('All fields are required'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (username.length < 3) { setError('Username must be at least 3 characters'); return }
    if (usernameStatus === 'taken') { setError('That username is already taken. Please choose another.'); return }
    if (usernameStatus === 'checking') { setError('Please wait while we check username availability.'); return }

    setLoading(true); setError('')

    // Check if email already used
    const { data: emailExists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .maybeSingle()

    if (emailExists) {
      setLoading(false)
      setError('This email address is already registered. Please use a different email or sign in.')
      return
    }

    const { error } = await signUp(email, password, name, matric, username.trim().toLowerCase())
    setLoading(false)
    if (error) {
      if (error.message?.toLowerCase().includes('already registered') || error.message?.toLowerCase().includes('already been registered')) {
        setError('This email address is already registered. Please use a different email or sign in.')
      } else {
        setError(error.message)
      }
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Registration Successful!</h2>
          <div className="rounded-lg p-4 mb-6 text-left" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <p className="text-sm font-bold mb-1" style={{ color: 'var(--accent)' }}>📧 Check Your Email</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              A confirmation link has been sent to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.<br />
              Please verify your email before logging in. Check your spam folder if you don't see it.
            </p>
          </div>
          <Link to="/login" className="cyber-btn w-full justify-center">Go to Login</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full border-2 overflow-hidden mx-auto mb-3"
            style={{ borderColor: 'var(--accent)' }}>
            <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Join NACS FUTO</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create your student account</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            {[1, 2].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                {i > 0 && <div className="w-8 h-px" style={{ background: step >= s ? 'var(--accent)' : 'var(--border)' }} />}
                <div className="flex items-center gap-1.5" style={{ color: step >= s ? 'var(--accent)' : 'var(--text-muted)' }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{
                      background: step >= s ? 'var(--accent)' : 'transparent',
                      border: `1px solid ${step >= s ? 'var(--accent)' : 'var(--border)'}`,
                      color: step >= s ? '#fff' : 'var(--text-muted)',
                    }}>
                    {s}
                  </div>
                  <span className="text-xs font-medium">{s === 1 ? 'Verify' : 'Account'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5 sm:p-6">
          {error && (
            <div className="alert-error mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Verify Your Identity</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Enter your FUTO matriculation number to get started</p>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Matriculation Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="input-icon-wrap mb-4">
                <User className="input-icon" />
                <input className="cyber-input" placeholder="e.g., 20251234567"
                  value={matric} onChange={e => setMatric(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyMatric()} />
              </div>
              <button onClick={verifyMatric} disabled={loading} className="cyber-btn w-full">
                {loading ? 'Verifying...' : <><span>Verify & Continue</span><ArrowRight className="w-4 h-4" /></>}
              </button>
              <div className="rounded-lg p-3 mt-4" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>Why do we need this?</p>
                <ul className="text-xs space-y-0.5" style={{ color: 'var(--text-secondary)' }}>
                  <li>• Verify you're a current FUTO student</li>
                  <li>• Ensure account security and authenticity</li>
                  <li>• Maintain association membership standards</li>
                </ul>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Create Account</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Matric: <span className="font-mono" style={{ color: 'var(--accent)' }}>{matric}</span> ✓
              </p>
              <div className="space-y-3">

                {/* Full Name */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <User className="input-icon" />
                    <input className="cyber-input" type="text" placeholder="Your full name"
                      value={name} onChange={e => setName(e.target.value)} />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }} className="input-icon-wrap">
                    <User className="input-icon" />
                    <input
                      className="cyber-input"
                      type="text"
                      placeholder="Choose a unique username"
                      value={username}
                      style={{ paddingRight: '90px' }}
                      onChange={e => setUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                    />
                    {usernameStatus !== 'idle' && (
                      <span style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        fontSize: '11px', fontWeight: 600, pointerEvents: 'none',
                        color: usernameStatus === 'available' ? '#10b981' : usernameStatus === 'taken' ? '#ef4444' : 'var(--text-muted)'
                      }}>
                        {usernameStatus === 'checking' ? 'Checking...' : usernameStatus === 'available' ? '✓ Available' : '✗ Taken'}
                      </span>
                    )}
                  </div>
                  {usernameStatus === 'taken' && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                      This username is already taken. Please choose a different one.
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Email Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap">
                    <Mail className="input-icon" />
                    <input className="cyber-input" type="email" placeholder="your.email@example.com"
                      value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap" style={{ position: 'relative' }}>
                    <Lock className="input-icon" />
                    <input className="cyber-input" type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password" value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap" style={{ position: 'relative' }}>
                    <Lock className="input-icon" />
                    <input className="cyber-input" type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password" value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '40px' }} />
                    <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, display: 'flex' }}>
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>

              <button
                onClick={handleSignUp}
                disabled={loading || usernameStatus === 'taken' || usernameStatus === 'checking'}
                className="cyber-btn w-full mt-4">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
              <button onClick={() => { setStep(1); setError('') }}
                className="text-xs mt-2 hover:underline w-full text-center block" style={{ color: 'var(--text-muted)' }}>
                ← Back
              </button>
            </div>
          )}

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)' }} className="hover:underline">Sign in here</Link>
          </p>
        </div>
        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>🔒 Your information is encrypted and secure</p>
      </div>
    </div>
  )
}
