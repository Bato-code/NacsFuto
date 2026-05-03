import { useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, User, Lock, Mail, CheckCircle, AlertCircle, Eye, EyeOff, AtSign } from 'lucide-react'
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
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [usernameLoading, setUsernameLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken'>('idle')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Debounce timer for username live-check
  const usernameTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── STEP 1: Verify matric number ──────────────────────────────────────────
  const verifyMatric = async () => {
    if (!matric.trim()) {
      setError('Please enter your matriculation number')
      return
    }
    setLoading(true)
    setError('')

    // 1. Must be on the whitelist
    const { data: whitelist } = await supabase
      .from('whitelisted_matric_numbers')
      .select('matric_number')
      .eq('matric_number', matric.trim())
      .eq('is_active', true)
      .maybeSingle()

    if (!whitelist) {
      setLoading(false)
      setError('Matric number not found or not eligible. Contact your admin.')
      return
    }

    // 2. FIX: Block if matric number already registered in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('matric_number', matric.trim())
      .maybeSingle()

    if (existingUser) {
      setLoading(false)
      setError('This registration number is already linked to an existing account. Please log in instead.')
      return
    }

    // 3. Also check profiles table as a safety net
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('matric_number', matric.trim())
      .maybeSingle()

    if (existingProfile) {
      setLoading(false)
      setError('This registration number is already linked to an existing account. Please log in instead.')
      return
    }

    setLoading(false)
    setStep(2)
  }

  // ─── Username live check — debounced 400ms, case-insensitive ───────────────
  const checkUsername = (val: string) => {
    setUsername(val)
    setUsernameStatus('idle')

    if (usernameTimer.current) clearTimeout(usernameTimer.current)
    if (!val.trim() || val.length < 3) return

    usernameTimer.current = setTimeout(async () => {
      setUsernameLoading(true)
      // Check both tables — users for new accounts, profiles for older accounts
      const [{ data: inUsers }, { data: inProfiles }] = await Promise.all([
        supabase.from('users').select('id').ilike('username', val.trim()).maybeSingle(),
        supabase.from('profiles').select('id').ilike('username', val.trim()).maybeSingle(),
      ])
      setUsernameLoading(false)
      setUsernameStatus((inUsers || inProfiles) ? 'taken' : 'available')
    }, 400)
  }

  // ─── STEP 2: Create account ─────────────────────────────────────────────────
  const handleSignUp = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !password) {
      setError('All fields are required')
      return
    }
    if (usernameStatus === 'taken') {
      setError('Username is already taken. Please choose a different one.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    // FIX: Check for duplicate email — one email per account
    const { data: emailCheck } = await supabase
      .from('users')
      .select('id')
      .ilike('email', email.trim())
      .maybeSingle()

    if (emailCheck) {
      setLoading(false)
      setError('This email address is already linked to an existing account. Please use a different email.')
      return
    }

    // FIX: Final username guard — check both tables, catches race conditions
    const [{ data: userCheck }, { data: profileCheck }] = await Promise.all([
      supabase.from('users').select('id').ilike('username', username.trim()).maybeSingle(),
      supabase.from('profiles').select('id').ilike('username', username.trim()).maybeSingle(),
    ])

    if (userCheck || profileCheck) {
      setLoading(false)
      setUsernameStatus('taken')
      setError('This username is already taken. Please choose a different one.')
      return
    }

    const { error } = await signUp(
      email.trim(),
      password,
      name.trim(),
      matric.trim(),
      username.trim().toLowerCase()
    )

    setLoading(false)

    if (error) {
      const msg = error.message?.toLowerCase() ?? ''
      if (
        msg.includes('already registered') ||
        msg.includes('already been registered') ||
        msg.includes('user already registered') ||
        msg.includes('email address is already')
      ) {
        setError('This email address is already linked to an existing account. Please use a different email.')
      } else {
        setError(error.message)
      }
      return
    }

    setSuccess(true)
  }

  // ─── Success screen ─────────────────────────────────────────────────────────
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

  // ─── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full border-2 overflow-hidden mx-auto mb-3" style={{ borderColor: 'var(--accent)' }}>
            <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Join NACS FUTO</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create your student account</p>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-3 mt-4">
            {[1, 2].map((s, i) => (
              <div key={s} className="flex items-center gap-1.5">
                {i > 0 && (
                  <div className="w-8 h-px" style={{ background: step >= s ? 'var(--accent)' : 'var(--border)' }} />
                )}
                <div className="flex items-center gap-1.5" style={{ color: step >= s ? 'var(--accent)' : 'var(--text-muted)' }}>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
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
          {/* Error banner */}
          {error && (
            <div className="alert-error mb-4">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 1: Matric verification ── */}
          {step === 1 ? (
            <div>
              <h3 className="font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>Verify Your Identity</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                Enter your FUTO matriculation number to get started
              </p>
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                Matriculation Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div className="input-icon-wrap mb-4">
                <User className="input-icon" />
                <input
                  className="cyber-input"
                  placeholder="e.g., 20251234567"
                  value={matric}
                  onChange={e => setMatric(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyMatric()}
                />
              </div>
              <button onClick={verifyMatric} disabled={loading} className="cyber-btn w-full">
                {loading
                  ? 'Verifying...'
                  : <><span>Verify & Continue</span><ArrowRight className="w-4 h-4" /></>
                }
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
            /* ── STEP 2: Account details ── */
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
                    <input
                      className="cyber-input"
                      type="text"
                      placeholder="Your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Username — live uniqueness check */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Username <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap relative">
                    <AtSign className="input-icon" />
                    <input
                      className="cyber-input"
                      type="text"
                      placeholder="Choose a unique username"
                      value={username}
                      onChange={e => checkUsername(e.target.value)}
                      style={{
                        paddingRight: '5rem',
                        borderColor:
                          usernameStatus === 'taken' ? '#ef4444'
                          : usernameStatus === 'available' ? '#10b981'
                          : undefined,
                      }}
                    />
                    {usernameLoading && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div
                          className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
                        />
                      </span>
                    )}
                    {!usernameLoading && usernameStatus === 'available' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#10b981' }}>
                        ✓ Free
                      </span>
                    )}
                    {!usernameLoading && usernameStatus === 'taken' && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: '#ef4444' }}>
                        ✗ Taken
                      </span>
                    )}
                  </div>
                  {usernameStatus === 'taken' && (
                    <p className="text-xs mt-1" style={{ color: '#ef4444' }}>
                      This username is already taken. Please choose a different one.
                    </p>
                  )}
                  {usernameStatus === 'available' && (
                    <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                      Username is available!
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
                    <input
                      className="cyber-input"
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap relative">
                    <Lock className="input-icon" />
                    <input
                      className="cyber-input"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div className="input-icon-wrap relative">
                    <Lock className="input-icon" />
                    <input
                      className="cyber-input"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      tabIndex={-1}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

              </div>

              <button
                onClick={handleSignUp}
                disabled={loading || usernameStatus === 'taken'}
                className="cyber-btn w-full mt-4">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <button
                onClick={() => { setStep(1); setError('') }}
                className="text-xs mt-2 hover:underline w-full text-center block"
                style={{ color: 'var(--text-muted)' }}>
                ← Back
              </button>
            </div>
          )}

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)' }} className="hover:underline">Sign in here</Link>
          </p>
        </div>

        <p className="text-center text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          🔒 Your information is encrypted and secure
        </p>
      </div>
    </div>
  )
}
