import { useEffect, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { Users, Code, Lock, Plus, Edit2, Trash2, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import FileUploader from '../components/FileUploader'

// ─── Typing animation ──────────────────────────────────────────────────────
const TYPING_STRINGS = [
  'root@futo:~$ echo "creating a safer cyber space"',
  'root@futo:~$ echo "empowering the next generation"',
  'root@futo:~$ echo "securing tomorrow, today"',
]

function TypingText() {
  const [text, setText] = useState('')
  const [stringIdx, setStringIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const target = TYPING_STRINGS[stringIdx]
    if (paused) {
      const t = setTimeout(() => { setPaused(false); setDeleting(true) }, 2000)
      return () => clearTimeout(t)
    }
    if (deleting) {
      if (charIdx === 0) { setDeleting(false); setStringIdx(i => (i + 1) % TYPING_STRINGS.length); return }
      const t = setTimeout(() => { setCharIdx(i => i - 1); setText(target.slice(0, charIdx - 1)) }, 30)
      return () => clearTimeout(t)
    }
    if (charIdx < target.length) {
      const t = setTimeout(() => { setCharIdx(i => i + 1); setText(target.slice(0, charIdx + 1)) }, 60)
      return () => clearTimeout(t)
    } else { setPaused(true) }
  }, [charIdx, deleting, paused, stringIdx])

  return (
    <div className="inline-flex items-center rounded px-3 sm:px-4 py-2 font-mono text-xs sm:text-sm max-w-full overflow-hidden"
      style={{ background: 'var(--terminal-bg)', border: '1px solid var(--border)', color: 'var(--terminal-text)' }}>
      <span style={{ color: 'var(--accent)' }} className="mr-1 shrink-0">$</span>
      <span className="truncate">{text}</span>
      <span className="typing-cursor shrink-0" />
    </div>
  )
}

// ─── Count up ──────────────────────────────────────────────────────────────
function CountUp({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true })
  useEffect(() => {
    if (!inView) return
    const step = end / (2000 / 16)
    let current = 0
    const timer = setInterval(() => {
      current = Math.min(current + step, end)
      setCount(Math.floor(current))
      if (current >= end) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, end])
  return <span ref={ref} className="text-2xl sm:text-3xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{count.toLocaleString()}{suffix}</span>
}

// ─── Avatar ────────────────────────────────────────────────────────────────
function Avatar({ name, imageUrl, size = 56 }: { name: string; imageUrl?: string; size?: number }) {
  const [imgErr, setImgErr] = useState(false)
  const initials = (name || 'U').split(' ').filter(Boolean).slice(-2).map(n => n[0]).join('').toUpperCase()
  const colors = ['#0284c7', '#0891b2', '#0369a1', '#075985', '#1e40af', '#5b21b6']
  const color = colors[(name || '').charCodeAt(0) % colors.length]

  if (imageUrl && !imgErr) {
    return (
      <img src={imageUrl} alt={name} className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }} onError={() => setImgErr(true)} />
    )
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.3 }}>
      {initials}
    </div>
  )
}

// ─── Fixed Position Slots ──────────────────────────────────────────────────
const DEPT_POSITIONS = [
  { role: 'Head of Department', type: 'dept', sort_order: 1 },
  { role: 'Staff Adviser', type: 'dept', sort_order: 2 },
]

const EXECUTIVE_POSITIONS = [
  { role: 'President', type: 'executive', sort_order: 10 },
  { role: 'Vice President', type: 'executive', sort_order: 11 },
  { role: 'Secretary General', type: 'executive', sort_order: 12 },
  { role: 'Financial Secretary', type: 'executive', sort_order: 13 },
  { role: 'Assistant Secretary General', type: 'executive', sort_order: 14 },
  { role: 'Treasurer', type: 'executive', sort_order: 15 },
  { role: 'Director of Welfare', type: 'executive', sort_order: 16 },
  { role: 'Director of ICT & Research', type: 'executive', sort_order: 17 },
  { role: 'Director of Socials', type: 'executive', sort_order: 18 },
  { role: 'Director of Protocol (PRO)', type: 'executive', sort_order: 19 },
  { role: 'Director of Sports', type: 'executive', sort_order: 20 },
  { role: 'MSRC', type: 'executive', sort_order: 21 },
]

interface Leader {
  id: string; name: string; role: string; image_url?: string
  type: 'dept' | 'executive'; sort_order: number; highlight?: boolean
}

// ─── Modals ────────────────────────────────────────────────────────────────
function LeaderModal({ leader, fixedRole, fixedType, onClose, onSave }: {
  leader?: Leader; fixedRole?: string; fixedType?: string
  onClose: () => void; onSave: () => void
}) {
  const [form, setForm] = useState({
    name: leader?.name || '',
    role: leader?.role || fixedRole || '',
    image_url: leader?.image_url || '',
    type: leader?.type || fixedType || 'executive',
    sort_order: leader?.sort_order ?? 99,
    highlight: leader?.highlight ?? false,
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.name || !form.role) return
    setSaving(true)
    if (leader?.id) {
      await supabase.from('leadership').update(form).eq('id', leader.id)
    } else {
      await supabase.from('leadership').insert(form)
    }
    setSaving(false); onSave(); onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{leader ? 'Edit' : 'Add'} Member</h3>
          <button onClick={onClose} className="theme-toggle"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
            <input className="cyber-input" placeholder="Full name with title" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Role/Position</label>
            <input className="cyber-input" value={form.role}
              readOnly={!!fixedRole}
              style={fixedRole ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
              onChange={e => !fixedRole && setForm({ ...form, role: e.target.value })} />
          </div>
          <FileUploader
            label="Photo (upload file or paste URL)"
            value={form.image_url}
            onChange={url => setForm({ ...form, image_url: url })}
            accept="image/*"
            bucket="leadership-photos"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={handleSave} disabled={saving} className="cyber-btn flex-1">{saving ? 'Saving...' : 'Save'}</button>
          <button onClick={onClose} className="cyber-btn-ghost flex-1">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Dept Card (large/superior) ────────────────────────────────────────────
function DeptCard({ slot, leader, isAdmin, onEdit, onDelete }: {
  slot: typeof DEPT_POSITIONS[0]; leader?: Leader; isAdmin: boolean
  onEdit: (l?: Leader, role?: string, type?: string) => void
  onDelete: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="glass-card p-6 text-center relative"
      style={{
        width: 200,
        borderColor: hovered ? 'var(--accent-border)' : 'var(--border)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered ? '0 10px 40px var(--btn-shadow)' : 'none',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {hovered && <div className="exec-shimmer" />}
      <div className="flex justify-center mb-3">
        {leader
          ? <Avatar name={leader.name} imageUrl={leader.image_url} size={80} />
          : <div className="rounded-full border-2 border-dashed flex items-center justify-center"
              style={{ width: 80, height: 80, borderColor: 'var(--border)', background: 'var(--accent-dim)' }}>
              <span className="text-3xl opacity-40">👤</span>
            </div>
        }
      </div>
      <div className="font-semibold text-sm leading-tight mb-1"
        style={{ color: leader ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {leader?.name || 'Vacant'}
      </div>
      <div className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{slot.role}</div>
      {isAdmin && (
        <div className="flex justify-center gap-2 mt-3">
          <button onClick={() => onEdit(leader, slot.role, slot.type)}
            className="py-1 px-2 rounded text-xs border flex items-center gap-1"
            style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)' }}>
            <Edit2 className="w-3 h-3" />{leader ? 'Edit' : 'Add'}
          </button>
          {leader && (
            <button onClick={() => onDelete(leader.id)}
              className="py-1 px-1.5 rounded border"
              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Exec Card ────────────────────────────────────────────────────────────
function ExecCard({ slot, leader, isAdmin, onEdit, onDelete }: {
  slot: typeof EXECUTIVE_POSITIONS[0]; leader?: Leader; isAdmin: boolean
  onEdit: (l?: Leader, role?: string, type?: string) => void
  onDelete: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <div className="glass-card p-3 sm:p-4 text-center relative"
      style={{
        borderColor: hovered ? 'var(--accent-border)' : 'var(--border)',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? '0 6px 24px var(--btn-shadow)' : 'none',
        transition: 'all 0.25s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}>
      {hovered && <div className="exec-shimmer" />}
      <div className="flex justify-center mb-2">
        {leader
          ? <Avatar name={leader.name} imageUrl={leader.image_url} size={48} />
          : <div className="rounded-full border-2 border-dashed flex items-center justify-center"
              style={{ width: 48, height: 48, borderColor: 'var(--border)', background: 'var(--accent-dim)' }}>
              <span className="text-xl opacity-40">👤</span>
            </div>
        }
      </div>
      <div className="text-xs sm:text-sm font-semibold leading-tight mb-0.5"
        style={{ color: leader ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {leader?.name || 'Vacant'}
      </div>
      <div className="text-xs" style={{ color: 'var(--accent)' }}>{slot.role}</div>
      {isAdmin && (
        <div className="flex justify-center gap-1 mt-2">
          <button onClick={() => onEdit(leader, slot.role, slot.type)}
            className="py-0.5 px-1.5 rounded border flex items-center gap-0.5"
            style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)', fontSize: '10px' }}>
            <Edit2 className="w-2.5 h-2.5" />{leader ? 'Edit' : 'Add'}
          </button>
          {leader && (
            <button onClick={() => onDelete(leader.id)}
              className="py-0.5 px-1 rounded border"
              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const { isAdmin } = useAuth()
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [loadingLeaders, setLoadingLeaders] = useState(true)
  const [editModal, setEditModal] = useState<{ open: boolean; leader?: Leader; role?: string; type?: string }>({ open: false })

  useEffect(() => { fetchLeaders() }, [])

  const fetchLeaders = async () => {
    setLoadingLeaders(true)
    const { data } = await supabase.from('leadership').select('*').order('sort_order', { ascending: true })
    setLeaders(data || [])
    setLoadingLeaders(false)
  }

  const deleteLeader = async (id: string) => {
    if (!confirm('Remove this member?')) return
    await supabase.from('leadership').delete().eq('id', id)
    fetchLeaders()
  }

  const leaderByRole = Object.fromEntries(leaders.map(l => [l.role, l]))

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero-gradient pt-12 sm:pt-16 pb-16 sm:pb-20 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 overflow-hidden nacs-logo-glow"
              style={{ borderColor: 'var(--accent)' }}>
              <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            NACS <span style={{ color: 'var(--accent)' }}>FUTO</span>
          </h1>
          <div className="flex justify-center mb-6 px-2"><TypingText /></div>
          <p className="text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Welcome to the National Association of Cyber Security Students (NACS), FUTO. A community of focused students and future cybersecurity leaders committed to learning, growth, and building a safer digital world through collaboration and technology.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-6"><span className="terminal-badge">⚙ ./stats</span></div>
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{ color: 'var(--text-primary)' }}>
            Association <span style={{ color: 'var(--accent)' }}>Statistics</span>
          </h2>
          <p className="text-center text-sm mb-8 sm:mb-10" style={{ color: 'var(--text-secondary)' }}>
            Real-time metrics showcasing our association's growth and security excellence
          </p>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { icon: Users, end: 1000, suffix: '+', label: 'Students' },
              { icon: Code, end: 100, suffix: '+', label: 'Projects' },
              { icon: Lock, end: 99, suffix: '.9%', label: 'Secure' },
            ].map(({ icon: Icon, end, suffix, label }) => (
              <div key={label} className="glass-card p-4 sm:p-6 text-center hover-lift">
                <Icon className="w-5 h-5 sm:w-6 sm:h-6 mx-auto mb-2 sm:mb-3" style={{ color: 'var(--accent)' }} />
                <CountUp end={end} suffix={suffix} />
                <div className="text-xs mt-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>{label}</div>
                <div className="flex justify-center gap-1 mt-2 sm:mt-3">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? 'var(--accent)' : 'var(--border)' }} />)}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-6 sm:mt-8 px-2">
            <div className="status-bar text-xs w-full max-w-lg">
              <span style={{ color: 'var(--text-muted)' }}>root@futo-cybersec:~$ </span>
              system --status <span className="success-text">● OPERATIONAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Leadership ── */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Department <span style={{ color: 'var(--accent)' }}>Leadership</span>
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Meet our dedicated leadership team committed to excellence in cybersecurity education and research.
            </p>
          </div>

          {loadingLeaders ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <>
              {/* TOP ROW — Dept leaders (superior, larger cards) */}
              <div className="flex justify-center gap-6 sm:gap-10 mb-12 flex-wrap">
                {DEPT_POSITIONS.map(slot => (
                  <DeptCard key={slot.role} slot={slot} leader={leaderByRole[slot.role]}
                    isAdmin={isAdmin}
                    onEdit={(l, r, t) => setEditModal({ open: true, leader: l, role: r, type: t })}
                    onDelete={deleteLeader} />
                ))}
              </div>

              {/* STUDENT EXECUTIVES — fixed-order grid */}
              <h3 className="text-xl font-bold text-center mb-6" style={{ color: 'var(--text-primary)' }}>
                Student <span style={{ color: 'var(--accent)' }}>Executives</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {EXECUTIVE_POSITIONS.map(slot => (
                  <ExecCard key={slot.role} slot={slot} leader={leaderByRole[slot.role]}
                    isAdmin={isAdmin}
                    onEdit={(l, r, t) => setEditModal({ open: true, leader: l, role: r, type: t })}
                    onDelete={deleteLeader} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {[
            { title: 'Our Mission', text: 'We provide a space where every student is empowered to explore cybersecurity, connect with others, and build real-world skills.\n\nWe focus on growth through seminars, mentorship, hands-on events, and open collaboration with academic and industry mentors.' },
            { title: 'Our Vision', text: 'We see a future where our students lead in building a safer digital world — not only as experts, but as responsible innovators.\n\nFrom FUTO to the world, we are shaping the next generation of cyber defenders, ethical hackers, and change-makers.' },
          ].map(({ title, text }) => (
            <div key={title} className="glass-card p-5 sm:p-6 hover-lift">
              <div className="w-9 h-9 rounded-full overflow-hidden border mb-3" style={{ borderColor: 'var(--accent-border)' }}>
                <img src="/nacs-logo.jpeg" alt="NACS" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-lg mb-3" style={{ color: 'var(--text-primary)' }}>{title}</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {editModal.open && (
        <LeaderModal leader={editModal.leader} fixedRole={editModal.role} fixedType={editModal.type}
          onClose={() => setEditModal({ open: false })} onSave={fetchLeaders} />
      )}
    </div>
  )
}
