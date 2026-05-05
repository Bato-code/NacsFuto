import { useState, useEffect, useRef, useCallback } from 'react'
import { Heart, MessageCircle, Share2, Trash2, Edit2, Check, X, Plus, Copy, ExternalLink } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth, getDisplayName } from '../contexts/AuthContext'
import { Link, useParams, useNavigate } from 'react-router-dom'
import FileUploader from '../components/FileUploader'

interface Post {
  id: string; author_name: string; author_id: string; content: string
  media: any; likes: number; liked_by: string[]; created_at: string; approved: boolean
}
interface Comment {
  id: string; post_id: string; author: string; author_id: string; content: string; created_at: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = (name || 'U').split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const colors = ['#0284c7', '#0891b2', '#0369a1', '#1e40af', '#7c3aed']
  const color = colors[(name || '').charCodeAt(0) % colors.length]
  return (
    <div className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.32 }}>
      {initials}
    </div>
  )
}

// ── Share Popover ──────────────────────────────────────────────────────────────
function ShareMenu({ postId, content, onClose }: { postId: string; content: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const [igCopied, setIgCopied] = useState(false)

  const url = `${window.location.origin}/feed/${postId}`
  const excerpt = content.slice(0, 80) + (content.length > 80 ? '...' : '')
  const encodedUrl = encodeURIComponent(url)
  const encodedText = encodeURIComponent(`${excerpt}\n\nRead more: ${url}`)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => { setCopied(false); onClose() }, 1800)
    } catch {
      prompt('Copy this link:', url)
    }
  }

  const copyForIG = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setIgCopied(true)
      setTimeout(() => { setIgCopied(false); onClose() }, 2000)
    } catch {
      prompt('Copy this link for Instagram:', url)
    }
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'NACS Post', text: excerpt, url })
        onClose()
      } catch { /* cancelled */ }
    }
  }

  const SHARE_OPTIONS = [
    {
      label: copied ? 'Copied!' : 'Copy Link',
      icon: copied ? '✅' : '🔗',
      action: copyLink,
      highlight: copied,
    },
    {
      label: 'WhatsApp',
      icon: '💬',
      action: () => { window.open(`https://wa.me/?text=${encodedText}`, '_blank'); onClose() },
    },
    {
      label: 'X (Twitter)',
      icon: '🐦',
      action: () => { window.open(`https://x.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(excerpt)}`, '_blank'); onClose() },
    },
    {
      label: 'Facebook',
      icon: '📘',
      action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank'); onClose() },
    },
    {
      label: igCopied ? 'Copied for IG!' : 'Instagram',
      icon: igCopied ? '✅' : '📸',
      action: copyForIG,
      highlight: igCopied,
      note: 'Link copied — paste in IG bio or story',
    },
    ...(typeof navigator.share === 'function' ? [{
      label: 'More Options',
      icon: '📱',
      action: nativeShare,
    }] : []),
  ]

  return (
    <div ref={ref}
      className="absolute bottom-10 right-0 z-50 rounded-xl border shadow-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        minWidth: 200,
        animation: 'slideUp 0.18s ease',
      }}>
      <div className="px-3 py-2 border-b text-xs font-semibold uppercase tracking-widest"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
        Share Post
      </div>
      {SHARE_OPTIONS.map(opt => (
        <button key={opt.label} onClick={opt.action}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
          style={{ color: opt.highlight ? '#10b981' : 'var(--text-secondary)' }}
          onMouseEnter={e => { if (!opt.highlight) (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)' }}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
          <span className="text-base w-5 text-center">{opt.icon}</span>
          <div>
            <div className="font-medium">{opt.label}</div>
            {opt.note && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.note}</div>}
          </div>
        </button>
      ))}
    </div>
  )
}

// ── PostCard ───────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, isAdmin, onDelete, onLike, highlighted }: {
  post: Post; currentUserId: string | null; isAdmin: boolean
  onDelete: (id: string) => void; onLike: (post: Post) => void
  highlighted?: boolean
}) {
  const [comments, setComments] = useState<Comment[]>([])
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [highlightRing, setHighlightRing] = useState(highlighted || false)
  const cardRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuth()
  const liked = currentUserId ? (post.liked_by || []).includes(currentUserId) : false

  // Fade out highlight ring after 3s
  useEffect(() => {
    if (highlighted) {
      setHighlightRing(true)
      const t = setTimeout(() => setHighlightRing(false), 3000)
      return () => clearTimeout(t)
    }
  }, [highlighted])

  useEffect(() => { if (showComments) fetchComments() }, [showComments])

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  const addComment = async () => {
    if (!newComment.trim() || !currentUserId) return
    setLoading(true)
    await supabase.from('comments').insert({ post_id: post.id, author: getDisplayName(profile), author_id: currentUserId, content: newComment.trim() })
    setNewComment(''); await fetchComments(); setLoading(false)
  }

  const deleteComment = async (commentId: string) => {
    await supabase.from('comments').delete().eq('id', commentId)
    setComments(c => c.filter(x => x.id !== commentId))
  }

  const saveEdit = async (commentId: string) => {
    await supabase.from('comments').update({ content: editContent }).eq('id', commentId)
    setComments(c => c.map(x => x.id === commentId ? { ...x, content: editContent } : x))
    setEditingComment(null)
  }

  const mediaUrl = post.media?.url || post.media?.image_url || (Array.isArray(post.media) ? post.media[0]?.url : null)
  const embedUrl = post.media?.embed_url || null

  const getEmbedSrc = (url: string) => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`
    if (url.includes('facebook.com')) return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`
    return null
  }
  const iframeSrc = embedUrl ? getEmbedSrc(embedUrl) : null

  return (
    <div
      ref={cardRef}
      className="glass-card overflow-hidden transition-all duration-700"
      style={{
        borderColor: highlightRing ? 'var(--accent)' : 'var(--border)',
        boxShadow: highlightRing ? '0 0 0 2px var(--accent), 0 0 32px var(--btn-shadow)' : undefined,
      }}
    >
      {/* Highlighted banner */}
      {highlighted && (
        <div className="px-4 py-1.5 text-xs font-semibold flex items-center gap-1.5"
          style={{ background: 'var(--accent-dim)', borderBottom: '1px solid var(--accent-border)', color: 'var(--accent)' }}>
          🔗 You were linked to this post
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={post.author_name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{post.author_name}</span>
              {isAdmin && <span className="badge-admin">ADMIN</span>}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(post.created_at)}</span>
            </div>
            <p className="text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--text-secondary)' }}>{post.content}</p>
          </div>
          {(isAdmin || post.author_id === currentUserId) && (
            <button onClick={() => onDelete(post.id)} className="p-1 rounded transition-colors shrink-0"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {mediaUrl && (
        <div className="px-4 pb-3">
          <img src={mediaUrl} alt="Post media" className="rounded-lg w-full max-h-80 object-cover" />
        </div>
      )}

      {iframeSrc && (
        <div className="px-4 pb-3">
          <div className="rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <iframe src={iframeSrc} className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              title="Embedded video" style={{ border: 'none' }} />
          </div>
        </div>
      )}

      {embedUrl && !iframeSrc && (
        <div className="px-4 pb-3">
          <a href={embedUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg border text-xs"
            style={{ borderColor: 'var(--accent-border)', color: 'var(--accent)', background: 'var(--accent-dim)' }}>
            🎬 View embedded content
            <ExternalLink className="w-3 h-3 ml-auto" />
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 flex items-center gap-4 relative" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={() => currentUserId ? onLike(post) : null}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: liked ? '#ef4444' : 'var(--text-muted)' }}
          onMouseEnter={e => { if (!liked) (e.currentTarget as HTMLElement).style.color = '#ef4444' }}
          onMouseLeave={e => { if (!liked) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
          <span>{post.likes || 0}</span>
        </button>

        <button onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm transition-colors"
          style={{ color: showComments ? 'var(--accent)' : 'var(--text-muted)' }}>
          <MessageCircle className="w-4 h-4" />
          <span>{comments.length || 0}</span>
        </button>

        {/* Share button + popover */}
        <div className="relative ml-auto">
          <button
            onClick={() => setShowShare(s => !s)}
            className="flex items-center gap-1.5 text-sm transition-colors"
            style={{ color: showShare ? 'var(--accent)' : 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
            onMouseLeave={e => { if (!showShare) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}>
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Share</span>
          </button>

          {showShare && (
            <ShareMenu
              postId={post.id}
              content={post.content}
              onClose={() => setShowShare(false)}
            />
          )}
        </div>
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.1)' }}>
          <div className="p-4 space-y-3">
            {comments.map(comment => (
              <div key={comment.id} className="flex items-start gap-2">
                <Avatar name={comment.author} size={28} />
                <div className="flex-1 rounded-lg p-2" style={{ background: 'var(--bg-dark)' }}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{comment.author}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
                  </div>
                  {editingComment === comment.id ? (
                    <div className="flex gap-2 mt-1">
                      <input className="cyber-input text-xs py-1 flex-1" value={editContent} onChange={e => setEditContent(e.target.value)} />
                      <button onClick={() => saveEdit(comment.id)} style={{ color: '#10b981' }}><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingComment(null)} style={{ color: 'var(--text-muted)' }}><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{comment.content}</p>
                  )}
                </div>
                {(comment.author_id === currentUserId || isAdmin) && editingComment !== comment.id && (
                  <div className="flex gap-1 shrink-0">
                    {comment.author_id === currentUserId && (
                      <button onClick={() => { setEditingComment(comment.id); setEditContent(comment.content) }}
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteComment(comment.id)}
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#ef4444'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            {currentUserId ? (
              <div className="flex gap-2">
                <Avatar name={getDisplayName(profile)} size={28} />
                <div className="flex-1 flex gap-2">
                  <input className="cyber-input text-xs py-1.5 flex-1" placeholder="Write a comment..."
                    value={newComment} onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addComment()} />
                  <button onClick={addComment} disabled={loading} className="cyber-btn text-xs py-1 px-3 shrink-0">Post</button>
                </div>
              </div>
            ) : (
              <p className="text-center text-xs py-2" style={{ color: 'var(--text-muted)' }}>
                <Link to="/login" style={{ color: 'var(--accent)' }} className="hover:underline">Sign in</Link> to comment
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Feed Page ─────────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user, isAdmin, profile } = useAuth()
  const { postId: linkedPostId } = useParams<{ postId?: string }>()
  const navigate = useNavigate()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [embedUrl, setEmbedUrl] = useState('')
  const [mediaMode, setMediaMode] = useState<'file' | 'embed'>('file')
  const [posting, setPosting] = useState(false)
  const [showCreate, setShowCreate] = useState(false)

  // Refs for deep-linked post scroll
  const highlightedRef = useRef<HTMLDivElement>(null)

  const createPost = async () => {
    if (!newPostContent.trim() || !user) return
    setPosting(true)
    const media = mediaMode === 'embed' && embedUrl
      ? { embed_url: embedUrl }
      : mediaUrl ? { url: mediaUrl } : null
    await supabase.from('posts').insert({
      author_id: user.id,
      author_name: getDisplayName(profile),
      content: newPostContent.trim(),
      media,
      likes: 0,
      approved: isAdmin ? true : false,
      pending: isAdmin ? false : true,
    })
    setNewPostContent(''); setMediaUrl(''); setEmbedUrl(''); setPosting(false); setShowCreate(false)
    if (!isAdmin) alert('Post submitted! Awaiting admin approval.')
    else fetchPosts()
  }

  useEffect(() => { fetchPosts() }, [])

  // Auto-scroll to linked post once posts are loaded
  useEffect(() => {
    if (!loading && linkedPostId && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [loading, linkedPostId])

  const fetchPosts = async () => {
    setLoading(true)
    const { data } = await supabase.from('posts').select('*').eq('approved', true).order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }

  const handleLike = async (post: Post) => {
    if (!user) return
    const liked = (post.liked_by || []).includes(user.id)
    const newLikedBy = liked ? (post.liked_by || []).filter(id => id !== user.id) : [...(post.liked_by || []), user.id]
    const newLikes = liked ? (post.likes || 1) - 1 : (post.likes || 0) + 1
    await supabase.from('posts').update({ likes: newLikes, liked_by: newLikedBy }).eq('id', post.id)
    if (!liked) await supabase.from('post_likes').insert({ post_id: post.id, user_id: user.id })
    else await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', user.id)
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, likes: newLikes, liked_by: newLikedBy } : p))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', id)
    setPosts(prev => prev.filter(p => p.id !== id))
    if (linkedPostId === id) navigate('/feed')
  }

  // Sort posts so the linked one always appears first
  const sortedPosts = linkedPostId
    ? [
        ...posts.filter(p => p.id === linkedPostId),
        ...posts.filter(p => p.id !== linkedPostId),
      ]
    : posts

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-center mb-4"><span className="terminal-badge">💬 ./feed</span></div>
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-1" style={{ color: 'var(--text-primary)' }}>
        Department <span style={{ color: 'var(--accent)' }}>Feed</span>
      </h1>
      <p className="text-center text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>Official NACS announcements</p>

      {/* Create post box */}
      <div className="glass-card p-4 mb-6">
        {!user ? (
          /* ── Guest: show share box but prompt sign-in on click ── */
          <div>
            <button
              onClick={() => {
                const el = document.createElement('div')
                el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;'
                el.innerHTML = ''
                document.body.appendChild(el)
                window.location.href = '/login'
              }}
              className="w-full flex items-center gap-3 text-left"
              style={{ color: 'var(--text-muted)' }}>
              <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold"
                style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                ?
              </div>
              <span className="text-sm flex-1 py-2 px-3 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
                Share something with NACS...
              </span>
              <Plus className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
            </button>
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              <Link to="/login" style={{ color: 'var(--accent)' }} className="hover:underline">Sign in</Link>
              {' '}to like, comment and share posts
            </p>
          </div>
        ) : !showCreate ? (
          <button onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-3 text-left"
            style={{ color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold"
              style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-dim)', color: 'var(--accent)' }}>
              {getDisplayName(profile)[0].toUpperCase()}
            </div>
            <span className="text-sm flex-1 py-2 px-3 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--border)' }}>
              Share something with NACS...
            </span>
            <Plus className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
          </button>
        ) : (
          <div className="space-y-3">
            <textarea className="cyber-input resize-none h-24"
              placeholder="Share something with NACS..."
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)} />
            <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['file', 'embed'] as const).map(m => (
                <button key={m} onClick={() => setMediaMode(m)}
                  className="flex-1 py-1.5 text-xs font-medium transition-colors"
                  style={mediaMode === m
                    ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
                    : { background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
                  {m === 'file' ? '📁 Media Upload' : '🎬 Embed Video'}
                </button>
              ))}
            </div>
            {mediaMode === 'file' ? (
              <FileUploader label="Attach media (optional)" value={mediaUrl} onChange={setMediaUrl} accept="image/*,video/*" />
            ) : (
              <div>
                <input className="cyber-input" placeholder="YouTube / Facebook / Instagram / Twitter URL"
                  value={embedUrl} onChange={e => setEmbedUrl(e.target.value)} />
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Paste any YouTube, Facebook, IG or Twitter video link</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={createPost} disabled={posting} className="cyber-btn flex-1">
                {posting ? 'Submitting...' : isAdmin ? 'Post Now' : 'Submit for Approval'}
              </button>
              <button onClick={() => { setShowCreate(false); setNewPostContent(''); setMediaUrl(''); setEmbedUrl('') }}
                className="cyber-btn-ghost">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Back to full feed link when viewing a linked post */}
      {linkedPostId && (
        <button onClick={() => navigate('/feed')}
          className="mb-4 text-xs flex items-center gap-1 hover:underline"
          style={{ color: 'var(--accent)' }}>
          ← Back to full feed
        </button>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : sortedPosts.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>No posts yet.</div>
      ) : (
        <div className="space-y-4">
          {sortedPosts.map(post => (
            <div key={post.id} ref={post.id === linkedPostId ? highlightedRef : undefined}>
              <PostCard
                post={post}
                currentUserId={user?.id || null}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                onLike={handleLike}
                highlighted={post.id === linkedPostId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
