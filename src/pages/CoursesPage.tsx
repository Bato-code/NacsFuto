import { useState, useEffect } from 'react'
import {
  Search, BookOpen, Plus, Star, Users, Clock, X, Play,
  GripVertical, Trash2, ArrowUp, ArrowDown, Type, Heading as HeadingIcon,
  Image as ImageIcon, Film, Eye,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, getDisplayName } from '../contexts/AuthContext'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FileUploader from '../components/FileUploader'

// ─────────────────────────────────────────────────────────────────────────────
// NOTE ON SCHEMA: this page now expects the following columns on `courses`
// (in addition to what already existed): 
//   level            text        -- 'Beginner' | 'Intermediate' | 'Advanced'
//   format           text        -- 'text' | 'video' | 'text_video'
//   thumbnail        text        -- required cover image URL
//   content_blocks   jsonb        -- ordered array of ContentBlock (see below)
// The old free-form `topics`/`type`/`media` fields are no longer written to,
// but are left alone in case older rows still use them.
// ─────────────────────────────────────────────────────────────────────────────

type BlockType = 'heading' | 'paragraph' | 'image' | 'video'

interface ContentBlock {
  id: string
  type: BlockType
  text?: string        // heading / paragraph content
  url?: string          // image URL
  videoUrl?: string     // raw pasted video URL (youtube etc.)
  caption?: string       // optional caption for image / video
}

type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'
type CourseFormat = 'text' | 'video' | 'text_video'

interface Course {
  id: string
  title: string
  category: string
  level: CourseLevel
  format: CourseFormat
  duration: string
  description: string
  instructor: string
  thumbnail: string
  content_blocks: ContentBlock[]
  approved: boolean
  students: number
  rating: number
  author_name: string
  author_id?: string
  created_at: string
}

const CATEGORIES = ['All Categories', 'Cybersecurity', 'Networking', 'Programming', 'Operating Systems', 'Research', 'Other']
const LEVELS: CourseLevel[] = ['Beginner', 'Intermediate', 'Advanced']
const FORMATS: { value: CourseFormat; label: string; icon: string }[] = [
  { value: 'text', label: 'Text Only', icon: '📝' },
  { value: 'video', label: 'Video Only', icon: '🎬' },
  { value: 'text_video', label: 'Text + Media', icon: '🧩' },
]

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

function getEmbedSrc(url: string) {
  if (!url) return null
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([^&?/\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  if (url.includes('facebook.com')) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`
  return null
}

const levelColor = (level: string) => {
  if (level === 'Beginner') return { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }
  if (level === 'Intermediate') return { background: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }
  return { background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }
}

const formatMeta = (format: string) => FORMATS.find(f => f.value === format) || FORMATS[2]

// ── Renders an ordered list of content blocks (read-only, used in the detail view) ──
function BlockRenderer({ blocks }: { blocks: ContentBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No content added yet.</p>
  }
  return (
    <div className="space-y-4">
      {blocks.map(block => {
        if (block.type === 'heading') {
          return <h3 key={block.id} className="font-bold text-base mt-2" style={{ color: 'var(--text-primary)' }}>{block.text}</h3>
        }
        if (block.type === 'paragraph') {
          return <p key={block.id} className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{block.text}</p>
        }
        if (block.type === 'image') {
          return (
            <figure key={block.id}>
              <img src={block.url} alt={block.caption || 'Course image'} className="w-full rounded-lg object-cover max-h-96" />
              {block.caption && <figcaption className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>{block.caption}</figcaption>}
            </figure>
          )
        }
        if (block.type === 'video') {
          const src = getEmbedSrc(block.videoUrl || '')
          return (
            <figure key={block.id}>
              {src ? (
                <div className="rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <iframe src={src} className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title={block.caption || 'Course video'} style={{ border: 'none' }} />
                </div>
              ) : (
                <a href={block.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-lg border text-xs"
                  style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)' }}>
                  <Play className="w-4 h-4" /> Watch video <span className="ml-auto opacity-70">{block.videoUrl}</span>
                </a>
              )}
              {block.caption && <figcaption className="text-xs text-center mt-1" style={{ color: 'var(--text-muted)' }}>{block.caption}</figcaption>}
            </figure>
          )
        }
        return null
      })}
    </div>
  )
}

// ── Course card (grid item) ─────────────────────────────────────────────────────
function CourseCard({ course }: { course: Course }) {
  const navigate = useNavigate()
  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col hover-lift">
      <div className="relative mb-3">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-32 object-cover rounded-lg" />
        ) : (
          <div className="w-full h-32 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
            <BookOpen className="w-8 h-8 opacity-40" style={{ color: 'var(--accent)' }} />
          </div>
        )}
        <span className="absolute bottom-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
          {formatMeta(course.format).icon} {formatMeta(course.format).label}
        </span>
      </div>

      <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
          {course.category}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={levelColor(course.level)}>
          {course.level}
        </span>
      </div>

      <h3 className="font-semibold text-sm mb-1 leading-snug" style={{ color: 'var(--text-primary)' }}>{course.title}</h3>
      <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>

      <div className="flex items-center gap-3 text-xs mt-auto mb-2" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.students || 0}</span>
        {course.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{course.duration}</span>}
        {course.rating ? <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-400 fill-current" />{course.rating}</span> : null}
      </div>
      <div className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>By {course.instructor || course.author_name}</div>

      <button onClick={() => navigate(`/courses/${course.id}`)} className="cyber-btn-ghost text-xs w-full flex items-center justify-center gap-1.5">
        <Eye className="w-3.5 h-3.5" /> View Course
      </button>
    </div>
  )
}

// ── Detail page (full page, not a modal) ─────────────────────────────────────────
// Mount this at a route like <Route path="/courses/:id" element={<CourseDetailPage />} />
// in your router (e.g. App.tsx / routes file) alongside the existing <CoursesPage /> route.
export function CourseDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    const fetchCourse = async () => {
      setLoading(true)
      setNotFound(false)
      const { data, error } = await supabase.from('courses').select('*').eq('id', id).single()
      if (cancelled) return
      if (error || !data) {
        setNotFound(true)
      } else {
        setCourse(data as Course)
      }
      setLoading(false)
    }
    if (id) fetchCourse()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 flex justify-center">
        <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (notFound || !course) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
        <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>Course not found</div>
        <button onClick={() => navigate('/courses')} className="cyber-btn text-sm mt-4">Back to Courses</button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/courses')} className="cyber-btn-ghost text-xs mb-4 inline-flex items-center gap-1.5">
        ← Back to Courses
      </button>

      <div className="glass-card p-0 overflow-hidden">
        <div className="relative">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt={course.title} className="w-full h-56 sm:h-72 object-cover" />
          ) : (
            <div className="w-full h-56 sm:h-72 flex items-center justify-center" style={{ background: 'var(--accent-dim)' }}>
              <BookOpen className="w-10 h-10 opacity-40" style={{ color: 'var(--accent)' }} />
            </div>
          )}
        </div>

        <div className="p-5 sm:p-8">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
              {course.category}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={levelColor(course.level)}>
              {course.level}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--input-bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {formatMeta(course.format).icon} {formatMeta(course.format).label}
            </span>
          </div>

          <h1 className="font-bold text-2xl sm:text-3xl mb-1" style={{ color: 'var(--text-primary)' }}>{course.title}</h1>
          <div className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            By {course.instructor || course.author_name}
            {course.duration && <> · {course.duration}</>}
          </div>

          {course.description && (
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
          )}

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <BlockRenderer blocks={course.content_blocks || []} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Block editor (used inside the submit modal) ─────────────────────────────────
function BlockEditor({ blocks, setBlocks }: { blocks: ContentBlock[]; setBlocks: (b: ContentBlock[]) => void }) {
  const addBlock = (type: BlockType) => {
    const base: ContentBlock = { id: uid(), type }
    setBlocks([...blocks, base])
  }
  const updateBlock = (id: string, patch: Partial<ContentBlock>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, ...patch } : b))
  }
  const removeBlock = (id: string) => setBlocks(blocks.filter(b => b.id !== id))
  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= blocks.length) return
    const copy = [...blocks]
    ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
    setBlocks(copy)
  }

  const blockLabel = (type: BlockType) => ({
    heading: 'Heading',
    paragraph: 'Paragraph',
    image: 'Image',
    video: 'Video',
  }[type])

  const blockIcon = (type: BlockType) => {
    if (type === 'heading') return <HeadingIcon className="w-3.5 h-3.5" />
    if (type === 'paragraph') return <Type className="w-3.5 h-3.5" />
    if (type === 'image') return <ImageIcon className="w-3.5 h-3.5" />
    return <Film className="w-3.5 h-3.5" />
  }

  return (
    <div>
      <label className="text-xs mb-2 block font-semibold" style={{ color: 'var(--text-secondary)' }}>
        Course Body — add sections, paragraphs, images and videos in any order
      </label>

      {blocks.length === 0 && (
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          No sections yet. Use the buttons below to start building the course content.
        </p>
      )}

      <div className="space-y-3 mb-3">
        {blocks.map((block, idx) => (
          <div key={block.id} className="rounded-lg p-3" style={{ border: '1px solid var(--border)', background: 'var(--input-bg)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--accent)' }}>
                <GripVertical className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
                {blockIcon(block.type)} {blockLabel(block.type)} #{idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}
                  className="p-1 rounded" style={{ color: idx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: idx === 0 ? 0.4 : 1 }}>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1}
                  className="p-1 rounded" style={{ color: idx === blocks.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)', opacity: idx === blocks.length - 1 ? 0.4 : 1 }}>
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => removeBlock(block.id)} className="p-1 rounded" style={{ color: '#ef4444' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {block.type === 'heading' && (
              <input className="cyber-input text-sm" placeholder="Section heading, e.g. 'Chapter 1: Getting Started'"
                value={block.text || ''} onChange={e => updateBlock(block.id, { text: e.target.value })} />
            )}

            {block.type === 'paragraph' && (
              <textarea className="cyber-input text-sm resize-none h-24" placeholder="Write this section's content..."
                value={block.text || ''} onChange={e => updateBlock(block.id, { text: e.target.value })} />
            )}

            {block.type === 'image' && (
              <div className="space-y-2">
                <FileUploader
                  key={`block-uploader-${block.id}`}
                  label=""
                  value={block.url || ''}
                  onChange={url => updateBlock(block.id, { url })}
                  accept="image/*"
                />
                <input className="cyber-input text-xs" placeholder="Optional caption"
                  value={block.caption || ''} onChange={e => updateBlock(block.id, { caption: e.target.value })} />
              </div>
            )}

            {block.type === 'video' && (
              <div className="space-y-2">
                <input className="cyber-input text-sm" placeholder="Paste a YouTube (or Facebook) video URL"
                  value={block.videoUrl || ''} onChange={e => updateBlock(block.id, { videoUrl: e.target.value })} />
                <input className="cyber-input text-xs" placeholder="Optional caption"
                  value={block.caption || ''} onChange={e => updateBlock(block.id, { caption: e.target.value })} />
                {block.videoUrl && getEmbedSrc(block.videoUrl) && (
                  <div className="rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <iframe src={getEmbedSrc(block.videoUrl)!} className="w-full h-full" allowFullScreen title="Video preview" style={{ border: 'none' }} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => addBlock('heading')} className="cyber-btn-ghost text-xs flex items-center gap-1.5">
          <HeadingIcon className="w-3.5 h-3.5" /> Add Heading
        </button>
        <button type="button" onClick={() => addBlock('paragraph')} className="cyber-btn-ghost text-xs flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5" /> Add Paragraph
        </button>
        <button type="button" onClick={() => addBlock('image')} className="cyber-btn-ghost text-xs flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" /> Add Image
        </button>
        <button type="button" onClick={() => addBlock('video')} className="cyber-btn-ghost text-xs flex items-center gap-1.5">
          <Film className="w-3.5 h-3.5" /> Add Video
        </button>
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  title: '', category: '', level: '' as CourseLevel | '', duration: '',
  description: '', instructor: '', format: 'text_video' as CourseFormat,
  thumbnail: '', blocks: [] as ContentBlock[],
})

export default function CoursesPage() {
  const { user, profile } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All Categories')
  const [level, setLevel] = useState('All Levels')
  const [format, setFormat] = useState('All Formats')
  const [showSubmit, setShowSubmit] = useState(false)
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    setLoading(true)
    const { data } = await supabase.from('courses').select('*').eq('approved', true).order('created_at', { ascending: false })
    setCourses((data || []) as Course[])
    setLoading(false)
  }

  const filtered = courses.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.description?.toLowerCase().includes(search.toLowerCase())) return false
    if (category !== 'All Categories' && c.category !== category) return false
    if (level !== 'All Levels' && c.level !== level) return false
    if (format !== 'All Formats' && c.format !== format) return false
    return true
  })

  const handleSubmit = async () => {
    setFormError(null)
    if (!form.title.trim()) return setFormError('Please add a course title.')
    if (!form.category) return setFormError('Please select a category.')
    if (!form.level) return setFormError('Please select a difficulty level.')
    if (!form.thumbnail) return setFormError('Please upload a thumbnail image.')
    if (form.blocks.length === 0) return setFormError('Add at least one section to the course body.')

    setSubmitting(true)
    const { error } = await supabase.from('courses').insert({
      title: form.title.trim(),
      category: form.category,
      level: form.level,
      format: form.format,
      duration: form.duration,
      description: form.description.trim(),
      instructor: form.instructor.trim(),
      thumbnail: form.thumbnail,
      content_blocks: form.blocks,
      approved: false,
      author_id: user?.id,
      author_name: getDisplayName(profile),
      students: 0,
    })
    setSubmitting(false)
    if (error) {
      setFormError('Could not submit course: ' + error.message)
      return
    }
    setShowSubmit(false)
    setForm(emptyForm())
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
        <select className="cyber-select sm:w-40" value={level} onChange={e => setLevel(e.target.value)}>
          <option>All Levels</option>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="cyber-select sm:w-40" value={format} onChange={e => setFormat(e.target.value)}>
          <option>All Formats</option>
          {FORMATS.map(f => <option key={f.value} value={f.value}>{f.icon} {f.label}</option>)}
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
          <div className="modal-content p-5 sm:p-6" style={{ maxWidth: 640, maxHeight: '85vh', overflowY: 'auto' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>Submit a Course</h2>
              <button onClick={() => setShowSubmit(false)} className="theme-toggle"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-3">
              <input className="cyber-input" placeholder="Course title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

              <div className="grid grid-cols-2 gap-3">
                <select className="cyber-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option value="">Category *</option>
                  {CATEGORIES.slice(1).map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="cyber-select" value={form.level} onChange={e => setForm({ ...form, level: e.target.value as CourseLevel })}>
                  <option value="">Difficulty *</option>
                  {LEVELS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input className="cyber-input" placeholder="Instructor name" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} />
                <input className="cyber-input" placeholder="Duration (e.g. 4 weeks)" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} />
              </div>

              <textarea className="cyber-input resize-none h-20" placeholder="Short description (shown on the course card)"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

              {/* Course format */}
              <div>
                <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--text-secondary)' }}>Course Format *</label>
                <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                  {FORMATS.map(f => (
                    <button key={f.value} type="button" onClick={() => setForm({ ...form, format: f.value })}
                      className="flex-1 py-2 text-xs font-medium transition-colors"
                      style={form.format === f.value
                        ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
                        : { background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thumbnail (required) */}
              <div>
                <label className="text-xs mb-1.5 block font-semibold" style={{ color: 'var(--text-secondary)' }}>Course Thumbnail *</label>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                  Recommended size: 1280×720px (16:9 landscape). JPG or PNG, max 2MB. This image is cropped with <code>object-cover</code>, so keep the subject centered.
                </p>
                <FileUploader
                  key="thumbnail-uploader"
                  label=""
                  value={form.thumbnail}
                  onChange={url => setForm({ ...form, thumbnail: url })}
                  accept="image/*"
                />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                <BlockEditor blocks={form.blocks} setBlocks={blocks => setForm({ ...form, blocks })} />
              </div>

              {formError && (
                <p className="text-xs rounded-lg p-2" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  {formError}
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
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
