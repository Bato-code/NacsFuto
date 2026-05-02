import { useState, useEffect } from 'react'
import { Search, Download, Eye, FileText, Check } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'

interface Material {
  id: string; title: string; course_code: string; level: string; semester: string
  file_url: string; file_name: string; file_size: number; file_type: string
  description: string; download_count: number; created_at: string
}

const LEVELS = ['All Levels', '200', '300', '400', '500']
const SEMESTERS = ['All Semesters', 'First', 'Second']

function MaterialCard({ material, onDownload, canDownload, isDownloading, isDownloaded }: { material: Material; onDownload: (m: Material) => void; canDownload: boolean; isDownloading?: boolean; isDownloaded?: boolean }) {
  return (
    <div className="glass-card p-4 flex flex-col hover-lift">
      <div className="flex items-start justify-between mb-2">
        <FileText className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
        <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
          <Download className="w-3 h-3" />{material.download_count || 0}
        </span>
      </div>
      <h3 className="font-semibold text-sm mb-2 leading-snug flex-1" style={{ color: 'var(--text-primary)' }}>{material.title}</h3>
      <div className="text-xs space-y-0.5 mb-3" style={{ color: 'var(--text-muted)' }}>
        {material.course_code && <div>Course: <span style={{ color: 'var(--accent)' }}>{material.course_code}</span></div>}
        <div>Level: <span style={{ color: 'var(--text-secondary)' }}>{material.level}</span> &nbsp; Semester: <span style={{ color: 'var(--text-secondary)' }}>{material.semester}</span></div>
      </div>
      <div className="flex items-center gap-2 mt-auto">
        <button onClick={() => onDownload(material)}
          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 px-3 rounded-lg border transition-all ${isDownloading ? 'download-btn-loading' : isDownloaded ? 'download-btn-success' : ''}`}
          style={canDownload
            ? { borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'transparent' }
            : { borderColor: 'var(--border)', color: 'var(--text-muted)', background: 'transparent' }}>
          {isDownloaded
            ? <><Check className="w-3.5 h-3.5" /><span>Downloaded!</span></>
            : <><Download className="w-3.5 h-3.5" /><span>{isDownloading ? 'Downloading...' : canDownload ? 'Download' : 'Sign in'}</span></>
          }
        </button>
        {material.file_url && (
          <a href={material.file_url} target="_blank" rel="noopener noreferrer"
            className="p-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
            <Eye className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export default function PastQuestionsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('All Levels')
  const [semester, setSemester] = useState('All Semesters')
  const [courseCode, setCourseCode] = useState('')

  useEffect(() => { fetchMaterials() }, [])

  const fetchMaterials = async () => {
    setLoading(true)
    const { data } = await supabase.from('materials').select('*').order('created_at', { ascending: false })
    setMaterials(data || [])
    setLoading(false)
  }

  const filtered = materials.filter(m => {
    if (search && !m.title.toLowerCase().includes(search.toLowerCase()) && !m.course_code?.toLowerCase().includes(search.toLowerCase())) return false
    if (level !== 'All Levels' && m.level !== level) return false
    if (semester !== 'All Semesters' && m.semester !== semester) return false
    if (courseCode && !m.course_code?.toLowerCase().includes(courseCode.toLowerCase())) return false
    return true
  })

  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadedId, setDownloadedId] = useState<string | null>(null)

  const handleDownload = async (material: Material) => {
    if (!user) { navigate('/login'); return }
    setDownloadingId(material.id)
    await supabase.from('materials').update({ download_count: (material.download_count || 0) + 1 }).eq('id', material.id)
    await supabase.from('material_downloads').insert({ material_id: material.id, user_id: user.id })
    window.open(material.file_url, '_blank')
    setMaterials(prev => prev.map(m => m.id === material.id ? { ...m, download_count: (m.download_count || 0) + 1 } : m))
    setDownloadingId(null)
    setDownloadedId(material.id)
    setTimeout(() => setDownloadedId(null), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="h-32 sm:h-36 rounded-xl overflow-hidden mb-6 flex items-center justify-center"
        style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}>
        <FileText className="w-12 h-12 opacity-30" style={{ color: 'var(--accent)' }} />
      </div>

      <div className="flex justify-center mb-4"><span className="terminal-badge">📄 ./past-questions</span></div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        Past <span style={{ color: 'var(--accent)' }}>Questions</span>
      </h1>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
        Access and download past questions based on your level and semester.
      </p>

      {/* Filters */}
      <div className="glass-card p-3 sm:p-4 mb-6 flex flex-col sm:flex-row gap-3 flex-wrap">
        <select className="cyber-select sm:w-36" value={level} onChange={e => setLevel(e.target.value)}>
          {LEVELS.map(l => <option key={l}>{l}</option>)}
        </select>
        <select className="cyber-select sm:w-40" value={semester} onChange={e => setSemester(e.target.value)}>
          {SEMESTERS.map(s => <option key={s}>{s}</option>)}
        </select>
        <div className="relative flex-1 min-w-40">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input className="cyber-input pl-10" placeholder="Search by Course Code or Title" value={courseCode} onChange={e => setCourseCode(e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{filtered.length}</span> of{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{materials.length}</span> materials
        </p>
        {!user && (
          <Link to="/login" className="text-xs" style={{ color: 'var(--accent)' }}>Sign in to download →</Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <div className="font-semibold" style={{ color: 'var(--text-secondary)' }}>No materials found</div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Try adjusting your filters.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(m => <MaterialCard key={m.id} material={m} onDownload={handleDownload} canDownload={!!user} isDownloading={downloadingId === m.id} isDownloaded={downloadedId === m.id} />)}
        </div>
      )}
    </div>
  )
}
