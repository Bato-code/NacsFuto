import { useState, useEffect } from 'react'
import { Search, Download, Eye, FileText, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

interface LectureNote {
  id: string; title: string; course_code: string; topic: string; level: string; semester: string
  file_url: string; file_name: string; file_size: number; file_type: string
  description: string; download_count: number; created_at: string
}

const LEVEL_GROUPS = ['200', '300', '400', '500']
const SEMESTERS = ['First', 'Second']

export default function LectureNotesPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notes, setNotes] = useState<LectureNote[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('All Levels')
  const [semesterFilter, setSemesterFilter] = useState('All Semesters')
  const [courseFilter, setCourseFilter] = useState('All Courses')
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  useEffect(() => { fetchNotes() }, [])

  const fetchNotes = async () => {
    setLoading(true)
    const { data } = await supabase.from('lecture_notes').select('*').order('created_at', { ascending: false })
    setNotes(data || [])
    // Open all sections by default
    const sections: Record<string, boolean> = {}
    LEVEL_GROUPS.forEach(l => SEMESTERS.forEach(s => { sections[`${l}-${s}`] = true }))
    setOpenSections(sections)
    setLoading(false)
  }

  const filtered = notes.filter(n => {
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.course_code?.toLowerCase().includes(search.toLowerCase())) return false
    if (levelFilter !== 'All Levels' && n.level !== levelFilter) return false
    if (semesterFilter !== 'All Semesters' && n.semester !== semesterFilter) return false
    if (courseFilter !== 'All Courses' && n.course_code !== courseFilter) return false
    return true
  })

  const courses = [...new Set(notes.map(n => n.course_code).filter(Boolean))]

  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadedId, setDownloadedId] = useState<string | null>(null)

  const handleDownload = async (note: LectureNote) => {
    if (!user) { navigate('/login'); return }
    setDownloadingId(note.id)
    await supabase.from('lecture_notes').update({ download_count: (note.download_count || 0) + 1 }).eq('id', note.id)
    window.open(note.file_url, '_blank')
    setNotes(prev => prev.map(n => n.id === note.id ? { ...n, download_count: (n.download_count || 0) + 1 } : n))
    setDownloadingId(null)
    setDownloadedId(note.id)
    setTimeout(() => setDownloadedId(null), 2000)
  }

  const toggleSection = (key: string) => setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-32 sm:h-36 rounded-xl overflow-hidden mb-6 flex items-center justify-center"
        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
        <FileText className="w-12 h-12 opacity-30" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="flex justify-center mb-4"><span className="terminal-badge">📝 ./lecture-notes</span></div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        Lecture <span style={{ color: 'var(--accent)' }}>Notes</span>
      </h1>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Access and download lecture notes based on your level, course, and semester.
      </p>

      {/* Filters */}
      <div className="glass-card p-3 sm:p-4 mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-40">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input className="cyber-input pl-9" placeholder="Search lecture notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="cyber-select sm:w-32" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
          <option>All Levels</option>
          {LEVEL_GROUPS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="cyber-select sm:w-36" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)}>
          <option>All Semesters</option>
          <option>First</option><option>Second</option>
        </select>
        <select className="cyber-select sm:w-36" value={courseFilter} onChange={e => setCourseFilter(e.target.value)}>
          <option>All Courses</option>
          {courses.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filtered.length}</span> of{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{notes.length}</span> lecture notes
        </p>
        {!user && <Link to="/login" className="text-xs" style={{ color: 'var(--accent)' }}>Sign in to download →</Link>}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        LEVEL_GROUPS.map(lvl => (
          <div key={lvl} className="mb-6">
            <div className="rounded-lg px-4 py-3 mb-3" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
              <h2 className="font-bold" style={{ color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent)' }}>{lvl}L</span> Level
              </h2>
            </div>
            {SEMESTERS.map(sem => {
              const key = `${lvl}-${sem}`
              const sectionNotes = filtered.filter(n => n.level === lvl && n.semester === sem)
              const isOpen = openSections[key] !== false
              return (
                <div key={key} className="glass-card mb-3 overflow-hidden">
                  <button onClick={() => toggleSection(key)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}>
                    <span className="text-sm font-medium">{sem} Semester ({sectionNotes.length} notes)</span>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
                  </button>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid var(--border)' }}>
                      {sectionNotes.length === 0 ? (
                        <div className="py-8 flex flex-col items-center" style={{ color: 'var(--text-muted)' }}>
                          <FileText className="w-8 h-8 mb-2 opacity-40" />
                          <span className="text-sm">No lecture notes available for this semester</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3">
                          {sectionNotes.map(note => (
                            <div key={note.id} className="rounded-lg p-3" style={{ background: 'var(--bg-dark)', border: '1px solid var(--border)' }}>
                              <div className="flex items-start gap-2 mb-2">
                                <FileText className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{note.title}</div>
                                  {note.topic && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{note.topic}</div>}
                                  {note.course_code && <div className="text-xs" style={{ color: 'var(--accent)' }}>{note.course_code}</div>}
                                </div>
                                <span className="text-xs flex items-center gap-1 shrink-0" style={{ color: 'var(--text-muted)' }}>
                                  <Download className="w-3 h-3" />{note.download_count || 0}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleDownload(note)}
                                  className={`flex-1 text-xs py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition-all ${downloadingId === note.id ? 'download-btn-loading' : downloadedId === note.id ? 'download-btn-success' : ''}`}
                                  style={user
                                    ? { borderColor: 'var(--accent-border)', color: 'var(--accent)' }
                                    : { borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                                  {downloadedId === note.id
                                    ? <><Check className="w-3 h-3" /> Downloaded!</>
                                    : <><Download className="w-3 h-3" />{downloadingId === note.id ? 'Downloading...' : user ? 'Download' : 'Sign in'}</>
                                  }
                                </button>
                                {note.file_url && (
                                  <a href={note.file_url} target="_blank" rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg border transition-colors"
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                                    <Eye className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))
      )}
    </div>
  )
}
