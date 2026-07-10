import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Trash2, Check, X, Users, Vote, BarChart2, Settings, Camera, Save, AlertTriangle, Lock, Ban } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, getDisplayName } from '../contexts/AuthContext'

interface Candidate { id: string; name: string; position: string; image_url?: string; status: string; sort_order?: number; contribution?: number }
interface ElectionSettings { election_open: boolean; results_visible: boolean; allow_changes: boolean; live_count_visible: boolean }

type AdminView = 'overview' | 'candidates' | 'results' | 'final' | 'settings'

const POSITIONS = [
  'President',
  'Vice President',
  'Secretary General',
  'Financial Secretary',
  'Assistant Secretary General',
  'Treasurer',
  'Director of Welfare',
  'Director of ICT & Research',
  'Director of Socials',
  'Director of Protocol (PRO)',
  'Director of Sports',
]

function ToggleSwitch({ value, onToggle, label, description }: {
  value: boolean; onToggle: () => void; label: string; description?: string
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl"
      style={{ background: '#f8fafc', border: '1px solid #e8eef6' }}>
      <div>
        <div className="font-semibold text-sm" style={{ color: '#0f172a' }}>{label}</div>
        {description && <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{description}</div>}
      </div>
      <button onClick={onToggle}
        className="w-14 h-7 rounded-full transition-all relative shrink-0 ml-4"
        style={{ background: value ? '#1a9ef4' : '#cbd5e1' }}>
        <div className="w-6 h-6 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
          style={{ left: value ? '32px' : '2px' }} />
      </button>
    </div>
  )
}

function StatCard({ value, label, color = '#1a9ef4' }: { value: string | number; label: string; color?: string }) {
  return (
    <div className="rounded-2xl p-4 text-center" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      <div className="text-xs mt-1 font-medium tracking-wider" style={{ color: '#94a3b8' }}>{label}</div>
    </div>
  )
}

export default function ElectionAdminPortal({ onBack }: { onBack: () => void }) {
  const { profile } = useAuth()
  const [activeView, setActiveView] = useState<AdminView>('overview')
  const [settings, setSettings] = useState<ElectionSettings>({ election_open: false, results_visible: false, allow_changes: true, live_count_visible: false })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [resettingVotes, setResettingVotes] = useState(false)
  const [contributionInput, setContributionInput] = useState<Record<string, string>>({})
  const [savingContribution, setSavingContribution] = useState<Record<string, boolean>>({})
  const realtimeRef = useRef<any>(null)

  const [drafts, setDrafts] = useState<Record<string, { name: string; image_url: string; imagePreview: string | null; uploading: boolean; saving: boolean }>>(
    () => Object.fromEntries(POSITIONS.map(p => [p, { name: '', image_url: '', imagePreview: null, uploading: false, saving: false }]))
  )
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // ── FIX: admin portal previously fetched candidates/votes/submissions
  // ONCE on mount (`useEffect(() => { fetchAll() }, [])`) with no realtime
  // subscription — unlike ElectionVoting.tsx and ElectionResults, which both
  // subscribe to postgres_changes. That meant totalVoters/totalVotesCast
  // (derived from that one-time snapshot) froze the moment you opened the
  // Admin tab and never updated again until you left and re-entered the view.
  // Adding the same realtime subscription pattern here so fetchAll() re-runs
  // whenever election_votes, election_submissions, or election_candidates change.
  useEffect(() => {
    fetchAll()
    const channel = supabase
      .channel('admin-election-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_votes' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_submissions' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_candidates' }, () => fetchAll())
      .subscribe()
    realtimeRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: s }, { data: c }, { data: v }, { data: sub }] = await Promise.all([
      supabase.from('election_settings').select('*').eq('id', 1).single(),
      supabase.from('election_candidates').select('*').order('created_at'),
      supabase.from('election_votes').select('*'),
      supabase.from('election_submissions').select('*'),
    ])
    if (s) setSettings({ ...s, live_count_visible: s.live_count_visible ?? false })
    setCandidates(c || [])
    setVotes(v || [])
    setSubmissions(sub || [])
    setLoading(false)
  }

  const updateSetting = async (key: keyof ElectionSettings, value: boolean) => {
    setSavingSettings(true)
    const updated = { ...settings, [key]: value, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('election_settings').update(updated).eq('id', 1)
    if (error) {
      alert('Failed to update setting: ' + error.message)
    } else {
      setSettings(prev => ({ ...prev, [key]: value }))
    }
    setSavingSettings(false)
  }

  const handleImageUpload = async (position: string, file: File) => {
    setDrafts(prev => ({ ...prev, [position]: { ...prev[position], uploading: true } }))
    const ext = file.name.split('.').pop()
    const path = `candidate-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('candidates').upload(path, file, { upsert: true })
    if (error) {
      alert('Image upload failed: ' + error.message)
      setDrafts(prev => ({ ...prev, [position]: { ...prev[position], uploading: false } }))
      return
    }
    const { data } = supabase.storage.from('candidates').getPublicUrl(path)
    setDrafts(prev => ({
      ...prev,
      [position]: { ...prev[position], image_url: data.publicUrl, imagePreview: data.publicUrl, uploading: false }
    }))
  }

  const saveCandidate = async (position: string) => {
    const draft = drafts[position]
    if (!draft.name.trim()) return
    setDrafts(prev => ({ ...prev, [position]: { ...prev[position], saving: true } }))
    await supabase.from('election_candidates').insert({
      name: draft.name.trim(),
      position,
      image_url: draft.image_url || null,
      status: 'active',
    })
    setDrafts(prev => ({
      ...prev,
      [position]: { name: '', image_url: '', imagePreview: null, uploading: false, saving: false }
    }))
    fetchAll()
  }

  const cycleStatus = async (id: string, status: string) => {
    let newStatus: string
    if (status === 'active') newStatus = 'suspended'
    else if (status === 'suspended') newStatus = 'active'
    else newStatus = 'active'
    await supabase.from('election_candidates').update({ status: newStatus }).eq('id', id)
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  const disqualifyCandidate = async (id: string, currentStatus: string) => {
    if (currentStatus === 'disqualified') {
      await supabase.from('election_candidates').update({ status: 'active' }).eq('id', id)
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c))
      return
    }
    if (!confirm('Disqualify this candidate? They will be removed from voting and their votes will not count.')) return
    await supabase.from('election_candidates').update({ status: 'disqualified' }).eq('id', id)
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: 'disqualified' } : c))
  }

  const deleteCandidate = async (id: string) => {
    if (!confirm('Delete this candidate and their votes?')) return
    await supabase.from('election_votes').delete().eq('candidate_id', id)
    await supabase.from('election_candidates').delete().eq('id', id)
    fetchAll()
  }

  const resetVotes = async () => {
    if (!confirm('Reset ALL votes and submissions? This cannot be undone.')) return
    setResettingVotes(true)
    try {
      const results = await Promise.all([
        supabase.from('election_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('election_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('election_candidates').update({ contribution: 0 }).neq('id', '00000000-0000-0000-0000-000000000000'),
      ])
      const failed = results.find(r => r.error)
      if (failed?.error) {
        alert('Reset partially failed: ' + failed.error.message)
      }
    } finally {
      await fetchAll()
      setResettingVotes(false)
    }
  }

  const updateContribution = async (id: string, amount: number) => {
    if (amount < 0) amount = 0
    setSavingContribution(prev => ({ ...prev, [id]: true }))
    const { error } = await supabase.from('election_candidates').update({ contribution: amount }).eq('id', id)
    if (!error) {
      setCandidates(prev => prev.map(c => c.id === id ? { ...c, contribution: amount } : c))
    }
    setSavingContribution(prev => ({ ...prev, [id]: false }))
  }

  const adjustContribution = async (id: string, delta: number) => {
    const candidate = candidates.find(c => c.id === id)
    const current = candidate?.contribution ?? 0
    await updateContribution(id, current + delta)
  }

  const activeCandidates = candidates.filter(c => c.status === 'active')
  const suspendedCandidates = candidates.filter(c => c.status === 'suspended')
  const disqualifiedCandidates = candidates.filter(c => c.status === 'disqualified')
  const voteCountFor = (id: string) => {
    const ballotVotes = votes.filter(v => v.candidate_id === id).length
    const sponsorVotes = candidates.find(c => c.id === id)?.contribution ?? 0
    return ballotVotes + sponsorVotes
  }
  const candidatesForPosition = (position: string) => candidates.filter(c => c.position === position)

  const totalContributions = candidates.reduce((s, c) => s + (c.contribution ?? 0), 0)
  const totalVotesCast = votes.length + totalContributions
  const totalVoters = submissions.length + totalContributions

  const navItems: { id: AdminView; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'results', label: 'Live Count', icon: Vote },
    { id: 'final', label: 'Final Result', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  const getStatusStyle = (status: string) => {
    if (status === 'active') return { background: '#d1fae5', color: '#065f46' }
    if (status === 'suspended') return { background: '#fee2e2', color: '#991b1b' }
    if (status === 'disqualified') return { background: '#fef3c7', color: '#92400e' }
    return { background: '#f1f5f9', color: '#64748b' }
  }

  const getStatusLabel = (status: string) => {
    if (status === 'active') return 'Active'
    if (status === 'suspended') return '🚫 Suspended'
    if (status === 'disqualified') return '❌ Disqualified'
    return status
  }

  return (
    <div className="election-portal-bg min-h-screen">
      <div className="sticky top-0 z-10" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8eef6' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="font-bold text-sm" style={{ color: '#0f172a' }}>
            Election <span style={{ color: '#1a9ef4' }}>Admin</span>
          </div>
          <div className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#eff6ff', color: '#1a6fc4' }}>
            {getDisplayName(profile)}
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveView(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={activeView === id
                ? { background: id === 'final' ? '#f59e0b' : '#1a9ef4', color: '#fff' }
                : { background: '#f1f5f9', color: '#64748b' }}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 rounded-full animate-spin"
            style={{ border: '3px solid #e2eaf4', borderTopColor: '#1a9ef4' }} />
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* ── Overview ── */}
          {activeView === 'overview' && (
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0f172a' }}>Election Overview</h2>
              <div className="rounded-2xl p-4 mb-5 flex items-center justify-between"
                style={{
                  background: settings.election_open ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)' : 'linear-gradient(135deg, #fee2e2, #fecaca)',
                  border: `1px solid ${settings.election_open ? '#6ee7b7' : '#fca5a5'}`
                }}>
                <div>
                  <div className="font-bold" style={{ color: settings.election_open ? '#065f46' : '#991b1b' }}>
                    Election is {settings.election_open ? 'OPEN' : 'CLOSED'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: settings.election_open ? '#047857' : '#b91c1c' }}>
                    {settings.election_open ? 'Members can currently vote' : 'Voting is not active'}
                  </div>
                </div>
                <button onClick={() => updateSetting('election_open', !settings.election_open)}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all"
                  style={{ background: settings.election_open ? '#ef4444' : '#10b981' }}>
                  {savingSettings ? '...' : settings.election_open ? 'Close' : 'Open'}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <StatCard value={activeCandidates.length} label="ACTIVE" />
                <StatCard value={suspendedCandidates.length} label="SUSPENDED" color="#ef4444" />
                <StatCard value={disqualifiedCandidates.length} label="DISQUALIFIED" color="#f59e0b" />
                <StatCard value={totalVoters} label="VOTERS" color="#10b981" />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <StatCard value={totalVotesCast} label="TOTAL VOTES CAST" color="#8b5cf6" />
                <StatCard value={POSITIONS.filter(p => candidates.some(c => c.position === p)).length} label="ACTIVE POSITIONS" color="#1a9ef4" />
              </div>

              <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Quick Settings</span>
                </div>
                {[
                  { key: 'election_open' as const, label: 'Election Open', desc: 'Allow members to vote' },
                  { key: 'live_count_visible' as const, label: 'Show Live Count', desc: 'Show real-time vote totals and per-candidate counts to voters' },
                  { key: 'results_visible' as const, label: 'Show Final Result', desc: 'Publish winners to voters — shows animated results page' },
                  { key: 'allow_changes' as const, label: 'Allow Vote Changes', desc: 'Before final submission' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color: '#0f172a' }}>{label}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>{desc}</div>
                    </div>
                    <button onClick={() => updateSetting(key, !settings[key])}
                      className="w-12 h-6 rounded-full transition-all relative shrink-0"
                      style={{ background: settings[key] ? '#1a9ef4' : '#cbd5e1' }}>
                      <div className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all shadow-sm"
                        style={{ left: settings[key] ? '26px' : '2px' }} />
                    </button>
                  </div>
                ))}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#ef4444' }}>Reset All Votes</div>
                    <div className="text-xs" style={{ color: '#94a3b8' }}>Clear all votes, submissions, and sponsor contributions</div>
                  </div>
                  <button onClick={resetVotes} disabled={resettingVotes}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: resettingVotes ? '#fca5a5' : '#ef4444' }}>
                    {resettingVotes ? 'Resetting...' : 'Reset'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Candidates ── */}
          {activeView === 'candidates' && (
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: '#0f172a' }}>Manage Candidates</h2>
              <p className="text-xs mb-5" style={{ color: '#94a3b8' }}>
                Add candidates per position. Suspend to temporarily hide, or Disqualify to permanently remove from voting.
              </p>

              {POSITIONS.map((position, idx) => {
                const existing = candidatesForPosition(position)
                const draft = drafts[position]

                return (
                  <div key={position} className="rounded-2xl mb-4 overflow-hidden"
                    style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

                    <div className="px-4 py-3 flex items-center gap-3"
                      style={{ background: 'linear-gradient(90deg, #eff6ff, #f8fafc)', borderBottom: '1px solid #e8eef6' }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: '#1a9ef4' }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{position}</div>
                        <div className="text-xs flex gap-2 flex-wrap" style={{ color: '#94a3b8' }}>
                          <span>{existing.filter(c => c.status === 'active').length} active</span>
                          {existing.filter(c => c.status === 'suspended').length > 0 &&
                            <span style={{ color: '#ef4444' }}>· {existing.filter(c => c.status === 'suspended').length} suspended</span>}
                          {existing.filter(c => c.status === 'disqualified').length > 0 &&
                            <span style={{ color: '#f59e0b' }}>· {existing.filter(c => c.status === 'disqualified').length} disqualified</span>}
                        </div>
                      </div>
                    </div>

                    {existing.length > 0 && (
                      <div className="px-4 pt-3 space-y-2">
                        {existing.map(candidate => (
                          <div key={candidate.id}
                            className="flex items-center justify-between gap-3 py-2 px-3 rounded-xl"
                            style={{
                              background: candidate.status === 'disqualified' ? '#fffbeb' : candidate.status === 'suspended' ? '#fff5f5' : 'transparent',
                              border: candidate.status === 'disqualified' ? '1px solid #fde68a' : candidate.status === 'suspended' ? '1px solid #fecaca' : '1px solid transparent',
                              marginBottom: 4,
                              opacity: candidate.status !== 'active' ? 0.85 : 1
                            }}>
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="relative shrink-0">
                                {candidate.image_url ? (
                                  <img src={candidate.image_url} alt={candidate.name}
                                    className="w-9 h-9 rounded-full object-cover"
                                    style={{ border: '2px solid #e8eef6', filter: candidate.status !== 'active' ? 'grayscale(0.7)' : 'none' }} />
                                ) : (
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                                    style={{ background: candidate.status !== 'active' ? '#94a3b8' : 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' }}>
                                    {candidate.name[0]?.toUpperCase()}
                                  </div>
                                )}
                                {candidate.status === 'suspended' && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                    style={{ background: '#ef4444' }}>
                                    <Lock style={{ width: 8, height: 8, color: '#fff' }} />
                                  </div>
                                )}
                                {candidate.status === 'disqualified' && (
                                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
                                    style={{ background: '#f59e0b' }}>
                                    <Ban style={{ width: 8, height: 8, color: '#fff' }} />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-sm truncate" style={{ color: candidate.status !== 'active' ? '#94a3b8' : '#0f172a' }}>
                                  {candidate.name}
                                  {candidate.status !== 'active' && (
                                    <span className="ml-1 text-xs" style={{ color: candidate.status === 'disqualified' ? '#d97706' : '#ef4444' }}>
                                      ({candidate.status === 'disqualified' ? 'Disqualified' : 'Suspended'})
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs" style={{ color: '#94a3b8' }}>{voteCountFor(candidate.id)} votes</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={getStatusStyle(candidate.status)}>
                                {getStatusLabel(candidate.status)}
                              </span>
                              {candidate.status !== 'disqualified' && (
                                <button onClick={() => cycleStatus(candidate.id, candidate.status)}
                                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                  title={candidate.status === 'active' ? 'Suspend candidate' : 'Restore candidate'}
                                  style={candidate.status === 'active'
                                    ? { background: '#fee2e2', color: '#dc2626' }
                                    : { background: '#d1fae5', color: '#059669' }}>
                                  {candidate.status === 'active' ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                              )}
                              <button onClick={() => disqualifyCandidate(candidate.id, candidate.status)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                title={candidate.status === 'disqualified' ? 'Restore from disqualification' : 'Disqualify candidate'}
                                style={candidate.status === 'disqualified'
                                  ? { background: '#d1fae5', color: '#059669' }
                                  : { background: '#fef3c7', color: '#d97706' }}>
                                {candidate.status === 'disqualified'
                                  ? <Check className="w-3.5 h-3.5" />
                                  : <Ban className="w-3.5 h-3.5" />}
                              </button>
                              <button onClick={() => deleteCandidate(candidate.id)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                                style={{ background: '#fee2e2', color: '#dc2626' }}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="px-4 py-4">
                      <div className="flex gap-3 items-start">
                        <div className="shrink-0">
                          <div
                            onClick={() => fileInputRefs.current[position]?.click()}
                            className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer transition-all overflow-hidden"
                            style={{
                              background: draft.imagePreview ? 'transparent' : '#f1f5f9',
                              border: draft.imagePreview ? '2px solid #1a9ef4' : '2px dashed #cbd5e1'
                            }}>
                            {draft.uploading ? (
                              <div className="w-5 h-5 rounded-full animate-spin"
                                style={{ border: '2px solid #e2eaf4', borderTopColor: '#1a9ef4' }} />
                            ) : draft.imagePreview ? (
                              <img src={draft.imagePreview} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="w-5 h-5" style={{ color: '#94a3b8' }} />
                            )}
                          </div>
                          <p className="text-center text-xs mt-1" style={{ color: '#94a3b8', fontSize: '10px' }}>
                            {draft.imagePreview ? 'Change' : 'Photo'}
                          </p>
                          <input
                            ref={el => { fileInputRefs.current[position] = el }}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={draft.uploading}
                            onChange={e => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(position, file)
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <input
                            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all mb-2"
                            style={{ background: '#f8fafc', border: '1px solid #e8eef6', color: '#0f172a' }}
                            placeholder="Candidate's full name"
                            value={draft.name}
                            onChange={e => setDrafts(prev => ({ ...prev, [position]: { ...prev[position], name: e.target.value } }))}
                            onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1a9ef4'}
                            onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e8eef6'}
                            onKeyDown={e => { if (e.key === 'Enter') saveCandidate(position) }}
                          />
                          <button
                            onClick={() => saveCandidate(position)}
                            disabled={!draft.name.trim() || draft.saving || draft.uploading}
                            className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                            style={{
                              background: draft.name.trim() && !draft.saving ? '#1a9ef4' : '#e2e8f0',
                              color: draft.name.trim() && !draft.saving ? '#fff' : '#94a3b8',
                              cursor: draft.name.trim() && !draft.saving ? 'pointer' : 'not-allowed'
                            }}>
                            <Save className="w-3.5 h-3.5" />
                            {draft.saving ? 'Saving...' : 'Save Candidate'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Live Count ── */}
          {activeView === 'results' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Live Vote Count</h2>
                <span className="text-xs px-3 py-1 rounded-full font-medium animate-pulse"
                  style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                  🔴 Live
                </span>
              </div>
              <p className="text-xs mb-5" style={{ color: '#94a3b8' }}>
                Real-time count as votes come in. Candidates shown in order added.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{totalVoters}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>TOTAL VOTERS</div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{totalVotesCast}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>TOTAL VOTES CAST</div>
                </div>
              </div>

              {POSITIONS.map(position => {
                const posCandidates = candidates.filter(c => c.position === position)
                const total = posCandidates.reduce((s, c) => s + voteCountFor(c.id), 0)
                return (
                  <div key={position} className="rounded-2xl p-5 mb-4"
                    style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold" style={{ color: '#0f172a' }}>{position}</h3>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#eff6ff', color: '#1a6fc4' }}>{total} total votes</span>
                    </div>
                    {posCandidates.length === 0 ? (
                      <p className="text-xs" style={{ color: '#cbd5e1' }}>No candidates added yet</p>
                    ) : (
                      <div className="space-y-3">
                        {posCandidates.map(candidate => {
                          const count = voteCountFor(candidate.id)
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0
                          const isDisqualified = candidate.status === 'disqualified'
                          const isSuspended = candidate.status === 'suspended'
                          return (
                            <div key={candidate.id} style={{ opacity: isDisqualified ? 0.5 : isSuspended ? 0.65 : 1 }}>
                              <div className="flex items-center gap-3 mb-2">
                                {candidate.image_url ? (
                                  <img src={candidate.image_url} alt={candidate.name}
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                    style={{ border: '2px solid #e8eef6', filter: candidate.status !== 'active' ? 'grayscale(1)' : 'none' }} />
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                    style={{ background: candidate.status !== 'active' ? '#94a3b8' : 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' }}>
                                    {candidate.name[0]?.toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold" style={{ color: candidate.status !== 'active' ? '#94a3b8' : '#0f172a' }}>{candidate.name}</span>
                                    {isSuspended && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#fee2e2', color: '#dc2626' }}>🚫 Suspended</span>}
                                    {isDisqualified && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#fef3c7', color: '#d97706' }}>❌ Disqualified</span>}
                                  </div>
                                </div>
                                <span className="text-sm font-bold shrink-0" style={{ color: '#64748b' }}>{count} <span style={{ fontSize: 10, color: '#94a3b8' }}>({pct}%)</span></span>
                              </div>
                              <div className="w-full h-2.5 rounded-full ml-11" style={{ background: '#f1f5f9' }}>
                                <div className="h-2.5 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: isDisqualified ? '#fde68a' : isSuspended ? '#cbd5e1' : 'linear-gradient(90deg, #1a9ef4, #1a6fc4)' }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Final Result ── */}
          {activeView === 'final' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Final Election Result</h2>
                <span className="text-xs px-3 py-1 rounded-full font-bold"
                  style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                  🏆 Official
                </span>
              </div>
              <div className="rounded-xl p-3 mb-3 text-sm"
                style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' }}>
                <strong>Admin only.</strong> Toggle "Show Final Result" in Quick Settings to publish winners to voters.
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e8eef6' }}>
                  <div className="text-2xl font-bold" style={{ color: '#10b981' }}>{totalVoters}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>TOTAL VOTERS</div>
                </div>
                <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e8eef6' }}>
                  <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{totalVotesCast}</div>
                  <div className="text-xs font-medium mt-1" style={{ color: '#94a3b8' }}>TOTAL VOTES CAST</div>
                </div>
              </div>

              {POSITIONS.map((position, posIdx) => {
                const allPos = candidates.filter(c => c.position === position)
                const eligibleCandidates = [...allPos.filter(c => c.status === 'active')]
                  .sort((a, b) => voteCountFor(b.id) - voteCountFor(a.id))
                const ineligible = allPos.filter(c => c.status !== 'active')
                const total = allPos.reduce((s, c) => s + voteCountFor(c.id), 0)
                const winner = eligibleCandidates[0]

                return (
                  <div key={position} className="rounded-2xl p-5 mb-4"
                    style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: '#f59e0b' }}>{posIdx + 1}</div>
                      <h3 className="font-bold flex-1" style={{ color: '#0f172a' }}>{position}</h3>
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: '#eff6ff', color: '#1a6fc4' }}>{total} total votes</span>
                    </div>

                    {eligibleCandidates.length === 0 ? (
                      <p className="text-xs" style={{ color: '#cbd5e1' }}>No active candidates</p>
                    ) : (
                      <div className="space-y-4">
                        {eligibleCandidates.map((candidate, idx) => {
                          const count = voteCountFor(candidate.id)
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0
                          const isWinner = idx === 0 && count > 0 && count > (voteCountFor(eligibleCandidates[1]?.id) || 0)
                          return (
                            <div key={candidate.id}>
                              <div className="flex items-center gap-3 mb-2">
                                {candidate.image_url ? (
                                  <img src={candidate.image_url} alt={candidate.name}
                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                    style={{ border: isWinner ? '2px solid #f59e0b' : '2px solid #e8eef6' }} />
                                ) : (
                                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                    style={{ background: isWinner ? 'linear-gradient(135deg, #f59e0b, #d97706)' : '#94a3b8' }}>
                                    {candidate.name[0]?.toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{candidate.name}</span>
                                    {isWinner && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: '#fef3c7', color: '#d97706' }}>👑 Winner</span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-bold shrink-0" style={{ color: isWinner ? '#f59e0b' : '#64748b' }}>{count} <span style={{ fontSize: 10 }}>({pct}%)</span></span>
                              </div>
                              <div className="w-full h-2.5 rounded-full ml-11" style={{ background: '#f1f5f9' }}>
                                <div className="h-2.5 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: isWinner ? 'linear-gradient(90deg, #f59e0b, #d97706)' : '#94a3b8' }} />
                              </div>
                              <div className="ml-11 mt-1 text-xs" style={{ color: '#94a3b8' }}>{count} vote{count !== 1 ? 's' : ''}</div>
                            </div>
                          )
                        })}

                        {ineligible.length > 0 && (
                          <div className="mt-2 pt-2" style={{ borderTop: '1px dashed #fde68a' }}>
                            <div className="text-xs font-semibold mb-2" style={{ color: '#94a3b8' }}>Not counted (suspended/disqualified):</div>
                            {ineligible.map(candidate => (
                              <div key={candidate.id} className="flex items-center gap-2 py-1 opacity-50">
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                  style={{ background: '#94a3b8' }}>{candidate.name[0]?.toUpperCase()}</div>
                                <span className="text-xs flex-1" style={{ color: '#94a3b8' }}>{candidate.name}</span>
                                <span className="text-xs px-1.5 py-0.5 rounded-full" style={getStatusStyle(candidate.status)}>{getStatusLabel(candidate.status)}</span>
                                <span className="text-xs ml-auto" style={{ color: '#94a3b8' }}>{voteCountFor(candidate.id)} votes</span>
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
          )}

          {/* ── Settings ── */}
          {activeView === 'settings' && (
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0f172a' }}>Election Settings</h2>
              <div className="space-y-3 mb-6">
                <ToggleSwitch
                  value={settings.election_open}
                  onToggle={() => updateSetting('election_open', !settings.election_open)}
                  label="Election Open"
                  description="Allow registered members to cast their vote"
                />
                <ToggleSwitch
                  value={settings.live_count_visible}
                  onToggle={() => updateSetting('live_count_visible', !settings.live_count_visible)}
                  label="Show Live Count to Voters"
                  description="Show real-time vote totals and per-candidate counts inside the voting interface"
                />
                <ToggleSwitch
                  value={settings.results_visible}
                  onToggle={() => updateSetting('results_visible', !settings.results_visible)}
                  label="Show Final Result to Voters"
                  description="Publish winners with animation — voters see final results page"
                />
                <ToggleSwitch
                  value={settings.allow_changes}
                  onToggle={() => updateSetting('allow_changes', !settings.allow_changes)}
                  label="Allow Vote Changes"
                  description="Members can change votes before final submission"
                />
              </div>
              <div className="rounded-2xl p-5" style={{ background: '#fff7f7', border: '2px solid #fee2e2' }}>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#991b1b' }}>Danger Zone</h3>
                <p className="text-xs mb-4" style={{ color: '#b91c1c' }}>
                  These actions are irreversible. Please proceed with caution.
                </p>
                <button onClick={resetVotes} disabled={resettingVotes}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: resettingVotes ? '#fca5a5' : '#ef4444' }}>
                  {resettingVotes ? 'Resetting...' : 'Reset All Votes & Submissions'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
