import { useState, useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, MessageSquare, BookOpen, FileText, Flag, Mail,
  LogOut, ChevronRight, Users, Check, X, Trash2, Eye,
  Upload, Edit2, Plus, Download, ToggleLeft, ToggleRight,
  CheckCircle, Menu, Vote, Crown
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, getDisplayName } from '../contexts/AuthContext'
import FileUploader from '../components/FileUploader'

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/feed', label: 'Feed / Posts', icon: MessageSquare },
  { to: '/admin/courses', label: 'Courses', icon: BookOpen },
  { to: '/admin/past-questions', label: 'Past Questions', icon: FileText },
  { to: '/admin/lecture-notes', label: 'Lecture Notes', icon: FileText },
  { to: '/admin/leadership', label: 'Leadership', icon: Crown },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/messages', label: 'Messages', icon: Mail },
  { to: '/admin/users', label: 'Users', icon: Users },
]

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { pathname } = useLocation()
  const { signOut, profile } = useAuth()
  const navigate = useNavigate()

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={onClose} />}

      <aside className={`fixed md:static top-0 left-0 bottom-0 z-40 flex flex-col transition-transform duration-300 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ width: 220, background: 'var(--bg-dark)', borderRight: '1px solid var(--border)', minHeight: '100vh' }}>
        <div className="p-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 overflow-hidden"
              style={{ borderColor: 'var(--accent)' }}>
              <img src="/nacs-logo.jpeg" alt="NACS" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>NACS Admin</div>
              <div className="text-xs font-mono" style={{ color: 'var(--accent)' }}>FUTO</div>
            </div>
          </div>
          <div className="mt-2 text-xs truncate" style={{ color: 'var(--text-muted)' }}>{getDisplayName(profile)}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon, exact }) => {
            const active = exact ? pathname === to : pathname.startsWith(to)
            return (
              <Link key={to} to={to} onClick={onClose}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                style={active
                  ? { background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }
                  : { color: 'var(--text-secondary)', border: '1px solid transparent' }}>
                <Icon className="w-4 h-4 shrink-0" />
                <span>{label}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
          <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            <Eye className="w-4 h-4" /> View Site
          </Link>
          <button onClick={async () => { await signOut(); navigate('/') }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors w-full mt-1"
            style={{ color: 'var(--text-secondary)' }}>
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: any }) {
  return (
    <div className="glass-card p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <Icon className="w-5 h-5" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="text-2xl font-bold font-mono" style={{ color: 'var(--text-primary)' }}>{value}</div>
    </div>
  )
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function DashboardOverview() {
  const [stats, setStats] = useState({ posts: 0, courses: 0, materials: 0, notes: 0, reports: 0, messages: 0, users: 0 })
  useEffect(() => {
    Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('materials').select('id', { count: 'exact', head: true }),
      supabase.from('lecture_notes').select('id', { count: 'exact', head: true }),
      supabase.from('anonymous_reports').select('id', { count: 'exact', head: true }),
      supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]).then(([posts, courses, materials, notes, reports, messages, users]) => {
      setStats({ posts: posts.count || 0, courses: courses.count || 0, materials: materials.count || 0, notes: notes.count || 0, reports: reports.count || 0, messages: messages.count || 0, users: users.count || 0 })
    })
  }, [])

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Dashboard Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Total Users" value={stats.users} icon={Users} />
        <StatCard label="Posts" value={stats.posts} icon={MessageSquare} />
        <StatCard label="Courses" value={stats.courses} icon={BookOpen} />
        <StatCard label="Past Questions" value={stats.materials} icon={FileText} />
        <StatCard label="Lecture Notes" value={stats.notes} icon={FileText} />
        <StatCard label="Reports" value={stats.reports} icon={Flag} />
        <StatCard label="Messages" value={stats.messages} icon={Mail} />
        <StatCard label="Leadership" value="—" icon={Users} />
      </div>
    </div>
  )
}

// ─── Shared list row ──────────────────────────────────────────────────────────
function ListRow({ children }: { children: React.ReactNode }) {
  return <div className="glass-card p-4">{children}</div>
}

function StatusBadge({ status, labels }: { status: boolean | string; labels: [string, string] }) {
  const isPos = status === true || status === 'read' || status === 'approved'
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={isPos
      ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
      : { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>
      {isPos ? labels[0] : labels[1]}
    </span>
  )
}

function ActionBtn({ onClick, icon: Icon, color }: { onClick: () => void; icon: any; color: 'accent' | 'success' | 'danger' | 'warn' }) {
  const colors = {
    accent: { border: 'var(--accent-border)', color: 'var(--accent)', bg: 'var(--accent-dim)' },
    success: { border: 'rgba(16,185,129,0.3)', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    danger: { border: 'rgba(239,68,68,0.3)', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    warn: { border: 'rgba(245,158,11,0.3)', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  }[color]
  return (
    <button onClick={onClick} className="p-1.5 rounded-lg border transition-colors"
      style={{ borderColor: colors.border, color: colors.color }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = colors.bg}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
      <Icon className="w-4 h-4" />
    </button>
  )
}

// ─── Feed Admin ───────────────────────────────────────────────────────────────
function AdminFeed() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newPost, setNewPost] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [mediaMode, setMediaMode] = useState<'file' | 'embed'>('file')
  const [posting, setPosting] = useState(false)

  useEffect(() => { fetchPosts() }, [])

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false })
    setPosts(data || []); setLoading(false)
  }

  const createPost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    const { data: { user } } = await supabase.auth.getUser()
    const media = mediaMode === 'embed' && embedUrl
      ? { embed_url: embedUrl }
      : mediaUrl ? { url: mediaUrl } : null
    await supabase.from('posts').insert({ author_id: user?.id, author_name: getDisplayName(profile), content: newPost.trim(), media, likes: 0, approved: true, pending: false })
    setNewPost(''); setMediaUrl(''); setEmbedUrl(''); setPosting(false); fetchPosts()
  }

  const toggleApprove = async (post: any) => {
    await supabase.from('posts').update({ approved: !post.approved, pending: false }).eq('id', post.id); fetchPosts()
  }
  const deletePost = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('comments').delete().eq('post_id', id)
    await supabase.from('posts').delete().eq('id', id); fetchPosts()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Feed Management</h2>
      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Create Announcement</h3>
        <textarea className="cyber-input resize-none h-24 mb-3" placeholder="Write an announcement..." value={newPost} onChange={e => setNewPost(e.target.value)} />
        {/* Media mode tabs */}
        <div className="flex rounded-lg overflow-hidden border mb-3" style={{ borderColor: 'var(--border)' }}>
          {(['file', 'embed'] as const).map(m => (
            <button key={m} onClick={() => setMediaMode(m)}
              className="flex-1 py-1.5 text-xs font-medium transition-colors capitalize"
              style={mediaMode === m
                ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
                : { background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
              {m === 'file' ? '📁 Media Upload' : '🎬 Embed Video'}
            </button>
          ))}
        </div>
        {mediaMode === 'file' ? (
          <FileUploader label="Media attachment (optional)" value={mediaUrl} onChange={setMediaUrl} accept="image/*,video/*" />
        ) : (
          <div>
            <input className="cyber-input" placeholder="YouTube / Facebook / Instagram / Twitter URL"
              value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Paste any YouTube, Facebook, IG or Twitter video link</p>
          </div>
        )}
        <button onClick={createPost} disabled={posting} className="cyber-btn mt-3"><Plus className="w-4 h-4" />{posting ? 'Posting...' : 'Post'}</button>
      </div>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> : (
        <div className="space-y-3">
          {posts.map(post => (
            <ListRow key={post.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{post.author_name}</span>
                    <StatusBadge status={post.approved} labels={['Approved', 'Pending']} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>
                  {post.media?.embed_url && <p className="text-xs mt-1" style={{ color: 'var(--accent)' }}>🎬 Embed: {post.media.embed_url}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <ActionBtn onClick={() => toggleApprove(post)} icon={post.approved ? X : Check} color={post.approved ? 'warn' : 'success'} />
                  <ActionBtn onClick={() => deletePost(post.id)} icon={Trash2} color="danger" />
                </div>
              </div>
            </ListRow>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Courses Admin ────────────────────────────────────────────────────────────
function AdminCourses() {
  const [courses, setCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').order('created_at', { ascending: false })
    setCourses(data || []); setLoading(false)
  }

  const approveCourse = async (id: string, approved: boolean) => {
    await supabase.from('courses').update({ approved }).eq('id', id); setFeedbackModal(null); setFeedback(''); fetchCourses()
  }
  const deleteCourse = async (id: string) => {
    if (!confirm('Delete?')) return; await supabase.from('courses').delete().eq('id', id); fetchCourses()
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Courses</h2>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> : (
        <div className="space-y-3">
          {courses.map(course => (
            <ListRow key={course.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{course.title}</span>
                    <StatusBadge status={course.approved} labels={['Approved', 'Pending']} />
                  </div>
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>By {course.author_name} | {course.category} | Level {course.level}</div>
                  <p className="text-sm line-clamp-1" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!course.approved
                    ? <ActionBtn onClick={() => setFeedbackModal(course.id)} icon={Check} color="success" />
                    : <ActionBtn onClick={() => approveCourse(course.id, false)} icon={X} color="warn" />}
                  <ActionBtn onClick={() => deleteCourse(course.id)} icon={Trash2} color="danger" />
                </div>
              </div>
            </ListRow>
          ))}
          {courses.length === 0 && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No courses submitted yet.</div>}
        </div>
      )}

      {feedbackModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setFeedbackModal(null)}>
          <div className="modal-content p-6">
            <h3 className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Approve Course</h3>
            <textarea className="cyber-input resize-none h-24 mb-4" placeholder="Optional feedback..." value={feedback} onChange={e => setFeedback(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => approveCourse(feedbackModal, true)} className="cyber-btn flex-1"><Check className="w-4 h-4" />Approve</button>
              <button onClick={() => setFeedbackModal(null)} className="cyber-btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Upload Form ──────────────────────────────────────────────────────────────
function UploadForm({ table, onDone }: { table: 'materials' | 'lecture_notes'; onDone: () => void }) {
  const [form, setForm] = useState({ title: '', course_code: '', level: '200', semester: 'First', file_url: '', file_name: '', description: '', topic: '' })
  const [uploading, setUploading] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!form.title || !form.file_url) return
    setUploading(true)
    const payload: any = { title: form.title, course_code: form.course_code, level: form.level, semester: form.semester, file_url: form.file_url, file_name: form.file_name || form.title, file_size: 0, file_type: form.file_url.split('.').pop() || 'pdf', description: form.description, uploaded_by: user?.id, download_count: 0 }
    if (table === 'lecture_notes') payload.topic = form.topic
    await supabase.from(table).insert(payload)
    setUploading(false)
    setForm({ title: '', course_code: '', level: '200', semester: 'First', file_url: '', file_name: '', description: '', topic: '' })
    onDone()
  }

  return (
    <div className="glass-card p-5 mb-6">
      <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Upload New File</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Title *</label>
          <input className="cyber-input" placeholder="File title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Course Code</label>
          <input className="cyber-input" placeholder="e.g., CYB 481" value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} />
        </div>
        {table === 'lecture_notes' && (
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Topic</label>
            <input className="cyber-input" placeholder="Topic name" value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} />
          </div>
        )}
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Level</label>
          <select className="cyber-select" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
            {['200', '300', '400', '500'].map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Semester</label>
          <select className="cyber-select" value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })}>
            <option>First</option><option>Second</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <FileUploader
            label="File * (upload from device or paste URL)"
            value={form.file_url}
            onChange={url => setForm({ ...form, file_url: url })}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            bucket="course-files"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Description (optional)</label>
          <textarea className="cyber-input resize-none h-16" placeholder="Brief description..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={uploading} className="cyber-btn mt-4">
        <Upload className="w-4 h-4" />{uploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  )
}

// ─── Past Questions Admin ─────────────────────────────────────────────────────
function AdminPastQuestions() {
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => { fetchMaterials() }, [])
  const fetchMaterials = async () => { setLoading(true); const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false }); setMaterials(data || []); setLoading(false) }
  const saveEdit = async () => { await supabase.from('materials').update(editData).eq('id', editId); setEditId(null); fetchMaterials() }
  const deleteMaterial = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('materials').delete().eq('id', id); fetchMaterials() }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Past Questions</h2>
      <UploadForm table="materials" onDone={fetchMaterials} />
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> : (
        <div className="space-y-3">
          {materials.map(m => (
            <ListRow key={m.id}>
              {editId === m.id ? (
                <div className="grid grid-cols-2 gap-2">
                  <input className="cyber-input col-span-2" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder="Title" />
                  <input className="cyber-input" value={editData.course_code} onChange={e => setEditData({ ...editData, course_code: e.target.value })} placeholder="Course code" />
                  <select className="cyber-select" value={editData.level} onChange={e => setEditData({ ...editData, level: e.target.value })}>
                    {['200', '300', '400', '500'].map(l => <option key={l}>{l}</option>)}
                  </select>
                  <select className="cyber-select" value={editData.semester} onChange={e => setEditData({ ...editData, semester: e.target.value })}><option>First</option><option>Second</option></select>
                  <input className="cyber-input" value={editData.file_url} onChange={e => setEditData({ ...editData, file_url: e.target.value })} placeholder="File URL" />
                  <div className="col-span-2 flex gap-2">
                    <button onClick={saveEdit} className="cyber-btn text-xs py-1.5 px-4"><Check className="w-3.5 h-3.5" />Save</button>
                    <button onClick={() => setEditId(null)} className="cyber-btn-ghost text-xs py-1.5 px-4">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.title}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.course_code} | Level {m.level} | {m.semester} Semester</div>
                    <div className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}><Download className="w-3 h-3" />{m.download_count || 0} downloads</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><Eye className="w-4 h-4" /></a>
                    <ActionBtn onClick={() => { setEditId(m.id); setEditData({ ...m }) }} icon={Edit2} color="accent" />
                    <ActionBtn onClick={() => deleteMaterial(m.id)} icon={Trash2} color="danger" />
                  </div>
                </div>
              )}
            </ListRow>
          ))}
          {materials.length === 0 && !loading && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No past questions uploaded yet.</div>}
        </div>
      )}
    </div>
  )
}

// ─── Lecture Notes Admin ──────────────────────────────────────────────────────
function AdminLectureNotes() {
  const [notes, setNotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})

  useEffect(() => { fetchNotes() }, [])
  const fetchNotes = async () => { setLoading(true); const { data } = await supabase.from('lecture_notes').select('*').order('created_at', { ascending: false }); setNotes(data || []); setLoading(false) }
  const saveEdit = async () => { await supabase.from('lecture_notes').update(editData).eq('id', editId); setEditId(null); fetchNotes() }
  const deleteNote = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('lecture_notes').delete().eq('id', id); fetchNotes() }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Lecture Notes</h2>
      <UploadForm table="lecture_notes" onDone={fetchNotes} />
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> : (
        <div className="space-y-3">
          {notes.map(n => (
            <ListRow key={n.id}>
              {editId === n.id ? (
                <div className="grid grid-cols-2 gap-2">
                  <input className="cyber-input col-span-2" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} placeholder="Title" />
                  <input className="cyber-input" value={editData.topic || ''} onChange={e => setEditData({ ...editData, topic: e.target.value })} placeholder="Topic" />
                  <input className="cyber-input" value={editData.course_code} onChange={e => setEditData({ ...editData, course_code: e.target.value })} placeholder="Course code" />
                  <select className="cyber-select" value={editData.level} onChange={e => setEditData({ ...editData, level: e.target.value })}>
                    {['200', '300', '400', '500'].map(l => <option key={l}>{l}</option>)}
                  </select>
                  <select className="cyber-select" value={editData.semester} onChange={e => setEditData({ ...editData, semester: e.target.value })}><option>First</option><option>Second</option></select>
                  <div className="col-span-2 flex gap-2">
                    <button onClick={saveEdit} className="cyber-btn text-xs py-1.5 px-4"><Check className="w-3.5 h-3.5" />Save</button>
                    <button onClick={() => setEditId(null)} className="cyber-btn-ghost text-xs py-1.5 px-4">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{n.title}</div>
                    {n.topic && <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{n.topic}</div>}
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{n.course_code} | Level {n.level} | {n.semester} Semester</div>
                    <div className="text-xs flex items-center gap-1 mt-1" style={{ color: 'var(--text-muted)' }}><Download className="w-3 h-3" />{n.download_count || 0} downloads</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <a href={n.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg border transition-colors" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}><Eye className="w-4 h-4" /></a>
                    <ActionBtn onClick={() => { setEditId(n.id); setEditData({ ...n }) }} icon={Edit2} color="accent" />
                    <ActionBtn onClick={() => deleteNote(n.id)} icon={Trash2} color="danger" />
                  </div>
                </div>
              )}
            </ListRow>
          ))}
          {notes.length === 0 && !loading && <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No lecture notes uploaded yet.</div>}
        </div>
      )}
    </div>
  )
}

// ─── Reports Admin ────────────────────────────────────────────────────────────
function AdminReports() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchReports() }, [])
  const fetchReports = async () => { setLoading(true); const { data } = await supabase.from('anonymous_reports').select('*').order('created_at', { ascending: false }); setReports(data || []); setLoading(false) }
  const markRead = async (id: string) => { await supabase.from('anonymous_reports').update({ status: 'read' }).eq('id', id); fetchReports() }
  const deleteReport = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('anonymous_reports').delete().eq('id', id); fetchReports() }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Anonymous Reports</h2>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> :
        reports.length === 0 ? <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No reports submitted.</div> : (
          <div className="space-y-3">
            {reports.map(r => (
              <ListRow key={r.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{r.subject}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>{r.category}</span>
                      <StatusBadge status={r.status === 'read'} labels={['Read', 'Pending']} />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.message}</p>
                    {r.contact_info && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Contact: {r.contact_info}</p>}
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {r.status !== 'read' && <ActionBtn onClick={() => markRead(r.id)} icon={CheckCircle} color="success" />}
                    <ActionBtn onClick={() => deleteReport(r.id)} icon={Trash2} color="danger" />
                  </div>
                </div>
              </ListRow>
            ))}
          </div>
        )}
    </div>
  )
}

// ─── Messages Admin ───────────────────────────────────────────────────────────
function AdminMessages() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetchMessages() }, [])
  const fetchMessages = async () => { setLoading(true); const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false }); setMessages(data || []); setLoading(false) }
  const markRead = async (id: string) => { await supabase.from('contact_messages').update({ status: 'read' }).eq('id', id); fetchMessages() }
  const deleteMsg = async (id: string) => { if (!confirm('Delete?')) return; await supabase.from('contact_messages').delete().eq('id', id); fetchMessages() }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Contact Messages</h2>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> :
        messages.length === 0 ? <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No messages yet.</div> : (
          <div className="space-y-3">
            {messages.map(m => (
              <ListRow key={m.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.email}</span>
                      <StatusBadge status={m.status === 'read'} labels={['Read', 'Unread']} />
                    </div>
                    <div className="font-medium text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{m.subject}</div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.message}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{new Date(m.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {m.status !== 'read' && <ActionBtn onClick={() => markRead(m.id)} icon={CheckCircle} color="success" />}
                    <ActionBtn onClick={() => deleteMsg(m.id)} icon={Trash2} color="danger" />
                  </div>
                </div>
              </ListRow>
            ))}
          </div>
        )}
    </div>
  )
}

// ─── Users Admin ──────────────────────────────────────────────────────────────
function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [matric, setMatric] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => { fetchUsers() }, [])
  const fetchUsers = async () => { setLoading(true); const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }); setUsers(data || []); setLoading(false) }
  const addWhitelist = async () => {
    if (!matric.trim()) return; setAdding(true)
    await supabase.from('whitelisted_matric_numbers').insert({ matric_number: matric.trim(), is_active: true })
    setMatric(''); setAdding(false); alert('Matric number whitelisted!')
  }
  const toggleAdmin = async (user: any) => { await supabase.from('profiles').update({ is_admin: !user.is_admin }).eq('id', user.id); fetchUsers() }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Users & Whitelist</h2>
      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Whitelist Matric Number</h3>
        <div className="flex gap-3 flex-col sm:flex-row">
          <input className="cyber-input flex-1" placeholder="e.g., 20251234567" value={matric} onChange={e => setMatric(e.target.value)} onKeyDown={e => e.key === 'Enter' && addWhitelist()} />
          <button onClick={addWhitelist} disabled={adding} className="cyber-btn shrink-0"><Plus className="w-4 h-4" />{adding ? 'Adding...' : 'Whitelist'}</button>
        </div>
      </div>
      <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Registered Users ({users.length})</h3>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> : (
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="glass-card p-3 flex items-center justify-between gap-3">
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{u.name}</div>
                <div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{u.matric_number}</div>
              </div>
              <div className="flex items-center gap-2">
                {u.is_admin && <span className="badge-admin">ADMIN</span>}
                <button onClick={() => toggleAdmin(u)} className="p-1.5 rounded-lg border transition-colors"
                  style={{ borderColor: 'var(--border)', color: u.is_admin ? '#f59e0b' : 'var(--text-muted)' }}>
                  {u.is_admin ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Election Admin ───────────────────────────────────────────────────────────
function AdminElection() {
  const [settings, setSettings] = useState<any>(null)
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCandidate, setNewCandidate] = useState({ name: '', position: '', image_url: '' })
  const [adding, setAdding] = useState(false)
  const [votes, setVotes] = useState<any[]>([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: s }, { data: c }, { data: v }] = await Promise.all([
      supabase.from('election_settings').select('*').eq('id', 1).single(),
      supabase.from('election_candidates').select('*').order('position'),
      supabase.from('election_votes').select('candidate_id'),
    ])
    setSettings(s)
    setCandidates(c || [])
    setVotes(v || [])
    setLoading(false)
  }

  const updateSetting = async (key: string, value: boolean) => {
    await supabase.from('election_settings').update({ [key]: value, updated_at: new Date().toISOString() }).eq('id', 1)
    setSettings((prev: any) => ({ ...prev, [key]: value }))
  }

  const addCandidate = async () => {
    if (!newCandidate.name || !newCandidate.position) return
    setAdding(true)
    await supabase.from('election_candidates').insert({ ...newCandidate, status: 'active' })
    setNewCandidate({ name: '', position: '', image_url: '' })
    setAdding(false)
    fetchAll()
  }

  const toggleCandidateStatus = async (id: string, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active'
    await supabase.from('election_candidates').update({ status: newStatus }).eq('id', id)
    fetchAll()
  }

  const deleteCandidate = async (id: string) => {
    if (!confirm('Delete this candidate? Their votes will also be deleted.')) return
    await supabase.from('election_votes').delete().eq('candidate_id', id)
    await supabase.from('election_candidates').delete().eq('id', id)
    fetchAll()
  }

  const resetElection = async () => {
    if (!confirm('Reset ALL votes and submissions? This cannot be undone.')) return
    await supabase.from('election_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('election_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    fetchAll()
  }

  const positions = [...new Set(candidates.map(c => c.position))]
  const voteCountFor = (candidateId: string) => votes.filter(v => v.candidate_id === candidateId).length

  const ToggleSwitch = ({ value, onToggle, label }: { value: boolean; onToggle: () => void; label: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <button onClick={onToggle}
        className="w-12 h-6 rounded-full transition-all relative"
        style={{ background: value ? 'var(--accent)' : 'var(--border)' }}>
        <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
          style={{ left: value ? '26px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </button>
    </div>
  )

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div>

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Election Management</h2>

      {/* Settings */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Election Settings</h3>
        <div className="space-y-3">
          <ToggleSwitch value={settings?.election_open || false} label="Election Open (allow voting)" onToggle={() => updateSetting('election_open', !settings?.election_open)} />
          <ToggleSwitch value={settings?.results_visible || false} label="Results Visible (show public results)" onToggle={() => updateSetting('results_visible', !settings?.results_visible)} />
          <ToggleSwitch value={settings?.allow_changes || false} label="Allow Vote Changes (before submission)" onToggle={() => updateSetting('allow_changes', !settings?.allow_changes)} />
        </div>
        <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Total Votes Cast</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{votes.length} votes across all positions</div>
            </div>
            <button onClick={resetElection}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              Reset All Votes
            </button>
          </div>
        </div>
      </div>

      {/* Add Candidate */}
      <div className="glass-card p-5 mb-6">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Add Candidate</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
            <input className="cyber-input" placeholder="Candidate full name" value={newCandidate.name} onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })} />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Position *</label>
            <input className="cyber-input" placeholder="e.g., President, Vice President" value={newCandidate.position} onChange={e => setNewCandidate({ ...newCandidate, position: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <FileUploader
              label="Candidate Photo (optional)"
              value={newCandidate.image_url}
              onChange={url => setNewCandidate({ ...newCandidate, image_url: url })}
              accept="image/*"
              bucket="candidate-photos"
            />
          </div>
        </div>
        <button onClick={addCandidate} disabled={adding} className="cyber-btn mt-4">
          <Plus className="w-4 h-4" />{adding ? 'Adding...' : 'Add Candidate'}
        </button>
      </div>

      {/* Candidates grouped by position */}
      {positions.map(position => (
        <div key={position} className="mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Vote className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            {position}
          </h3>
          <div className="space-y-2">
            {candidates.filter(c => c.position === position).map(candidate => (
              <div key={candidate.id} className="glass-card p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#0284c7' }}>
                    {candidate.name[0]}
                  </div>
                  <div>
                    <div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{candidate.name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{voteCountFor(candidate.id)} votes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={candidate.status === 'active'
                      ? { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
                      : { background: 'var(--bg-dark)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    {candidate.status}
                  </span>
                  <ActionBtn onClick={() => toggleCandidateStatus(candidate.id, candidate.status)} icon={candidate.status === 'active' ? X : Check} color={candidate.status === 'active' ? 'warn' : 'success'} />
                  <ActionBtn onClick={() => deleteCandidate(candidate.id)} icon={Trash2} color="danger" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {candidates.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No candidates added yet. Use the form above to add candidates.
        </div>
      )}
    </div>
  )
}

// ─── Leadership Admin ─────────────────────────────────────────────────────────
const DEPT_POSITIONS_ADMIN = [
  { role: 'Head of Department', type: 'dept', sort_order: 1 },
  { role: 'Staff Adviser', type: 'dept', sort_order: 2 },
]
const EXEC_POSITIONS_ADMIN = [
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

function AdminLeadership() {
  const [leaders, setLeaders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingSlot, setEditingSlot] = useState<{ leader?: any; role: string; type: string; sort_order: number } | null>(null)
  const [form, setForm] = useState({ name: '', image_url: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchLeaders() }, [])
  const fetchLeaders = async () => {
    setLoading(true)
    const { data } = await supabase.from('leadership').select('*')
    setLeaders(data || []); setLoading(false)
  }

  const leaderByRole = Object.fromEntries(leaders.map((l: any) => [l.role, l]))

  const openEdit = (slot: typeof DEPT_POSITIONS_ADMIN[0], leader?: any) => {
    setEditingSlot({ leader, role: slot.role, type: slot.type, sort_order: slot.sort_order })
    setForm({ name: leader?.name || '', image_url: leader?.image_url || '' })
  }

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    const payload = { name: form.name, image_url: form.image_url, role: editingSlot!.role, type: editingSlot!.type, sort_order: editingSlot!.sort_order }
    if (editingSlot?.leader?.id) {
      await supabase.from('leadership').update(payload).eq('id', editingSlot.leader.id)
    } else {
      await supabase.from('leadership').insert(payload)
    }
    setSaving(false); setEditingSlot(null); fetchLeaders()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this member?')) return
    await supabase.from('leadership').delete().eq('id', id)
    fetchLeaders()
  }

  const SlotCard = ({ slot, large = false }: { slot: typeof DEPT_POSITIONS_ADMIN[0]; large?: boolean }) => {
    const leader = leaderByRole[slot.role]
    return (
      <div className="glass-card p-4 text-center relative hover-lift" style={{ minWidth: large ? 180 : 0 }}>
        <div className="flex justify-center mb-2">
          {leader?.image_url ? (
            <img src={leader.image_url} alt={leader.name}
              className="rounded-full object-cover"
              style={{ width: large ? 72 : 52, height: large ? 72 : 52 }} />
          ) : (
            <div className="rounded-full border-2 border-dashed flex items-center justify-center"
              style={{ width: large ? 72 : 52, height: large ? 72 : 52, borderColor: 'var(--border)', background: 'var(--accent-dim)' }}>
              <span style={{ fontSize: large ? 28 : 20, opacity: 0.4 }}>👤</span>
            </div>
          )}
        </div>
        <div className="text-sm font-semibold leading-tight" style={{ color: leader ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {leader?.name || 'Vacant'}
        </div>
        <div className="text-xs mt-0.5 font-medium" style={{ color: 'var(--accent)' }}>{slot.role}</div>
        <div className="flex justify-center gap-1.5 mt-2">
          <button onClick={() => openEdit(slot, leader)}
            className="py-0.5 px-2 rounded border text-xs flex items-center gap-1"
            style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)' }}>
            <Edit2 className="w-2.5 h-2.5" />{leader ? 'Edit' : 'Add'}
          </button>
          {leader && (
            <button onClick={() => handleDelete(leader.id)}
              className="py-0.5 px-1.5 rounded border"
              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444' }}>
              <Trash2 className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Leadership Management</h2>
      {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /></div> : (
        <>
          <div className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Department Leadership</div>
          <div className="flex gap-4 mb-8 flex-wrap">
            {DEPT_POSITIONS_ADMIN.map(slot => <SlotCard key={slot.role} slot={slot} large />)}
          </div>
          <div className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Student Executives</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {EXEC_POSITIONS_ADMIN.map(slot => <SlotCard key={slot.role} slot={slot} />)}
          </div>
        </>
      )}

      {/* Edit modal */}
      {editingSlot && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingSlot(null)}>
          <div className="modal-content p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {editingSlot.leader ? 'Edit' : 'Add'} — {editingSlot.role}
              </h3>
              <button onClick={() => setEditingSlot(null)} className="theme-toggle"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--text-secondary)' }}>Full Name *</label>
                <input className="cyber-input" placeholder="Full name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
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
              <button onClick={() => setEditingSlot(null)} className="cyber-btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 sticky top-0 z-20"
          style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)' }}>
          <button onClick={() => setSidebarOpen(true)} className="theme-toggle"><Menu className="w-4 h-4" /></button>
          <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Admin Dashboard</span>
        </div>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          <Routes>
            <Route index element={<DashboardOverview />} />
            <Route path="feed" element={<AdminFeed />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="past-questions" element={<AdminPastQuestions />} />
            <Route path="lecture-notes" element={<AdminLectureNotes />} />
            <Route path="leadership" element={<AdminLeadership />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="users" element={<AdminUsers />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
