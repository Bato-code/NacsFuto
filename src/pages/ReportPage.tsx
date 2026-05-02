import { useState } from 'react'
import { Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

const CATEGORIES = ['General Feedback', 'Complaint', 'Security Concern', 'Academic Issue', 'Misconduct', 'Suggestion', 'Other']

export default function ReportPage() {
  const { user, profile } = useAuth()
  const [category, setCategory] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [includeContact, setIncludeContact] = useState(false)
  const [contactInfo, setContactInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!user) return
    if (!category) { setError('Please select a category'); return }
    if (!subject.trim()) { setError('Please enter a subject'); return }
    if (!message.trim()) { setError('Please enter your message'); return }
    setLoading(true); setError('')
    const { error } = await supabase.from('anonymous_reports').insert({
      category, subject: subject.trim(), message: message.trim(),
      contact_info: includeContact ? contactInfo : null,
      status: 'pending', submitter_id: user.id
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <CheckCircle className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Report Submitted</h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Your report has been submitted and will be reviewed by authorized personnel.
        </p>
        <button onClick={() => { setSuccess(false); setCategory(''); setSubject(''); setMessage(''); setContactInfo('') }}
          className="cyber-btn mt-6">Submit Another Report</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-center mb-4"><span className="terminal-badge">💬 ./report</span></div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        Anonymous <span style={{ color: 'var(--accent)' }}>Report</span>
      </h1>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Submit anonymous feedback, reports, or suggestions to help improve our association.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Privacy card */}
        <div className="glass-card p-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <Shield className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Your Privacy Matters</h3>
          <ul className="space-y-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {[
              'All reports are completely anonymous unless you choose to include your contact information.',
              'Reports are reviewed by authorized personnel only.',
              'We take all reports seriously and investigate appropriately.',
              'No IP addresses or identifying information are stored.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span style={{ color: 'var(--accent)' }} className="mt-0.5 shrink-0">●</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="rounded-lg p-3 mt-4" style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--accent)' }}>Note:</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              If you wish, you can include your name or contact information in the message for follow-up purposes.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2 glass-card p-5 sm:p-6">
          {!user ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <Shield className="w-12 h-12 mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
              <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Sign In Required</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>You must be signed in to submit a report.</p>
              <Link to="/login" className="cyber-btn">Sign In to Report</Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert-error mb-4">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Category <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select className="cyber-select" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Subject <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input className="cyber-input" placeholder="Brief description of the issue or topic"
                    value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>
                    Message <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea className="cyber-input resize-none h-32"
                    placeholder="Provide detailed information about your report, complaint, or suggestion..."
                    value={message} onChange={e => setMessage(e.target.value)} />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={includeContact} onChange={e => setIncludeContact(e.target.checked)}
                      className="w-4 h-4 accent-sky-400" />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Include contact information for follow-up (optional)
                    </span>
                  </label>
                  {includeContact && (
                    <input className="cyber-input mt-2" placeholder="Your name or email for follow-up"
                      value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
                  )}
                </div>
                <button onClick={handleSubmit} disabled={loading} className="cyber-btn w-full">
                  <Shield className="w-4 h-4" />
                  {loading ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
