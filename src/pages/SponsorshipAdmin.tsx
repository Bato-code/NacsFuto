import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Plus, Minus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface Candidate {
  id: string
  name: string
  position: string
  image_url?: string
  status: string
  contribution?: number
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

export default function SponsorshipAdmin() {
  const { user, profile, loading: authLoading } = useAuth()
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [contributionInput, setContributionInput] = useState<Record<string, string>>({})
  const [savingContribution, setSavingContribution] = useState<Record<string, boolean>>({})
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && user && profile?.is_admin) {
      fetchCandidates()
    } else if (!authLoading) {
      setPageLoading(false)
    }
  }, [authLoading, user, profile])

  const fetchCandidates = async () => {
    const { data } = await supabase
      .from('election_candidates')
      .select('*')
      .order('created_at')
    setCandidates((data || []) as Candidate[])
    setPageLoading(false)
  }

  const updateContribution = async (id: string, amount: number) => {
    if (amount < 0) amount = 0
    setSavingContribution(prev => ({ ...prev, [id]: true }))
    const { error } = await supabase
      .from('election_candidates')
      .update({ contribution: amount })
      .eq('id', id)
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

  // Show spinner while auth or data is loading
  if (authLoading || pageLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #7c3aed', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  // Redirect non-admins silently to home
  if (!user || !profile?.is_admin) {
    return <Navigate to="/" replace />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '24px 16px 48px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0 }}>Sponsorship Votes</h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            Tap <strong>+</strong> to add votes or <strong>−</strong> to correct as payments come in.
          </p>
        </div>

        {/* Per-position groups */}
        {POSITIONS.map(position => {
          const posCandidates = candidates.filter(c => c.position === position && c.status !== 'disqualified')
          if (posCandidates.length === 0) return null
          const posTotal = posCandidates.reduce((s, c) => s + (c.contribution ?? 0), 0)
          const topVotes = Math.max(...posCandidates.map(c => c.contribution ?? 0), 0)

          return (
            <div key={position} style={{ borderRadius: 16, marginBottom: 16, overflow: 'hidden', background: '#fff', border: '1px solid #e8eef6', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

              {/* Position header */}
              <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(90deg, #f5f3ff, #f8fafc)', borderBottom: '1px solid #ede9fe' }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>{position}</span>
                <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#ede9fe', color: '#6d28d9' }}>
                  {posTotal} vote{posTotal !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Candidates */}
              <div>
                {posCandidates.map((candidate, idx) => {
                  const votes = candidate.contribution ?? 0
                  const pct = topVotes > 0 ? (votes / topVotes) * 100 : 0
                  const isSaving = savingContribution[candidate.id] ?? false
                  const inputVal = contributionInput[candidate.id] ?? ''
                  const isLeading = votes > 0 && votes === topVotes && posCandidates.length > 1

                  return (
                    <div key={candidate.id} style={{ padding: '12px 16px', borderTop: idx > 0 ? '1px solid #f1f5f9' : undefined }}>

                      {/* Name + controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {candidate.image_url ? (
                          <img src={candidate.image_url} alt={candidate.name}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: isLeading ? '2px solid #7c3aed' : '2px solid #e8eef6' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0, background: isLeading ? 'linear-gradient(135deg, #7c3aed, #5b21b6)' : 'linear-gradient(135deg, #94a3b8, #64748b)' }}>
                            {candidate.name[0]?.toUpperCase()}
                          </div>
                        )}

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{candidate.name}</span>
                            {isLeading && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, fontWeight: 700, background: '#ede9fe', color: '#6d28d9' }}>Leading</span>}
                            {candidate.status === 'suspended' && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 99, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>Suspended</span>}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 2, color: '#94a3b8' }}>
                            {votes} vote{votes !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {/* +/− controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => adjustContribution(candidate.id, -1)}
                            disabled={votes === 0 || isSaving}
                            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: votes > 0 ? 'pointer' : 'not-allowed', background: votes > 0 ? '#fee2e2' : '#f1f5f9', color: votes > 0 ? '#dc2626' : '#cbd5e1' }}>
                            <Minus size={14} />
                          </button>

                          <div style={{ width: 40, textAlign: 'center', fontSize: 17, fontWeight: 900, color: votes > 0 ? '#7c3aed' : '#cbd5e1' }}>
                            {isSaving ? '…' : votes}
                          </div>

                          <button
                            onClick={() => adjustContribution(candidate.id, 1)}
                            disabled={isSaving}
                            style={{ width: 36, height: 36, borderRadius: 10, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#d1fae5', color: '#059669' }}>
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div style={{ width: '100%', height: 6, borderRadius: 99, background: '#f1f5f9', marginTop: 10, marginBottom: 8 }}>
                        <div style={{ height: 6, borderRadius: 99, width: `${pct}%`, transition: 'width 0.5s', background: isLeading ? 'linear-gradient(90deg, #7c3aed, #5b21b6)' : '#c4b5fd' }} />
                      </div>

                      {/* Bulk add row */}
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>Add bulk:</span>
                        {[3, 5, 10].map(n => (
                          <button key={n} onClick={() => adjustContribution(candidate.id, n)}
                            style={{ padding: '3px 8px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', cursor: 'pointer' }}>
                            +{n}
                          </button>
                        ))}
                        <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                          <input
                            type="number"
                            min="1"
                            placeholder="#"
                            value={inputVal}
                            onChange={e => setContributionInput(prev => ({ ...prev, [candidate.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && inputVal) {
                                adjustContribution(candidate.id, Number(inputVal))
                                setContributionInput(prev => ({ ...prev, [candidate.id]: '' }))
                              }
                            }}
                            style={{ width: 48, borderRadius: 8, padding: '3px 6px', fontSize: 11, textAlign: 'center', border: '1px solid #e8eef6', background: '#f8fafc', color: '#0f172a', outline: 'none' }}
                          />
                          <button
                            onClick={() => {
                              if (inputVal) {
                                adjustContribution(candidate.id, Number(inputVal))
                                setContributionInput(prev => ({ ...prev, [candidate.id]: '' }))
                              }
                            }}
                            disabled={!inputVal}
                            style={{ padding: '3px 10px', borderRadius: 8, border: 'none', fontSize: 11, fontWeight: 700, cursor: inputVal ? 'pointer' : 'not-allowed', background: inputVal ? '#7c3aed' : '#e2e8f0', color: inputVal ? '#fff' : '#94a3b8' }}>
                            +Add
                          </button>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
