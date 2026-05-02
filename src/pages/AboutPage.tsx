import { useState } from 'react'
import { MapPin, Clock, Mail, Target, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AboutPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) { setError('Please fill in all fields'); return }
    setSending(true); setError('')
    const { error } = await supabase.from('contact_messages').insert({ ...form, status: 'unread' })
    setSending(false)
    if (error) { setError(error.message); return }
    setSent(true)
    setForm({ name: '', email: '', subject: '', message: '' })
    setTimeout(() => setSent(false), 5000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-center mb-4"><span className="terminal-badge">🔵 ./about</span></div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        About <span style={{ color: 'var(--accent)' }}>Us</span>
      </h1>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Learn more about our department, mission, and how to get in touch with us.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Left column */}
        <div className="space-y-5">
          {/* Logo card */}
          <div className="glass-card p-6 flex items-center justify-center" style={{ minHeight: 200 }}>
            <div className="text-center">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 overflow-hidden mx-auto mb-3 nacs-logo-glow"
                style={{ borderColor: 'var(--accent)' }}>
                <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
              </div>
              <div className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>NACS FUTO</div>
              <div className="text-sm font-mono" style={{ color: 'var(--accent)' }}>Securing Tomorrow</div>
            </div>
          </div>

          {/* Association text */}
          <div className="glass-card p-5">
            <div className="w-8 h-8 rounded-full border flex items-center justify-center mb-3"
              style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-dim)' }}>
              <Target className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>Our Association</h3>
            <div className="text-sm space-y-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <p>The National Association of Cyber Security Students (NACS) at FUTO is dedicated to raising skilled, confident, and innovative cybersecurity professionals.</p>
              <p>Through lectures, hands-on labs, tutorials, and research projects, we train students to solve real-world digital problems. Every member of the association is part of a growing network where support, community, and academic excellence go together.</p>
              <p>Our student body leads educational events, tech talks, excursions, and student-driven innovation through collaborative learning and peer support.</p>
              <p>Whether you're starting out or preparing for your final project, this association is built to support your journey.</p>
            </div>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: 'Our Mission', text: 'We provide a space where every student is empowered to explore cybersecurity, connect with others, and build real-world skills. We focus on growth through seminars, mentorship, hands-on events, and open collaboration with academic and industry mentors.' },
              { title: 'Our Vision', text: 'We see a future where our students lead in building a safer digital world — not only as experts, but as responsible innovators. From FUTO to the world, we are shaping the next generation of cyber defenders, ethical hackers, and change-makers.' },
            ].map(({ title, text }) => (
              <div key={title} className="glass-card p-4">
                <div className="w-8 h-8 rounded-full overflow-hidden border mb-2" style={{ borderColor: 'var(--accent-border)' }}>
                  <img src="/nacs-logo.jpeg" alt="NACS" className="w-full h-full object-cover" />
                </div>
                <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{text}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="glass-card p-5">
            <h4 className="font-semibold text-sm mb-4 text-center" style={{ color: 'var(--text-primary)' }}>Association Statistics</h4>
            <div className="grid grid-cols-3 gap-3">
              {[['1000+', 'STUDENTS'], ['100+', 'PROJECTS'], ['5+', 'YEARS']].map(([num, label]) => (
                <div key={label} className="text-center rounded-lg p-3" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
                  <div className="font-bold text-lg sm:text-xl font-mono" style={{ color: 'var(--accent)' }}>{num}</div>
                  <div className="text-xs tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
                  <div className="w-8 h-0.5 mx-auto mt-2" style={{ background: 'var(--accent-border)' }} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Contact info */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>Contact Information</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="font-medium text-xs mb-0.5" style={{ color: 'var(--text-primary)' }}>Address</div>
                  NACS FUTO<br />Federal University of Technology<br />P.M.B. 1526, Owerri<br />Imo State, Nigeria
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <div className="font-medium text-xs mb-0.5" style={{ color: 'var(--text-primary)' }}>School Hours</div>
                  Monday - Friday: 8:00 AM – 6:00 PM
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="glass-card p-5">
            <h3 className="font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Send us a Message</h3>
            {sent && (
              <div className="alert-success mb-4">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Message sent successfully!</span>
              </div>
            )}
            {error && (
              <div className="alert-error mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Name</label>
                  <input className="cyber-input" placeholder="Your full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
                  <input className="cyber-input" type="email" placeholder="your.email@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Subject</label>
                <input className="cyber-input" placeholder="Message subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Message</label>
                <textarea className="cyber-input resize-none h-28" placeholder="Your message..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
              </div>
              <button onClick={handleSend} disabled={sending} className="cyber-btn w-full">
                <Mail className="w-4 h-4" />
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
