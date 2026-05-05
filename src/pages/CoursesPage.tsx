import { useState, useEffect } from 'react'
import { Search, BookOpen, Plus, Star, Users, Clock, X, Play } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, getDisplayName } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import FileUploader from '../components/FileUploader'

interface Course {
  id: string; title: string; category: string; level: string; duration: string
  description: string; topics: string[]; instructor: string; type: string
  approved: boolean; students: number; rating: number; author_name: string; media: any; created_at: string
}

const CATEGORIES = ['All Categories', 'Cybersecurity', 'Networking', 'Programming', 'Operating Systems', 'Research', 'Other']
const LEVELS = ['All Levels', '100', '200', '300', '400', '500']

function CourseCard({ course }: { course: Course }) {
  const mediaUrl = course.media?.thumbnail || course.media?.url || null
  const embedUrl = course.media?.embed_url || null

  const getEmbedSrc = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    if (url.includes('facebook.com')) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`
    return null
  }
  const iframeSrc = embedUrl ? getEmbedSrc(embedUrl) : null

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col hover-lift">
      {iframeSrc ? (
        <div className="rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '16/9' }}>
          <iframe src={iframeSrc} className="w-full h-full" allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            title={course.title} style={{ border: 'none' }} />
        </div>
      ) : embedUrl ? (
        <a href={embedUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg mb-3 h-28"
          style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
          <Play className="w-6 h-6" />
          <span className="text-sm font-medium">Watch Video</span>
        </a>
      ) : mediaUrl ? (
        <img src={mediaUrl} alt={course.title} className="w-full h-28 object-cover rounded-lg mb-3" />
      ) : null}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
          {course.category}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{course.type}</span>
      </div>
      <h3 className="font-semibold text-sm mb-1 flex-1 leading-snug" style={{ color: 'var(--text-primary)' }}>{course.title}</h3>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
      <div className="flex items-center gap-3 text-xs mt-auto" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students || 0}</span>
        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>
        {course.rating && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-current" />{course.rating}</span>}
      </div>
      <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>By {course.instructor || course.author_name}</div>
    </div>
  )
}

export default function CoursesPage() {
  const { user, profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [level, setLevel] = useState('All Levels')
  const [showSubmit, setShowSubmit] = useState(false)
  const [form, setForm] = useState({ title: '', category: '', level: '', duration: '', description: '', instructor: '', type: 'Course', mediaUrl: '', embedUrl: '', mediaMode: 'file' as 'file' | 'embed' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').eq('approved', true).order('created_at', { ascending: false })
    setCourses(data || [])
    setLoading(false)
  }

  const filtered = courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== 'All Categories' && c.category !== category) return false
    if (level !== 'All Levels' && c.level !== level) return false
    return true
  })

  const handleSubmit = async () => {
    if (!form.title || !form.category || !form.level) return
    setSubmitting(true)
    const media = form.mediaMode === 'embed' && form.embedUrl
      ? { embed_url: form.embedUrl }
      : form.mediaUrl ? { url: form.mediaUrl } : null
    await supabase.from('courses').insert({
      title: form.title, category: form.category, level: form.level, duration: form.duration,
      description: form.description, instructor: form.instructor, type: form.type,
      approved: false, author_id: user?.id, author_name: getDisplayName(profile), students: 0, media
    })
    setSubmitting(false)
    setShowSubmit(false)
    setForm({ title: '', category: '', level: '', duration: '', description: '', instructor: '', type: 'Course', mediaUrl: '', embedUrl: '', mediaMode: 'file' })
    alert('Course submitted for admin approval!')
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Hero banner */}
      <div className="h-32 sm:h-36 rounded-xl overflow-hidden mb-6 flex items-center justify-center"
        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
        <BookOpen className="w-12 h-12 opacity-30" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="flex justify-center mb-4"><span className="terminal-badge">📚 ./courses</span></div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        Courses & <span style={{ color: 'var(--accent)' }}>Research</span>
      </h1>
      <p className="text-center text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>Explore our comprehensive curriculum and cutting-edge research projects.</p>
      <p className="text-center text-xs mb-5" style={{ color: 'var(--text-muted)' }}>Want to submit a course or research project?</p>

      <div className="flex justify-center mb-8">
        {user ? (
          <button onClick={() => setShowSubmit(true)} className="cyber-btn text-sm">
            <Plus className="w-4 h-4" /> Submit a Course
          </button>
        ) : (
          <Link to="/login" className="cyber-btn text-sm">
            <Plus className="w-4 h-4" /> Sign In to Submit
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-3 sm:p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="input-icon-wrap flex-1">
          <Search className="input-icon" />
          <input className="cyber-input" placeholder="Search courses and research..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="cyber-select sm:w-44" value={category} onChange={e => setCategory(e.target.value)}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select className="cyber-select sm:w-36" value={level} onChange={e => setLevel(e.target.value)}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Showing {filtered.length} of {courses.length} results</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No courses found</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria or filters.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(course => <CourseCard key={course.id} course={course} />)}
        </div>
      )}

      {/* Submit Modal */}
      {showSubmit && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSubmit(false)}>
          <div className="modal-content p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Submit a Course</h2>
              <button onClick={() => setShowSubmit(false)} className="theme-toggle"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input className="cyber-input" placeholder="Course title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <select className="cyber-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category *</option>
                {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <select className="cyber-select" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  <option value="">Level *</option>
                  {['100', '200', '300', '400', '500'].map(l => <option key={l}>{l} Level</option>)}
                </select>
                <input className="cyber-input" placeholder="Duration" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
              </div>
              <input className="cyber-input" placeholder="Instructor name" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} />
              <textarea className="cyber-input resize-none h-20" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

              {/* Media mode tabs */}
              <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                {(['file', 'embed'] as const).map(m => (
                  <button key={m} type="button" onClick={() => setForm({ ...form, mediaMode: m })}
                    className="flex-1 py-1.5 text-xs font-medium transition-colors"
                    style={form.mediaMode === m
                      ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
                      : { background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                    {m === 'file' ? '📁 Upload / URL' : '🎬 Embed Video'}
                  </button>
                ))}
              </div>

              {form.mediaMode === 'file' ? (
                <FileUploader
                  label="Course thumbnail / file (optional)"
                  value={form.mediaUrl}
                  onChange={url => setForm({ ...form, mediaUrl: url })}
                  accept="image/*,.pdf,.doc,.docx"
                />
              ) : (
                <div>
                  <label className="text-xs mb-1 block" style={{ color: 'var(--text-secondary)' }}>Video Embed URL</label>
                  <input className="cyber-input" placeholder="YouTube / Facebook / Instagram / Twitter URL"
                    value={form.embedUrl} onChange={e => setForm({ ...form, embedUrl: e.target.value })} />
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Supports YouTube, Facebook, Instagram, Twitter/X</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSubmit} disabled={submitting} className="cyber-btn flex-1">
                {submitting ? 'Submitting...' : 'Submit for Review'}
              </button>
              <button onClick={() => setShowSubmit(false)} className="cyber-btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
