import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, Lock, Ban, BarChart2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, getDisplayName } from '../contexts/AuthContext'

interface Candidate { id: string; name: string; position: string; image_url?: string; status: string }
interface VoteMap { [position: string]: Set<string> }

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

function CandidateAvatar({ name, imageUrl, size = 48, suspended = false }: { name: string; imageUrl?: string; size?: number; suspended?: boolean }) {
  const [err, setErr] = useState(false)
  const initials = (name || 'U').split(' ').filter(Boolean).slice(-2).map((n: string) => n[0]).join('').toUpperCase()
  const colors = ['#1a6fc4', '#0891b2', '#0369a1', '#1e40af', '#5b21b6']
  const color = suspended ? '#94a3b8' : colors[(name || '').charCodeAt(0) % colors.length]
  if (imageUrl && !err) {
    return <img src={imageUrl} alt={name} className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size, filter: suspended ? 'grayscale(1)' : 'none' }} onError={() => setErr(true)} />
  }
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.33 }}>
      {suspended ? <Lock style={{ width: size * 0.38, height: size * 0.38 }} /> : initials}
    </div>
  )
}

// ── Congratulations Popup ─────────────────────────────────────────────────────
function CongratsPopup({ onViewLiveCount, onClose }: { onViewLiveCount: () => void; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes popup-in {
          0% { transform: scale(0.82) translateY(24px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes confetti-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(8deg); }
        }
        @keyframes checkmark-draw {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .popup-card {
          animation: popup-in 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .confetti { animation: confetti-float 2.4s ease-in-out infinite; }
        .check-anim { animation: checkmark-draw 0.5s 0.2s cubic-bezier(0.34,1.56,0.64,1) both; }
      `}</style>

      <div
        className="popup-card"
        style={{
          background: '#fff', borderRadius: 24, maxWidth: 400, width: '100%',
          boxShadow: '0 24px 80px rgba(0,0,0,0.22)', overflow: 'hidden',
          textAlign: 'center', padding: '36px 28px 28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Confetti emoji row */}
        <div style={{ fontSize: 28, marginBottom: 12, letterSpacing: 4, lineHeight: 1 }}>
          <span className="confetti" style={{ display: 'inline-block', animationDelay: '0s' }}>🎉</span>
          <span className="confetti" style={{ display: 'inline-block', animationDelay: '0.3s' }}>🗳️</span>
          <span className="confetti" style={{ display: 'inline-block', animationDelay: '0.6s' }}>🎊</span>
        </div>

        {/* Green check circle */}
        <div className="check-anim" style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 18px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(16,185,129,0.35)',
        }}>
          <CheckCircle style={{ width: 38, height: 38, color: '#fff' }} />
        </div>

        {/* Heading */}
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#065f46', margin: '0 0 8px', lineHeight: 1.2 }}>
          Thank You for Voting!
        </h2>

        {/* Sub-heading */}
        <p style={{ fontSize: 15, fontWeight: 700, color: '#1a6fc4', margin: '0 0 10px' }}>
          Congratulations on participating in the
        </p>
        <div style={{
          display: 'inline-block', background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: '1.5px solid #bfdbfe', borderRadius: 99, padding: '4px 16px',
          fontSize: 13, fontWeight: 700, color: '#1e40af', marginBottom: 14,
        }}>
          🏛️ NACS 2026/2027 Election
        </div>

        <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: '0 0 22px' }}>
          Your vote has been recorded securely and anonymously.
          Every vote counts — you're shaping the future of NACSFUTO!
        </p>

        {/* CTA: View Live Count */}
        <button
          onClick={onViewLiveCount}
          style={{
            width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #1a9ef4, #1a6fc4)',
            color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer',
            boxShadow: '0 4px 18px rgba(26,110,196,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            marginBottom: 10, transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}
        >
          <BarChart2 style={{ width: 18, height: 18 }} />
          View Live Vote Count →
        </button>

        {/* Dismiss */}
        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 14, border: '1px solid #e2e8f0',
            background: 'transparent', color: '#94a3b8', fontWeight: 500, fontSize: 13, cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default function ElectionVoting({ onBack, settings }: {
  onBack: () => void
  settings: { electionOpen: boolean; resultsVisible: boolean; allowChanges: boolean; liveCountVisible: boolean }
}) {
  const { user, profile } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [myVotes, setMyVotes] = useState<VoteMap>({})
  const [results, setResults] = useState<Record<string, number>>({})
  const [totalVoters, setTotalVoters] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingFor, setSavingFor] = useState<string | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [openPositions, setOpenPositions] = useState<Record<string, boolean>>({})
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [showCongratsPopup, setShowCongratsPopup] = useState(false)
  const [animating, setAnimating] = useState<string | null>(null)
  const realtimeRef = useRef<any>(null)

  const showLiveCount = settings.liveCountVisible

  useEffect(() => {
    fetchAll()
    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current)
    }
  }, [])

  const setupRealtime = () => {
    const channel = supabase
      .channel('live-votes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_votes' }, () => { fetchLiveCounts() })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'election_submissions' }, () => { fetchLiveCounts() })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'election_candidates' }, () => { fetchLiveCounts() })
      .subscribe()
    realtimeRef.current = channel
  }

  const fetchLiveCounts = async () => {
    const [{ data: allVotes }, { data: subs }, { data: cands }] = await Promise.all([
      supabase.from('election_votes').select('candidate_id'),
      supabase.from('election_submissions').select('id'),
      supabase.from('election_candidates').select('id, contribution'),
    ])
    const r: Record<string, number> = {}
    ;(allVotes || []).forEach((v: any) => { r[v.candidate_id] = (r[v.candidate_id] || 0) + 1 })
    ;(cands || []).forEach((c: any) => { r[c.id] = (r[c.id] || 0) + (c.contribution || 0) })
    setResults(r)
    setTotalVoters((subs || []).length)
  }

  const fetchAll = async () => {
    setLoading(true)
    const { data: cands } = await supabase.from('election_candidates').select('*').order('created_at')
    const list = (cands || []) as Candidate[]
    setCandidates(list)

    const openMap: Record<string, boolean> = {}
    POSITIONS.forEach(p => { openMap[p] = true })
    setOpenPositions(openMap)

    if (user) {
      const [{ data: votes }, { data: submission }] = await Promise.all([
        supabase.from('election_votes').select('*').eq('voter_id', user.id),
        supabase.from('election_submissions').select('id').eq('voter_id', user.id).maybeSingle(),
      ])
      const voteMap: VoteMap = {}
      ;(votes || []).forEach((v: any) => {
        if (!voteMap[v.position]) voteMap[v.position] = new Set()
        voteMap[v.position].add(v.candidate_id)
      })
      setMyVotes(voteMap)
      setHasSubmitted(!!submission)
    }

    if (settings.liveCountVisible || settings.resultsVisible) {
      await fetchLiveCounts()
      setupRealtime()
    }
    setLoading(false)
  }

  // ─── Optimistic vote toggle ───────────────────────────────────────────────
  // The UI updates immediately on click (instant checkmark + card highlight).
  // The network call runs in the background; a small spinner shows inside the
  // checkbox while it confirms, and the change is only rolled back if the
  // request actually fails.
  const toggleVote = async (position: string, candidateId: string) => {
    if (!user || hasSubmitted) return
    if (savingFor) return // avoid overlapping requests if a previous vote is still confirming

    const currentSet = myVotes[position] || new Set<string>()
    const alreadyVoted = currentSet.has(candidateId)
    const hasExistingVote = currentSet.size > 0
    if (!settings.allowChanges && hasExistingVote && !alreadyVoted) return

    // Snapshot for rollback
    const previousVotes = myVotes

    // 1) Update UI instantly
    const optimisticVotes: VoteMap = { ...myVotes }
    if (alreadyVoted) {
      delete optimisticVotes[position]
    } else {
      optimisticVotes[position] = new Set([candidateId])
    }
    setMyVotes(optimisticVotes)
    setVoteError(null)
    setAnimating(candidateId)
    setTimeout(() => setAnimating(null), 600)
    setSavingFor(candidateId)

    // 2) Confirm with the server in the background
    try {
      if (alreadyVoted) {
        const { error } = await supabase.from('election_votes').delete()
          .eq('voter_id', user.id).eq('position', position).eq('candidate_id', candidateId)
        if (error) throw error
      } else {
        if (hasExistingVote) {
          const { error: delErr } = await supabase.from('election_votes').delete()
            .eq('voter_id', user.id).eq('position', position)
          if (delErr) throw delErr
        }
        const { error: insErr } = await supabase.from('election_votes')
          .insert({ voter_id: user.id, position, candidate_id: candidateId })
        if (insErr) throw insErr
      }
    } catch (err) {
      // 3) Roll back only if it actually failed
      setMyVotes(previousVotes)
      setVoteError('Could not save your vote. Check your connection and try again.')
      setTimeout(() => setVoteError(null), 4000)
    } finally {
      setSavingFor(null)
    }
  }

  const submitBallot = async () => {
    if (!user || hasSubmitted) return
    if (!confirm('Submit your ballot? This cannot be undone.')) return
    setSubmitting(true)
    const { error } = await supabase.from('election_submissions').insert({ voter_id: user.id })
    if (error) {
      setSubmitting(false)
      alert('Could not submit your ballot. Please check your connection and try again.')
      return
    }
    setHasSubmitted(true)
    setJustSubmitted(true)
    setShowCongratsPopup(true)
    setSubmitting(false)
    await fetchLiveCounts()
    if (!realtimeRef.current) setupRealtime()
  }

  const handleViewLiveCount = () => {
    setShowCongratsPopup(false)
    setTimeout(() => {
      const el = document.getElementById('live-count-section')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const candidatesForPosition = (position: string) => {
    const pos = candidates.filter(c => c.position === position)
    return [
      ...pos.filter(c => c.status === 'active'),
      ...pos.filter(c => c.status === 'suspended'),
      ...pos.filter(c => c.status === 'disqualified'),
    ]
  }

  const totalForPosition = (pos: string) =>
    candidates.filter(c => c.position === pos && c.status === 'active').reduce((s, c) => s + (results[c.id] || 0), 0)

  const positionsWithCandidates = POSITIONS.filter(p => candidates.some(c => c.position === p))
  const totalVotedPositions = Object.keys(myVotes).filter(p => myVotes[p].size > 0).length

  // ─── Shared top bar ───────────────────────────────────────────────────────
  const TopBar = () => (
    <div className="sticky top-0 z-10" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e8eef6' }}>
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-medium" style={{ color: '#64748b' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <div className="font-bold text-sm" style={{ color: '#0f172a' }}>
            NACSFUTO <span style={{ color: '#1a9ef4' }}>Election</span>
          </div>
        </div>
        <div className="text-xs font-medium" style={{ color: '#1a9ef4' }}>
          {getDisplayName(profile)}
        </div>
      </div>
    </div>
  )

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="election-portal-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin mx-auto mb-3"
            style={{ border: '3px solid #e2eaf4', borderTopColor: '#1a9ef4' }} />
          <p style={{ color: '#64748b', fontSize: 14 }}>Loading ballot...</p>
        </div>
      </div>
    )
  }

  // ─── POST-SUBMISSION VIEW (justSubmitted or returning after submit) ────────
  if (hasSubmitted) {
    return (
      <div className="election-portal-bg min-h-screen">
        <TopBar />

        {/* Congratulations Popup */}
        {showCongratsPopup && (
          <CongratsPopup
            onViewLiveCount={handleViewLiveCount}
            onClose={() => setShowCongratsPopup(false)}
          />
        )}

        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Success banner */}
          <div className="rounded-2xl p-6 mb-6 text-center"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', border: '1px solid #6ee7b7' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-1" style={{ color: '#065f46' }}>
              {justSubmitted ? 'Ballot Submitted!' : 'Ballot Already Submitted'}
            </h2>
            <p className="text-sm" style={{ color: '#047857' }}>
              Your vote has been recorded securely. Thank you for participating in the NACSFUTO 2026/2027 elections.
            </p>
          </div>

          {/* Live count section — only shown when liveCountVisible is ON */}
          {showLiveCount ? (
            <>
              {/* Stats summary bar */}
              <div id="live-count-section" className="rounded-2xl p-4 mb-5 flex items-center justify-between gap-4"
                style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold" style={{ color: '#1a6fc4' }}>{totalVoters}</div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: '#3b82f6' }}>TOTAL VOTERS</div>
                </div>
                <div className="w-px h-10" style={{ background: '#bfdbfe' }} />
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold" style={{ color: '#1a6fc4' }}>
                    {Object.values(results).reduce((a, b) => a + b, 0)}
                  </div>
                  <div className="text-xs font-semibold mt-0.5" style={{ color: '#3b82f6' }}>VOTES CAST</div>
                </div>
                <div className="w-px h-10" style={{ background: '#bfdbfe' }} />
                <div className="flex-1 text-center">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full animate-pulse"
                    style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                    🔴 Live
                  </span>
                </div>
              </div>

              {/* Per-position live counts */}
              <div className="space-y-4 mb-6">
                {positionsWithCandidates.map((position) => {
                  const activeCands = candidates.filter(c => c.position === position && c.status === 'active')
                  if (activeCands.length === 0) return null
                  const total = totalForPosition(position)
                  const isOpen = openPositions[position] !== false

                  return (
                    <div key={position} className="rounded-2xl overflow-hidden"
                      style={{ background: '#fff', border: '2px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

                      <button className="w-full flex items-center justify-between p-4"
                        onClick={() => setOpenPositions(prev => ({ ...prev, [position]: !isOpen }))}>
                        <div className="flex items-center gap-3 text-left">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            style={{ background: 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' }}>
                            <BarChart2 className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{position}</div>
                            <div className="text-xs" style={{ color: '#94a3b8' }}>
                              {total} vote{total !== 1 ? 's' : ''} · {activeCands.length} candidate{activeCands.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </div>
                        {isOpen
                          ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                          : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />}
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 space-y-2">
                          {activeCands
                            .slice()
                            .sort((a, b) => (results[b.id] || 0) - (results[a.id] || 0))
                            .map((candidate, idx) => {
                              const count = results[candidate.id] || 0
                              const pct = total > 0 ? Math.round((count / total) * 100) : 0
                              const isLeading = idx === 0 && count > 0

                              return (
                                <div key={candidate.id}
                                  style={{
                                    background: isLeading ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#f8fafc',
                                    border: `2px solid ${isLeading ? '#bfdbfe' : '#e8eef6'}`,
                                    borderRadius: 14,
                                    padding: '12px 14px',
                                  }}>
                                  <div className="flex items-center gap-3">
                                    <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={40} />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-sm leading-tight" style={{ color: '#0f172a' }}>
                                          {candidate.name}
                                        </span>
                                        {isLeading && (
                                          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: '#dbeafe', color: '#1a6fc4' }}>
                                            Leading
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>
                                        {count} vote{count !== 1 ? 's' : ''} · {pct}%
                                      </div>
                                    </div>
                                    <div className="text-lg font-bold" style={{ color: '#1a6fc4', minWidth: 36, textAlign: 'right' }}>
                                      {pct}%
                                    </div>
                                  </div>
                                  <div className="mt-2.5">
                                    <div className="w-full h-2 rounded-full" style={{ background: '#e8eef6' }}>
                                      <div className="h-2 rounded-full transition-all duration-700"
                                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#1a9ef4,#1a6fc4)' }} />
                                    </div>
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
            </>
          ) : (
            /* Live count is OFF — just show a neutral message */
            <div className="rounded-2xl p-6 text-center mb-6"
              style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div className="text-3xl mb-3">🔒</div>
              <p className="font-semibold" style={{ color: '#0f172a' }}>Results not yet available</p>
              <p className="text-sm mt-1" style={{ color: '#64748b' }}>
                Live vote counts will be visible once the administrators enable them.
              </p>
            </div>
          )}

          <button onClick={onBack} className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            Back to Election Home
          </button>
        </div>
      </div>
    )
  }

  // ─── VOTING VIEW (not yet submitted) ─────────────────────────────────────
  return (
    <div className="election-portal-bg min-h-screen">
      <style>{`
        @keyframes vote-pulse {
          0% { transform: scale(1); }
          40% { transform: scale(1.04); box-shadow: 0 0 0 6px rgba(26,158,244,0.18); }
          100% { transform: scale(1); box-shadow: none; }
        }
        .vote-animate { animation: vote-pulse 0.55s ease; }
        @keyframes checkbox-pop {
          0% { transform: scale(0.7); opacity: 0.5; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .checkbox-pop { animation: checkbox-pop 0.3s ease; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes toast-in {
          0% { transform: translate(-50%, 12px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
        }
        .vote-error-toast { animation: toast-in 0.25s ease; }
      `}</style>

      <TopBar />

      {/* Vote error toast — only appears if a save actually fails */}
      {voteError && (
        <div className="vote-error-toast" style={{
          position: 'fixed', bottom: 20, left: '50%', zIndex: 9998,
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          borderRadius: 12, padding: '10px 18px', fontSize: 13, fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxWidth: '90%', textAlign: 'center',
        }}>
          ⚠️ {voteError}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Live stats bar */}
        {showLiveCount && (
          <div className="rounded-2xl p-4 mb-5 flex items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #bfdbfe' }}>
            <div className="text-center flex-1">
              <div className="text-2xl font-bold" style={{ color: '#1a6fc4' }}>{totalVoters}</div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#3b82f6' }}>TOTAL VOTERS</div>
            </div>
            <div className="w-px h-10" style={{ background: '#bfdbfe' }} />
            <div className="text-center flex-1">
              <div className="text-2xl font-bold" style={{ color: '#1a6fc4' }}>
                {Object.values(results).reduce((a, b) => a + b, 0)}
              </div>
              <div className="text-xs font-semibold mt-0.5" style={{ color: '#3b82f6' }}>VOTES CAST</div>
            </div>
            <div className="w-px h-10" style={{ background: '#bfdbfe' }} />
            <div className="flex-1 text-center">
              <span className="text-xs font-semibold px-2 py-1 rounded-full animate-pulse"
                style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                🔴 Live
              </span>
            </div>
          </div>
        )}

        {/* Election closed */}
        {!settings.electionOpen && (
          <div className="rounded-2xl p-5 mb-6 text-center"
            style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-bold" style={{ color: '#0f172a' }}>Election is Closed</h3>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Voting is not currently open.</p>
          </div>
        )}

        {/* Voting progress */}
        {settings.electionOpen && positionsWithCandidates.length > 0 && (
          <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Your Ballot</span>
              <span className="text-sm font-bold" style={{ color: '#1a9ef4' }}>
                {totalVotedPositions}/{positionsWithCandidates.length} positions voted
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: '#e8eef6' }}>
              <div className="h-2 rounded-full transition-all duration-500"
                style={{ background: 'linear-gradient(90deg, #1a9ef4, #1a6fc4)', width: `${positionsWithCandidates.length > 0 ? (totalVotedPositions / positionsWithCandidates.length) * 100 : 0}%` }} />
            </div>
            <p className="text-xs mt-2" style={{ color: '#94a3b8' }}>
              ✅ Select <strong>one candidate</strong> per position, or skip any position.
            </p>
          </div>
        )}

        {/* Positions */}
        <div className="space-y-4 mb-6">
          {POSITIONS.map((position, posIdx) => {
            const posCandidates = candidatesForPosition(position)
            if (posCandidates.length === 0) return null

            const myVoteSet = myVotes[position] || new Set<string>()
            const total = totalForPosition(position)
            const isOpen = openPositions[position] !== false
            const canVote = settings.electionOpen
            const activeCands = posCandidates.filter(c => c.status === 'active')
            const suspendedCands = posCandidates.filter(c => c.status === 'suspended')
            const disqualifiedCands = posCandidates.filter(c => c.status === 'disqualified')

            return (
              <div key={position} className="rounded-2xl overflow-hidden"
                style={{
                  background: '#fff',
                  border: `2px solid ${myVoteSet.size > 0 ? '#bfdbfe' : '#e8eef6'}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                }}>

                <button className="w-full flex items-center justify-between p-4"
                  onClick={() => setOpenPositions(prev => ({ ...prev, [position]: !isOpen }))}>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: myVoteSet.size > 0 ? 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' : '#cbd5e1' }}>
                      {myVoteSet.size > 0 ? <CheckCircle className="w-4 h-4" /> : posIdx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{position}</div>
                      <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: '#94a3b8' }}>
                        <span>{activeCands.length} candidate{activeCands.length !== 1 ? 's' : ''}</span>
                        {myVoteSet.size > 0 && <span className="font-semibold" style={{ color: '#1a9ef4' }}>· 1 selected</span>}
                        {showLiveCount && <span style={{ color: '#10b981', fontWeight: 600 }}>· {total} votes</span>}
                      </div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                    : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />}
                </button>

                <div className="mx-4 mb-2 flex items-center gap-2" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
                  <div className="text-xs font-bold tracking-widest uppercase" style={{ color: '#1a9ef4', letterSpacing: 1 }}>{position}</div>
                  <div className="flex-1 h-px" style={{ background: '#e8eef6' }} />
                  {myVoteSet.size === 0 && canVote && <span className="text-xs" style={{ color: '#cbd5e1' }}>Optional</span>}
                </div>

                {isOpen && (
                  <div className="px-4 pb-4">

                    {/* Active candidates */}
                    <div className="space-y-2">
                      {activeCands.map(candidate => {
                        const isSelected = myVoteSet.has(candidate.id)
                        const count = results[candidate.id] || 0
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        const isAnimating = animating === candidate.id
                        const isSaving = savingFor === candidate.id
                        const isDisabled = !canVote || (!!savingFor && savingFor !== candidate.id)

                        return (
                          <div key={candidate.id}
                            onClick={() => !isDisabled && toggleVote(position, candidate.id)}
                            className={isAnimating ? 'vote-animate' : ''}
                            style={{
                              background: isSelected ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#f8fafc',
                              border: `2px solid ${isSelected ? '#1a9ef4' : '#e8eef6'}`,
                              borderRadius: 14, padding: '12px 14px',
                              cursor: isDisabled ? 'default' : 'pointer',
                              opacity: isDisabled && !isSelected ? 0.6 : 1,
                              transition: 'border-color 0.2s, background 0.2s, opacity 0.2s',
                              userSelect: 'none',
                            }}>
                            <div className="flex items-center gap-3">
                              <div className={isSelected && !isSaving ? 'checkbox-pop' : ''}
                                style={{
                                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                  background: isSelected ? '#1a9ef4' : '#fff',
                                  border: `2px solid ${isSelected ? '#1a9ef4' : '#cbd5e1'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'background 0.2s, border-color 0.2s',
                                }}>
                                {isSaving ? (
                                  <div style={{ width: 10, height: 10, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                                ) : isSelected ? (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  </svg>
                                ) : null}
                              </div>
                              <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={40} />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm leading-tight" style={{ color: '#0f172a' }}>{candidate.name}</div>
                                {showLiveCount && (
                                  <div className="text-xs mt-0.5 font-medium" style={{ color: '#64748b' }}>
                                    {count} vote{count !== 1 ? 's' : ''} · {pct}%
                                  </div>
                                )}
                              </div>
                              {isSelected && !isSaving && <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#1a9ef4' }} />}
                            </div>
                            {showLiveCount && (
                              <div className="mt-2.5 ml-8">
                                <div className="w-full h-1.5 rounded-full" style={{ background: '#e8eef6' }}>
                                  <div className="h-1.5 rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#1a9ef4,#1a6fc4)' }} />
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Suspended */}
                    {suspendedCands.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1" style={{ background: '#fee2e2' }} />
                          <span className="text-xs font-semibold" style={{ color: '#ef4444' }}>🚫 Suspended</span>
                          <div className="h-px flex-1" style={{ background: '#fee2e2' }} />
                        </div>
                        <div className="space-y-2">
                          {suspendedCands.map(candidate => (
                            <div key={candidate.id}
                              style={{ background: '#fff5f5', border: '2px solid #fecaca', borderRadius: 14, padding: '10px 14px', opacity: 0.75, cursor: 'not-allowed' }}>
                              <div className="flex items-center gap-3">
                                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: '#fee2e2', border: '2px solid #fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Lock style={{ width: 11, height: 11, color: '#ef4444' }} />
                                </div>
                                <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={38} suspended />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm leading-tight" style={{ color: '#94a3b8' }}>{candidate.name}</div>
                                  <div className="text-xs" style={{ color: '#ef4444', fontWeight: 600 }}>Suspended — not eligible for votes</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Disqualified */}
                    {disqualifiedCands.length > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-px flex-1" style={{ background: '#fde68a' }} />
                          <span className="text-xs font-semibold" style={{ color: '#d97706' }}>❌ Disqualified</span>
                          <div className="h-px flex-1" style={{ background: '#fde68a' }} />
                        </div>
                        <div className="space-y-2">
                          {disqualifiedCands.map(candidate => (
                            <div key={candidate.id}
                              style={{ background: '#fffbeb', border: '2px solid #fde68a', borderRadius: 14, padding: '10px 14px', opacity: 0.65, cursor: 'not-allowed' }}>
                              <div className="flex items-center gap-3">
                                <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, background: '#fef3c7', border: '2px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Ban style={{ width: 11, height: 11, color: '#d97706' }} />
                                </div>
                                <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={38} suspended />
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm leading-tight" style={{ color: '#94a3b8' }}>{candidate.name}</div>
                                  <div className="text-xs" style={{ color: '#d97706', fontWeight: 600 }}>Disqualified — votes not counted</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit */}
        {settings.electionOpen && positionsWithCandidates.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
              style={{ background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af' }}>
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#1a9ef4' }} />
              <span>
                You've voted in <strong>{totalVotedPositions}</strong> of <strong>{positionsWithCandidates.length}</strong> positions.
                You can skip any position — voting is optional per position.
              </span>
            </div>
            <button onClick={submitBallot} disabled={submitting} className="election-cta-btn">
              <CheckCircle className="w-5 h-5 inline mr-2" />
              {submitting ? 'Submitting...' : 'Submit Ballot'}
            </button>
            <p className="text-center text-xs mt-2" style={{ color: '#94a3b8' }}>
              Once submitted, your ballot cannot be changed.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
