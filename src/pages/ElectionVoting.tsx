import { useState, useEffect } from 'react'
import { ArrowLeft, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Candidate { id: string; name: string; position: string; image_url?: string }
interface VoteMap { [position: string]: string }

function CandidateAvatar({ name, imageUrl, size = 48 }: { name: string; imageUrl?: string; size?: number }) {
  const [err, setErr] = useState(false)
  const initials = (name || 'U').split(' ').filter(Boolean).slice(-2).map((n: string) => n[0]).join('').toUpperCase()
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

export default function ElectionVoting({ onBack, settings }: {
  onBack: () => void
  settings: { electionOpen: boolean; resultsVisible: boolean; allowChanges: boolean }
}) {
  const { user, profile } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [myVotes, setMyVotes] = useState<VoteMap>({})
  const [results, setResults] = useState<Record<string, number>>({})
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [savingPosition, setSavingPosition] = useState<string | null>(null)
  const [openPositions, setOpenPositions] = useState<Record<string, boolean>>({})
  const [justSubmitted, setJustSubmitted] = useState(false)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    const { data: cands } = await supabase.from('election_candidates').select('*').eq('status', 'active').order('position')
    const list = cands || []
    setCandidates(list)
    const positions = [...new Set(list.map((c: Candidate) => c.position))]
    const openMap: Record<string, boolean> = {}
    positions.forEach(p => { openMap[p] = true })
    setOpenPositions(openMap)

    if (user) {
      const [{ data: votes }, { data: submission }] = await Promise.all([
        supabase.from('election_votes').select('*').eq('voter_id', user.id),
        supabase.from('election_submissions').select('id').eq('voter_id', user.id).single(),
      ])
      const voteMap: VoteMap = {}
      ;(votes || []).forEach((v: any) => { voteMap[v.position] = v.candidate_id })
      setMyVotes(voteMap)
      setHasSubmitted(!!submission)
    }

    if (settings.resultsVisible) {
      const { data: allVotes } = await supabase.from('election_votes').select('candidate_id')
      const r: Record<string, number> = {}
      ;(allVotes || []).forEach((v: any) => { r[v.candidate_id] = (r[v.candidate_id] || 0) + 1 })
      setResults(r)
    }
    setLoading(false)
  }

  const castVote = async (position: string, candidateId: string) => {
    if (!user || hasSubmitted) return
    if (!settings.allowChanges && myVotes[position]) return
    setSavingPosition(position)
    if (myVotes[position]) {
      await supabase.from('election_votes').update({ candidate_id: candidateId, voted_at: new Date().toISOString() }).eq('voter_id', user.id).eq('position', position)
    } else {
      await supabase.from('election_votes').insert({ voter_id: user.id, position, candidate_id: candidateId })
    }
    setMyVotes(prev => ({ ...prev, [position]: candidateId }))
    setSavingPosition(null)
  }

  const submitBallot = async () => {
    if (!user || hasSubmitted) return
    const positions = [...new Set(candidates.map(c => c.position))]
    const unvoted = positions.filter(p => !myVotes[p])
    if (unvoted.length > 0) {
      alert(`Please vote for all positions before submitting.\nMissing: ${unvoted.join(', ')}`)
      return
    }
    if (!confirm('Submit your ballot? This cannot be undone.')) return
    setSubmitting(true)
    await supabase.from('election_submissions').insert({ voter_id: user.id })
    setHasSubmitted(true)
    setJustSubmitted(true)
    setSubmitting(false)
    if (settings.resultsVisible) {
      const { data: allVotes } = await supabase.from('election_votes').select('candidate_id')
      const r: Record<string, number> = {}
      ;(allVotes || []).forEach((v: any) => { r[v.candidate_id] = (r[v.candidate_id] || 0) + 1 })
      setResults(r)
    }
  }

  const positions = [...new Set(candidates.map(c => c.position))]
  const totalForPosition = (pos: string) => candidates.filter(c => c.position === pos).reduce((s, c) => s + (results[c.id] || 0), 0)
  const votedCount = Object.keys(myVotes).length

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

  if (justSubmitted) {
    return (
      <div className="election-portal-bg min-h-screen flex items-center justify-center px-4">
        <div className="election-card w-full max-w-md p-8 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#0f172a' }}>Ballot Submitted!</h2>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>
            Your vote has been recorded securely. Thank you for participating in the NACSFUTO elections.
          </p>
          {settings.resultsVisible && (
            <button onClick={() => setJustSubmitted(false)}
              className="election-cta-btn mb-3">View Live Results</button>
          )}
          <button onClick={onBack} className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            Back to Election Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="election-portal-bg min-h-screen">
      {/* Top bar */}
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
            {profile?.name?.split(' ')[0]}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Already submitted banner */}
        {hasSubmitted && !justSubmitted && (
          <div className="rounded-2xl p-4 mb-6 flex items-center gap-3"
            style={{ background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)', border: '1px solid #6ee7b7' }}>
            <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#059669' }} />
            <div>
              <p className="text-sm font-bold" style={{ color: '#065f46' }}>Ballot Already Submitted</p>
              <p className="text-xs" style={{ color: '#047857' }}>
                {settings.resultsVisible ? 'Results are shown below.' : 'Results will be revealed when announced.'}
              </p>
            </div>
          </div>
        )}

        {/* Election closed */}
        {!settings.electionOpen && !hasSubmitted && (
          <div className="rounded-2xl p-5 mb-6 text-center"
            style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="text-3xl mb-2">🔒</div>
            <h3 className="font-bold" style={{ color: '#0f172a' }}>Election is Closed</h3>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>Voting is not currently open.</p>
          </div>
        )}

        {/* Progress */}
        {settings.electionOpen && !hasSubmitted && positions.length > 0 && (
          <div className="rounded-2xl p-4 mb-5" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold" style={{ color: '#0f172a' }}>Your Progress</span>
              <span className="text-sm font-bold" style={{ color: '#1a9ef4' }}>{votedCount}/{positions.length} positions</span>
            </div>
            <div className="w-full h-2.5 rounded-full" style={{ background: '#e8eef6' }}>
              <div className="h-2.5 rounded-full transition-all duration-500"
                style={{ background: 'linear-gradient(90deg, #1a9ef4, #1a6fc4)', width: `${positions.length > 0 ? (votedCount / positions.length) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Positions */}
        <div className="space-y-3 mb-6">
          {positions.map((position, posIdx) => {
            const posCandidates = candidates.filter(c => c.position === position)
            const myVote = myVotes[position]
            const total = totalForPosition(position)
            const isOpen = openPositions[position] !== false
            const canVote = settings.electionOpen && !hasSubmitted && (settings.allowChanges || !myVote)

            return (
              <div key={position} className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: `2px solid ${myVote ? '#bfdbfe' : '#e8eef6'}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
                <button className="w-full flex items-center justify-between p-4"
                  onClick={() => setOpenPositions(prev => ({ ...prev, [position]: !isOpen }))}>
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ background: myVote ? 'linear-gradient(135deg, #1a9ef4, #1a6fc4)' : '#cbd5e1' }}>
                      {myVote ? <CheckCircle className="w-4 h-4" /> : posIdx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm" style={{ color: '#0f172a' }}>{position}</div>
                      <div className="text-xs" style={{ color: '#94a3b8' }}>
                        {posCandidates.length} candidate{posCandidates.length !== 1 ? 's' : ''}
                        {settings.resultsVisible && ` · ${total} votes`}
                      </div>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />
                    : <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#94a3b8' }} />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: '1px solid #f1f5f9' }}>
                    {savingPosition === position && (
                      <div className="flex items-center gap-2 py-2 text-xs" style={{ color: '#1a9ef4' }}>
                        <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                          style={{ borderColor: '#1a9ef4', borderTopColor: 'transparent' }} />
                        Saving...
                      </div>
                    )}
                    <div className="pt-3 grid grid-cols-1 gap-2">
                      {posCandidates.map(candidate => {
                        const isSelected = myVote === candidate.id
                        const count = results[candidate.id] || 0
                        const pct = total > 0 ? Math.round((count / total) * 100) : 0
                        const isLeading = settings.resultsVisible && posCandidates.indexOf(candidate) === [...posCandidates].sort((a, b) => (results[b.id] || 0) - (results[a.id] || 0)).indexOf(candidate) && count > 0 && count === Math.max(...posCandidates.map(c => results[c.id] || 0))

                        return (
                          <button key={candidate.id}
                            onClick={() => canVote && castVote(position, candidate.id)}
                            disabled={!canVote}
                            className="w-full text-left rounded-xl p-3 transition-all"
                            style={{
                              background: isSelected ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#f8fafc',
                              border: `2px solid ${isSelected ? '#1a9ef4' : '#e8eef6'}`,
                              cursor: canVote ? 'pointer' : 'default',
                              transform: isSelected ? 'scale(1.01)' : 'scale(1)',
                            }}>
                            <div className="flex items-center gap-3">
                              <CandidateAvatar name={candidate.name} imageUrl={candidate.image_url} size={40} />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm leading-tight" style={{ color: '#0f172a' }}>{candidate.name}</div>
                                {isLeading && <span className="text-xs font-medium" style={{ color: '#f59e0b' }}>👑 Leading</span>}
                              </div>
                              {isSelected && <CheckCircle className="w-5 h-5 shrink-0" style={{ color: '#1a9ef4' }} />}
                            </div>
                            {settings.resultsVisible && (
                              <div className="mt-2.5">
                                <div className="flex justify-between text-xs mb-1" style={{ color: '#94a3b8' }}>
                                  <span>{count} vote{count !== 1 ? 's' : ''}</span>
                                  <span className="font-bold" style={{ color: isSelected ? '#1a9ef4' : '#64748b' }}>{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full" style={{ background: '#e8eef6' }}>
                                  <div className="h-1.5 rounded-full transition-all duration-700"
                                    style={{ width: `${pct}%`, background: isSelected ? 'linear-gradient(90deg,#1a9ef4,#1a6fc4)' : '#94a3b8' }} />
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit */}
        {settings.electionOpen && !hasSubmitted && positions.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {votedCount < positions.length && (
              <div className="flex items-start gap-2 rounded-xl p-3 mb-4 text-sm"
                style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e' }}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>You still need to vote for {positions.length - votedCount} more position{positions.length - votedCount !== 1 ? 's' : ''}.</span>
              </div>
            )}
            <button onClick={submitBallot}
              disabled={submitting || votedCount < positions.length}
              className="election-cta-btn"
              style={{ opacity: votedCount < positions.length ? 0.5 : 1 }}>
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
