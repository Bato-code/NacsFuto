import { useState, useRef, useId } from 'react'
import { Upload, Link, X, FileText, Image, Film, File } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface FileUploaderProps {
  value: string
  onChange: (url: string) => void
  accept?: string
  label?: string
  bucket?: string
}

function getFileIcon(fileType: string) {
  if (fileType.startsWith('image/')) return <Image className="w-4 h-4" />
  if (fileType.startsWith('video/')) return <Film className="w-4 h-4" />
  if (fileType.includes('pdf')) return <FileText className="w-4 h-4" />
  return <File className="w-4 h-4" />
}

export default function FileUploader({ value, onChange, accept, label, bucket = 'uploads' }: FileUploaderProps) {
  // Unique per-instance id so multiple FileUploaders on the same page
  // (e.g. thumbnail + several course-body image blocks) never collide.
  // Previously this was a hardcoded string id, which meant every instance's
  // <label htmlFor> pointed at the *first* <input> in the DOM with that id —
  // so uploading in a block overwrote whatever uploader rendered first (the thumbnail).
  const inputId = useId()

  const [mode, setMode] = useState<'local' | 'url'>('local')
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('')
  const [urlInput, setUrlInput] = useState(value || '')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setFileName(file.name)
    setFileType(file.type)

    // Show local preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    // Upload to Supabase Storage
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (!error && data) {
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
      onChange(urlData.publicUrl)
    } else {
      // Fallback: use object URL (works for preview but not persistent)
      const objectUrl = URL.createObjectURL(file)
      onChange(objectUrl)
    }

    setUploading(false)
  }

  const handleUrlConfirm = () => {
    onChange(urlInput)
    if (urlInput.match(/\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      setPreview(urlInput)
    }
  }

  const clearFile = () => {
    onChange('')
    setPreview(null)
    setFileName(null)
    setFileType('')
    setUrlInput('')
    if (fileRef.current) fileRef.current.value = ''
  }

  const isImage = value && (fileType.startsWith('image/') || value.match(/\.(jpg|jpeg|png|gif|webp|svg)/i))

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs font-medium block" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </label>
      )}

      {/* Mode tabs */}
      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
        <button
          type="button"
          onClick={() => setMode('local')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
          style={mode === 'local'
            ? { background: 'var(--accent-dim)', color: 'var(--accent)', borderRight: '1px solid var(--accent-border)' }
            : { background: 'var(--input-bg)', color: 'var(--text-muted)', borderRight: '1px solid var(--border)' }}>
          <Upload className="w-3.5 h-3.5" />
          Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors"
          style={mode === 'url'
            ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
            : { background: 'var(--input-bg)', color: 'var(--text-muted)' }}>
          <Link className="w-3.5 h-3.5" />
          Paste URL
        </button>
      </div>

      {/* Local upload area */}
      {mode === 'local' && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept={accept || 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'}
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
          />
          <label
            htmlFor={inputId}
            className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors py-5"
            style={{ borderColor: uploading ? 'var(--accent)' : 'var(--border)', background: 'var(--input-bg)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-border)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = uploading ? 'var(--accent)' : 'var(--border)'}
          >
            {uploading ? (
              <>
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                <span className="text-xs" style={{ color: 'var(--accent)' }}>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6" style={{ color: 'var(--text-muted)' }} />
                <div className="text-center">
                  <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Click to upload</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Images, PDF, DOCX, Excel, etc.
                  </div>
                </div>
              </>
            )}
          </label>
        </div>
      )}

      {/* URL input */}
      {mode === 'url' && (
        <div className="flex gap-2">
          <input
            className="cyber-input flex-1"
            placeholder="https://..."
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUrlConfirm()}
          />
          <button
            type="button"
            onClick={handleUrlConfirm}
            className="cyber-btn text-xs px-3 py-2 shrink-0"
          >
            Use
          </button>
        </div>
      )}

      {/* Preview / file info */}
      {value && (
        <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'var(--accent-border)', background: 'var(--accent-dim)' }}>
          {isImage ? (
            <img src={preview || value} alt="Preview" className="w-full max-h-40 object-cover" onError={() => setPreview(null)} />
          ) : fileName ? (
            <div className="flex items-center gap-2 p-3">
              <div style={{ color: 'var(--accent)' }}>{getFileIcon(fileType)}</div>
              <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{fileName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3">
              <Link className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="text-xs truncate flex-1" style={{ color: 'var(--text-secondary)' }}>{value}</span>
            </div>
          )}
          <button
            type="button"
            onClick={clearFile}
            className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
