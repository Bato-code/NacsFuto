import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Trash2, Check, X, Users, Vote, BarChart2, Settings, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Candidate { id: string; name: string; position: string; image_url?: string; status: string }
interface ElectionSettings { election_open: boolean; results_visible: boolean; allow_changes: boolean }

type AdminView = 'overview' | 'candidates' | 'results' | 'settings'

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
  const [settings, setSettings] = useState<ElectionSettings>({ election_open: false, results_visible: false, allow_changes: true })
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [votes, setVotes] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newCandidate, setNewCandidate] = useState({ name: '', position: '', image_url: '' })
  const [adding, setAdding] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const [{ data: s }, { data: c }, { data: v }, { data: sub }] = await Promise.all([
      supabase.from('election_settings').select('*').eq('id', 1).single(),
      supabase.from('election_candidates').select('*').order('position'),
      supabase.from('election_votes').select('*'),
      supabase.from('election_submissions').select('*'),
    ])
    if (s) setSettings(s)
    setCandidates(c || [])
    setVotes(v || [])
    setSubmissions(sub || [])
    setLoading(false)
  }

  const updateSetting = async (key: keyof ElectionSettings, value: boolean) => {
    setSavingSettings(true)
    const updated = { ...settings, [key]: value, updated_at: new Date().toISOString() }
    await supabase.from('election_settings').update(updated).eq('id', 1)
    setSettings(prev => ({ ...prev, [key]: value }))
    setSavingSettings(false)
  }

  const addCandidate = async () => {
    if (!newCandidate.name.trim() || !newCandidate.position.trim()) return
    setAdding(true)
    await supabase.from('election_candidates').insert({ ...newCandidate, status: 'active' })
    setNewCandidate({ name: '', position: '', image_url: '' })
    setAdding(false)
    fetchAll()
  }

  const toggleStatus = async (id: string, status: string) => {
    const newStatus = status === 'active' ? 'inactive' : 'active'
    await supabase.from('election_candidates').update({ status: newStatus }).eq('id', id)
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  const deleteCandidate = async (id: string) => {
    if (!confirm('Delete this candidate and their votes?')) return
    await supabase.from('election_votes').delete().eq('candidate_id', id)
    await supabase.from('election_candidates').delete().eq('id', id)
    fetchAll()
  }

  const resetVotes = async () => {
    if (!confirm('Reset ALL votes and submissions? This cannot be undone.')) return
    await supabase.from('election_votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabase.from('election_submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    fetchAll()
  }

  const positions = [...new Set(candidates.map(c => c.position))]
  const activeCandidates = candidates.filter(c => c.status === 'active')
  const voteCountFor = (id: string) => votes.filter(v => v.candidate_id === id).length

  const navItems: { id: AdminView; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'candidates', label: 'Candidates', icon: Users },
    { id: 'results', label: 'Results', icon: Vote },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="election-portal-bg min-h-screen">
      {/* Top bar */}
      <div className="sticky top-0 z-10" style={{ background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8eef6' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="font-bold text-sm" style={{ color: '#0f172a' }}>
            Election <span style={{ color: '#1a9ef4' }}>Admin</span>
          </div>
          <div className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: '#eff6ff', color: '#1a6fc4' }}>
            {profile?.name?.split(' ')[0]}
          </div>
        </div>

        {/* Tab nav */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1 pb-2 overflow-x-auto">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveView(id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all"
              style={activeView === id
                ? { background: '#1a9ef4', color: '#fff' }
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

              {/* Status banner */}
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

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard value={activeCandidates.length} label="CANDIDATES" />
                <StatCard value={positions.length} label="POSITIONS" />
                <StatCard value={submissions.length} label="VOTERS" color="#10b981" />
                <StatCard value={votes.length} label="TOTAL VOTES" color="#8b5cf6" />
              </div>

              {/* Quick actions */}
              <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Quick Settings</span>
                </div>
                {[
                  { key: 'election_open' as const, label: 'Election Open', desc: 'Allow members to vote' },
                  { key: 'results_visible' as const, label: 'Results Visible', desc: 'Show live results publicly' },
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
                    <div className="text-xs" style={{ color: '#94a3b8' }}>Clear all votes and submissions</div>
                  </div>
                  <button onClick={resetVotes}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#ef4444' }}>Reset</button>
                </div>
              </div>
            </div>
          )}

          {/* ── Candidates ── */}
          {activeView === 'candidates' && (
            <div>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#0f172a' }}>Manage Candidates</h2>

              {/* Add form */}
              <div className="rounded-2xl p-5 mb-5" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 className="font-bold text-sm mb-4" style={{ color: '#0f172a' }}>Add New Candidate</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: '#64748b' }}>Full Name *</label>
                    <input
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                      style={{ background: '#f8fafc', border: '1px solid #e8eef6', color: '#0f172a' }}
                      placeholder="Candidate's full name"
                      value={newCandidate.name}
                      onChange={e => setNewCandidate({ ...newCandidate, name: e.target.value })}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1a9ef4'}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e8eef6'}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: '#64748b' }}>Position *</label>
                    <input
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                      style={{ background: '#f8fafc', border: '1px solid #e8eef6', color: '#0f172a' }}
                      placeholder="e.g., President, Vice President"
                      value={newCandidate.position}
                      onChange={e => setNewCandidate({ ...newCandidate, position: e.target.value })}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1a9ef4'}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e8eef6'}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: '#64748b' }}>Photo URL (optional)</label>
                    <input
                      className="w-full rounded-xl px-3 py-2.5 text-sm outline-none transition-all"
                      style={{ background: '#f8fafc', border: '1px solid #e8eef6', color: '#0f172a' }}
                      placeholder="https://..."
                      value={newCandidate.image_url}
                      onChange={e => setNewCandidate({ ...newCandidate, image_url: e.target.value })}
                      onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1a9ef4'}
                      onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#e8eef6'}
                    />
                  </div>
                  <button onClick={addCandidate} disabled={adding}
                    className="election-cta-btn" style={{ marginTop: 4 }}>
                    <Plus className="w-4 h-4 inline mr-1" />
                    {adding ? 'Adding...' : 'Add Candidate'}
                  </button>
                </div>
              </div>

              {/* Candidates grouped by position */}
              {positions.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#94a3b8' }}>
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No candidates added yet.</p>
                </div>
              ) : (
                positions.map(position => (
                  <div key={position} className="mb-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <Vote className="w-4 h-4" style={{ color: '#1a9ef4' }} />
                      <span className="font-bold text-sm" style={{ color: '#0f172a' }}>{position}</span>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>
                        ({candidates.filter(c => c.position === position).length} candidates)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {candidates.filter(c => c.position === position).map(candidate => (
                        <div key={candidate.id} className="rounded-2xl p-3 flex items-center justify-between gap-3"
                          style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                              style={{ background: 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' }}>
                              {candidate.name[0]?.toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm truncate" style={{ color: '#0f172a' }}>{candidate.name}</div>
                              <div className="text-xs" style={{ color: '#94a3b8' }}>{voteCountFor(candidate.id)} votes</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={candidate.status === 'active'
                                ? { background: '#d1fae5', color: '#065f46' }
                                : { background: '#f1f5f9', color: '#64748b' }}>
                              {candidate.status}
                            </span>
                            <button onClick={() => toggleStatus(candidate.id, candidate.status)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                              style={candidate.status === 'active'
                                ? { background: '#fef3c7', color: '#d97706' }
                                : { background: '#d1fae5', color: '#059669' }}>
                              {candidate.status === 'active' ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
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
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Results ── */}
          {activeView === 'results' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ color: '#0f172a' }}>Live Results</h2>
                <span className="text-xs px-3 py-1 rounded-full font-medium"
                  style={settings.results_visible
                    ? { background: '#d1fae5', color: '#065f46' }
                    : { background: '#fee2e2', color: '#991b1b' }}>
                  {settings.results_visible ? 'Public' : 'Hidden'}
                </span>
              </div>

              <div className="rounded-2xl p-4 mb-5 flex items-center justify-between"
                style={{ background: '#f8fafc', border: '1px solid #e8eef6' }}>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#0f172a' }}>Total Voters</div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>{submissions.length} members have submitted their ballot</div>
                </div>
                <div className="text-2xl font-bold" style={{ color: '#1a9ef4' }}>{submissions.length}</div>
              </div>

              {positions.length === 0 ? (
                <div className="text-center py-12" style={{ color: '#94a3b8' }}>
                  <BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No results yet.</p>
                </div>
              ) : (
                positions.map(position => {
                  const posCandidates = [...candidates.filter(c => c.position === position)]
                    .sort((a, b) => voteCountFor(b.id) - voteCountFor(a.id))
                  const total = posCandidates.reduce((s, c) => s + voteCountFor(c.id), 0)
                  const winner = posCandidates[0]

                  return (
                    <div key={position} className="rounded-2xl p-5 mb-4"
                      style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold" style={{ color: '#0f172a' }}>{position}</h3>
                        <span className="text-xs" style={{ color: '#94a3b8' }}>{total} total votes</span>
                      </div>
                      <div className="space-y-4">
                        {posCandidates.map((candidate, idx) => {
                          const count = voteCountFor(candidate.id)
                          const pct = total > 0 ? Math.round((count / total) * 100) : 0
                          const isWinner = idx === 0 && count > 0

                          return (
                            <div key={candidate.id}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                  style={{ background: isWinner ? 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' : '#94a3b8' }}>
                                  {candidate.name[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>{candidate.name}</span>
                                    {isWinner && count > 0 && (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: '#fef3c7', color: '#d97706' }}>👑 Leading</span>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-bold shrink-0" style={{ color: isWinner ? '#1a9ef4' : '#64748b' }}>{pct}%</span>
                              </div>
                              <div className="w-full h-2.5 rounded-full ml-11" style={{ background: '#f1f5f9' }}>
                                <div className="h-2.5 rounded-full transition-all duration-700"
                                  style={{ width: `${pct}%`, background: isWinner ? 'linear-gradient(90deg, #1a9ef4, #1a6fc4)' : '#94a3b8' }} />
                              </div>
                              <div className="ml-11 mt-1 text-xs" style={{ color: '#94a3b8' }}>{count} vote{count !== 1 ? 's' : ''}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
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
                  value={settings.results_visible}
                  onToggle={() => updateSetting('results_visible', !settings.results_visible)}
                  label="Results Visible"
                  description="Show live vote counts to the public"
                />
                <ToggleSwitch
                  value={settings.allow_changes}
                  onToggle={() => updateSetting('allow_changes', !settings.allow_changes)}
                  label="Allow Vote Changes"
                  description="Members can change votes before final submission"
                />
              </div>

              {/* Danger zone */}
              <div className="rounded-2xl p-5" style={{ background: '#fff7f7', border: '2px solid #fee2e2' }}>
                <h3 className="font-bold text-sm mb-1" style={{ color: '#991b1b' }}>Danger Zone</h3>
                <p className="text-xs mb-4" style={{ color: '#b91c1c' }}>
                  These actions are irreversible. Please proceed with caution.
                </p>
                <button onClick={resetVotes}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white"
                  style={{ background: '#ef4444' }}>
                  Reset All Votes & Submissions
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
