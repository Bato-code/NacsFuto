import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, getDisplayName } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import ElectionVoting from './ElectionVoting'
import ElectionAdminPortal from './ElectionAdminPortal'
import { ChevronDown, ChevronUp, BarChart2 } from 'lucide-react'

interface Stats {
  candidates: number
  positions: number
  status: 'Open' | 'Closed'
  electionOpen: boolean
  resultsVisible: boolean
  allowChanges: boolean
  liveCountVisible: boolean
}

interface Candidate {
  id: string
  name: string
  position: string
  image_url?: string
  status: string
}

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

function CandidateAvatar({ name, imageUrl, size = 56 }: { name: string; imageUrl?: string; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = (name || 'U').split(' ').filter(Boolean).slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
  const colors = ['#1a6fc4', '#0891b2', '#0369a1', '#1e40af', '#5b21b6']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  if (imageUrl && !err) {
    return <img src={imageUrl} alt={name} className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }} onError={() => setErr(true)} />
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.33 }}>
      {initials}
    </div>
  )
}

// ── Results Not Available ──────────────────────────────────────────────────────
function ResultsNotAvailable({ electionOpen, onBack }: { electionOpen: boolean; onBack: () => void }) {
  return (
    <div className="election-portal-bg min-h-screen flex items-center justify-center px-4">
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{electionOpen ? '🗳️' : '⏳'}</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
          {electionOpen ? 'Voting in Progress' : 'Results Not Available Yet'}
        </h2>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
          {electionOpen
            ? 'The election is currently open. Results will be published after voting closes.'
            : 'Voting has not started yet, or the results have not been released. Please check back later.'}
        </p>
        <button onClick={onBack}
          style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 99, padding: '8px 24px', fontSize: 13, color: '#64748b', cursor: 'pointer' }}>
          ← Back to Election Portal
        </button>
      </div>
    </div>
  )
}

// ── Final Results Page ─────────────────────────────────────────────────────────
function ElectionResults({ onBack }: { onBack: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [totalVoters, setTotalVoters] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expandedPositions, setExpandedPositions] = useState<Record<string, boolean>>({})
  const realtimeRef = useRef<any>(null)

  useEffect(() => {
    fetchResults()
    const channel = supabase
      .channel('results-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_votes' }, fetchResults)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_submissions' }, fetchResults)
      .subscribe()
    realtimeRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchResults = async () => {
    setLoading(true)
    const [{ data: cands }, { data: votes }, { data: subs }] = await Promise.all([
      supabase.from('election_candidates').select('*').order('created_at'),
      supabase.from('election_votes').select('candidate_id'),
      supabase.from('election_submissions').select('id'),
    ])
    const counts: Record<string, number> = {}
    ;(votes || []).forEach((v: any) => { counts[v.candidate_id] = (counts[v.candidate_id] || 0) + 1 })
    setCandidates(cands || [])
    setVoteCounts(counts)
    setTotalVoters((subs || []).length)
    const expanded: Record<string, boolean> = {}
    POSITIONS.forEach(p => { expanded[p] = true })
    setExpandedPositions(expanded)
    setLoading(false)
  }

  const activePositions = POSITIONS.filter(p => (candidates || []).some(c => c.position === p))

  const activeCandidatesForPosition = (position: string) =>
    candidates.filter(c => c.position === position && c.status === 'active')

  const getWinnerForPosition = (position: string) => {
    const eligible = activeCandidatesForPosition(position)
    if (eligible.length === 0) return null
    const sorted = [...eligible].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
    const top = sorted[0]
    const topVotes = voteCounts[top.id] || 0
    const runnerVotes = voteCounts[sorted[1]?.id] || 0
    return topVotes > 0 && topVotes > runnerVotes ? top : null
  }

  const totalVotesCast = Object.values(voteCounts).reduce((a, b) => a + b, 0)

  if (loading) return (
    <div className="election-portal-bg min-h-screen flex items-center justify-center">
      <div style={{ textAlign: 'center', color: '#64748b' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1a9ef4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        Loading results...
      </div>
    </div>
  )

  return (
    <div className="election-portal-bg min-h-screen px-4 py-8">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes winner-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(26,158,244,0.4), 0 8px 32px rgba(26,158,244,0.25); }
          50%       { box-shadow: 0 0 0 10px rgba(26,158,244,0), 0 8px 32px rgba(26,158,244,0.45); }
        }
        @keyframes winner-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes trophy-bounce {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes winner-badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.85; transform: scale(1.07); }
        }
        .winner-card {
          background: linear-gradient(135deg, #e8f4ff 0%, #dbeeff 100%);
          border: 2.5px solid #1a9ef4;
          border-radius: 16px;
          padding: 18px;
          animation: winner-glow 2.2s ease-in-out infinite;
          position: relative;
          overflow: hidden;
        }
        .winner-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(26,158,244,0.08) 50%, transparent 60%);
          animation: winner-shimmer 2.5s ease-in-out infinite;
        }
        .winner-badge { animation: winner-badge-pulse 1.8s ease-in-out infinite; }
        .runner-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          opacity: 0.88;
        }
        .vote-bar-track { height: 6px; background: #e2e8f0; border-radius: 99px; overflow: hidden; margin-top: 6px; }
        .vote-bar-fill { height: 100%; border-radius: 99px; transition: width 1s ease; }
        .trophy-icon { animation: trophy-bounce 2s ease-in-out infinite; display: inline-block; }
        .results-card {
          background: white; border-radius: 18px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
          overflow: hidden; max-width: 540px; margin: 0 auto 16px;
        }
        .position-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px; background: #f0f7ff;
          border-bottom: 1px solid #dbeeff; cursor: pointer; user-select: none;
        }
        .position-title {
          font-weight: 700; font-size: 15px; color: #0f172a;
          display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
        }
        .winner-name-badge {
          font-size: 11px; font-weight: 600; color: #1a6fc4;
          background: #dbeeff; border: 1px solid #bfdbfe;
          border-radius: 99px; padding: 2px 8px;
        }
        .position-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
      `}</style>

      {/* Header */}
      <div style={{ maxWidth: 540, margin: '0 auto 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }} className="trophy-icon">🏆</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Election Results</h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 14px' }}>
          Official results for NACSFUTO 2026/2027 elections
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 99, padding: '5px 14px', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            {totalVoters} Total Voters
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 99, padding: '5px 14px', fontSize: 12, color: '#1a6fc4', fontWeight: 600 }}>
            🗳️ {totalVotesCast} Votes Cast · {activePositions.length} Positions
          </div>
        </div>
      </div>

      {/* Position cards */}
      {activePositions.map((position, posIdx) => {
        const allCands = candidates.filter(c => c.position === position)
        const activeSorted = [...activeCandidatesForPosition(position)]
          .sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
        const ineligible = allCands.filter(c => c.status !== 'active')
        const winner = getWinnerForPosition(position)
        const positionTotal = activeSorted.reduce((s, c) => s + (voteCounts[c.id] || 0), 0)
        const maxVotes = Math.max(...activeSorted.map(c => voteCounts[c.id] || 0), 1)
        const isExpanded = expandedPositions[position] !== false

        return (
          <div key={position} className="results-card">
            <div className="position-header"
              onClick={() => setExpandedPositions(prev => ({ ...prev, [position]: !prev[position] }))}>
              <div className="position-title">
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1a9ef4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                  {posIdx + 1}
                </div>
                {position}
                {winner && <span className="winner-name-badge">🥇 {winner.name}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>{positionTotal} votes</span>
                {isExpanded
                  ? <ChevronUp style={{ width: 16, height: 16, color: '#64748b' }} />
                  : <ChevronDown style={{ width: 16, height: 16, color: '#64748b' }} />}
              </div>
            </div>

            {isExpanded && (
              <div className="position-body">
                {activeSorted.length === 0 ? (
                  <p style={{ fontSize: 12, color: '#cbd5e1' }}>No active candidates</p>
                ) : (
                  activeSorted.map((candidate, idx) => {
                    const votes = voteCounts[candidate.id] || 0
                    const isWinner = winner?.id === candidate.id
                    const percentage = maxVotes > 0 ? Math.round((votes / maxVotes) * 100) : 0
                    const totalPct = positionTotal > 0 ? ((votes / positionTotal) * 100).toFixed(1) : '0'

                    return isWinner ? (
                      <div key={candidate.id} className="winner-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', zIndex: 1 }}>
                          <div style={{ position: 'relative' }}>
                            <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={64} />
                            <div style={{ position: 'absolute', bottom: -4, right: -4, width: 24, height: 24, borderRadius: '50%', background: '#fbbf24', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🥇</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                              <span style={{ fontWeight: 800, fontSize: 16, color: '#0f172a' }}>{candidate.name}</span>
                              <span className="winner-badge" style={{ fontSize: 10, fontWeight: 700, color: '#1a6fc4', background: '#dbeeff', borderRadius: 99, padding: '2px 8px', border: '1px solid #bfdbfe', textTransform: 'uppercase', letterSpacing: '0.05em' }}>WINNER</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#1a6fc4', fontWeight: 700, marginBottom: 6 }}>
                              {votes} vote{votes !== 1 ? 's' : ''} — {totalPct}% of position votes
                            </div>
                            <div className="vote-bar-track">
                              <div className="vote-bar-fill" style={{ width: `${percentage}%`, background: 'linear-gradient(90deg, #1a9ef4, #1a6fc4)' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div key={candidate.id} className="runner-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ position: 'relative' }}>
                            <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={44} />
                            {idx === 1 && <div style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#94a3b8', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>🥈</div>}
                            {idx === 2 && <div style={{ position: 'absolute', bottom: -3, right: -3, width: 18, height: 18, borderRadius: '50%', background: '#cd7c2f', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>🥉</div>}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#334155', marginBottom: 2 }}>{candidate.name}</div>
                            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>
                              {votes} vote{votes !== 1 ? 's' : ''} — {totalPct}%
                            </div>
                            <div className="vote-bar-track">
                              <div className="vote-bar-fill" style={{ width: `${percentage}%`, background: '#cbd5e1' }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}

                {ineligible.length > 0 && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #e2e8f0' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 6 }}>Not counted:</div>
                    {ineligible.map(c => (
                      <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', opacity: 0.5 }}>
                        <CandidateAvatar name={c.name} imageUrl={c.image_url} size={28} />
                        <span style={{ fontSize: 12, color: '#94a3b8', flex: 1 }}>{c.name}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: c.status === 'disqualified' ? '#fef3c7' : '#fee2e2', color: c.status === 'disqualified' ? '#d97706' : '#dc2626', fontWeight: 600 }}>
                          {c.status === 'disqualified' ? '❌ Disqualified' : '🚫 Suspended'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ maxWidth: 540, margin: '16px auto 0', textAlign: 'center' }}>
        <button onClick={onBack}
          style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: 99, padding: '8px 24px', fontSize: 13, color: '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a9ef4'; (e.currentTarget as HTMLElement).style.color = '#1a9ef4' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1'; (e.currentTarget as HTMLElement).style.color = '#64748b' }}>
          ← Back to Election Portal
        </button>
      </div>
    </div>
  )
}

// ── Main Election Portal ───────────────────────────────────────────────────────
export default function ElectionPortal() {
  const { user, profile, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    candidates: 0, positions: 0, status: 'Closed',
    electionOpen: false, resultsVisible: false, allowChanges: true, liveCountVisible: false
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [hasVoted, setHasVoted] = useState(false)
  const [view, setView] = useState<'landing' | 'voting' | 'admin' | 'results'>('landing')

  useEffect(() => { fetchStats() }, [])

  // Check if the current user has already voted
  useEffect(() => {
    if (user) checkIfVoted()
  }, [user])

  const checkIfVoted = async () => {
    if (!user) return
    const { data } = await supabase
      .from('election_submissions')
      .select('id')
      .eq('voter_id', user.id)
      .maybeSingle()
    setHasVoted(!!data)
  }

  const fetchStats = async () => {
    setLoadingStats(true)
    const [{ data: settings }, { data: candidates }] = await Promise.all([
      supabase.from('election_settings').select('*').eq('id', 1).single(),
      supabase.from('election_candidates').select('id, position').eq('status', 'active'),
    ])
    const positions = [...new Set((candidates || []).map((c: any) => c.position))].length
    setStats({
      candidates: candidates?.length || 0,
      positions,
      status: settings?.election_open ? 'Open' : 'Closed',
      electionOpen: settings?.election_open || false,
      resultsVisible: settings?.results_visible || false,
      allowChanges: settings?.allow_changes ?? true,
      liveCountVisible: settings?.live_count_visible || false,
    })
    setLoadingStats(false)
  }

  const handleCastVote = () => {
    if (authLoading) return
    if (!user) { navigate('/login?redirect=/election'); return }
    if (profile?.is_admin) setView('admin')
    else setView('voting')
  }

  if (view === 'voting') return (
    <ElectionVoting
      onBack={() => { setView('landing'); checkIfVoted() }}
      settings={stats}
    />
  )
  if (view === 'admin') return <ElectionAdminPortal onBack={() => setView('landing')} />
  if (view === 'results') {
    if (!stats.resultsVisible) return <ResultsNotAvailable electionOpen={stats.electionOpen} onBack={() => setView('landing')} />
    return <ElectionResults onBack={() => setView('landing')} />
  }

  // Determine button label and action for the main CTA
  const isAdmin = profile?.is_admin
  const userHasVoted = user && !isAdmin && hasVoted

  return (
    <div className="election-portal-bg min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="election-card w-full max-w-md">

        <div className="text-center pb-6" style={{ borderBottom: '1px solid #e8eef6' }}>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-md"
              style={{ background: 'linear-gradient(135deg, #4f9cf9, #1a6fc4)' }}>
              🗳️
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-1">
            <span style={{ color: '#0f172a' }}>NACSFUTO </span>
            <span style={{ color: '#1a9ef4' }}>Election</span>
          </h1>
          <p className="text-sm" style={{ color: '#64748b' }}>Sign in with your NACSFUTO account to vote</p>
          <div className="flex justify-center mt-4">
            {loadingStats ? (
              <div className="election-badge-loading" />
            ) : (
              <div className={`election-status-badge ${stats.electionOpen ? 'open' : 'closed'}`}>
                <span className="badge-dot" />
                {stats.electionOpen ? 'Voting is live' : 'Voting is closed'}
              </div>
            )}
          </div>
        </div>

        <div className="election-stats-row">
          <div className="election-stat">
            <div className="stat-value" style={{ color: '#1a9ef4' }}>{loadingStats ? '—' : stats.candidates}</div>
            <div className="stat-label">CANDIDATES</div>
          </div>
          <div className="election-stat" style={{ borderLeft: '1px solid #e8eef6', borderRight: '1px solid #e8eef6' }}>
            <div className="stat-value" style={{ color: '#1a9ef4' }}>{loadingStats ? '—' : stats.positions}</div>
            <div className="stat-label">POSITIONS</div>
          </div>
          <div className="election-stat">
            <div className="stat-value" style={{ color: stats.electionOpen ? '#10b981' : '#ef4444' }}>
              {loadingStats ? '—' : stats.status}
            </div>
            <div className="stat-label">STATUS</div>
          </div>
        </div>

        <div className="election-info-box">
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#dbeafe' }}>
                <svg className="w-4 h-4" style={{ color: '#1a6fc4' }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold mb-0.5" style={{ color: '#0f172a' }}>Are you a registered NACSFUTO member?</p>
              <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                Only members registered on{' '}
                <span className="font-semibold" style={{ color: '#1a9ef4' }}>nacsfuto.online</span>{' '}
                can vote. Your existing login works here automatically.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 space-y-3">
          {[
            { emoji: '🏛️', text: `${loadingStats ? '11' : stats.positions || 11} executive positions to vote on` },
            { emoji: '🔒', text: 'One vote per member — fully anonymous' },
            { emoji: '📊', text: 'Watch live results after submitting' },
          ].map(({ emoji, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="text-lg shrink-0">{emoji}</span>
              <span className="text-sm" style={{ color: '#334155' }}>{text}</span>
            </div>
          ))}
        </div>

        <div className="px-6 pb-6 space-y-3">

          {/* Main CTA — changes based on whether user has voted */}
          {userHasVoted ? (
            /* User has already voted → show "Check Election Live Count" */
            <button
              onClick={handleCastVote}
              disabled={authLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #1a9ef4, #1a6fc4)',
                color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(26,110,196,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 6px 24px rgba(26,110,196,0.4)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.transform = ''; el.style.boxShadow = '0 4px 18px rgba(26,110,196,0.3)' }}
            >
              <BarChart2 style={{ width: 18, height: 18 }} />
              {authLoading ? 'Loading...' : 'Check Election Live Count →'}
            </button>
          ) : (
            /* Default CTA */
            <button onClick={handleCastVote} disabled={authLoading} className="election-cta-btn">
              {authLoading ? 'Loading...' :
                user ? isAdmin ? 'Open Admin Dashboard →' : 'Cast Your Vote →' : 'Cast Your Vote →'}
            </button>
          )}

          {/* Voted badge — shown when user has voted */}
          {userHasVoted && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              padding: '8px 0', borderRadius: 99,
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              fontSize: 12, color: '#16a34a', fontWeight: 600,
            }}>
              ✅ You have already cast your vote
            </div>
          )}

          {/* Show Results — only when resultsVisible is ON */}
          {!loadingStats && stats.resultsVisible && (
            <button onClick={() => setView('results')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0', borderRadius: 12, border: '2px solid #fbbf24', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', color: '#92400e', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg, #fef3c7, #fde68a)'; el.style.transform = 'translateY(-1px)'; el.style.boxShadow = '0 4px 16px rgba(251,191,36,0.35)' }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'linear-gradient(135deg, #fffbeb, #fef3c7)'; el.style.transform = ''; el.style.boxShadow = '' }}>
              <span style={{ fontSize: 20 }}>🏆</span>
              View Election Winners
            </button>
          )}

          {/* Status message when results not yet published */}
          {!loadingStats && !stats.resultsVisible && (
            <button onClick={() => setView('results')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px 0', borderRadius: 12, border: '1px solid #e8eef6', background: '#f8fafc', color: '#94a3b8', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>
              {stats.electionOpen ? '🗳️ Voting in progress — results pending' : '⏳ Results not yet available'}
            </button>
          )}

          {user && (
            <p className="text-center text-xs" style={{ color: '#94a3b8' }}>
              Signed in as <span style={{ color: '#1a9ef4', fontWeight: 600 }}>{getDisplayName(profile)}</span>
            </p>
          )}
        </div>
      </div>

      <p className="text-xs mt-6" style={{ color: '#94a3b8' }}>
        Powered by NACSFUTO · Secure & Anonymous Voting
      </p>
    </div>
  )
}
