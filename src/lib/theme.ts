// Centralized theme-aware style helpers
// These return inline style objects that respect CSS variables

export const themed = {
  // Text colors
  textPrimary: { color: 'var(--text-primary)' } as React.CSSProperties,
  textSecondary: { color: 'var(--text-secondary)' } as React.CSSProperties,
  textMuted: { color: 'var(--text-muted)' } as React.CSSProperties,
  textAccent: { color: 'var(--accent)' } as React.CSSProperties,

  // Backgrounds
  bgBase: { background: 'var(--bg-base)' } as React.CSSProperties,
  bgCard: { background: 'var(--bg-card)' } as React.CSSProperties,
  bgDark: { background: 'var(--bg-dark)' } as React.CSSProperties,
  bgAccentDim: { background: 'var(--accent-dim)' } as React.CSSProperties,

  // Borders
  border: { borderColor: 'var(--border)' } as React.CSSProperties,
  borderAccent: { borderColor: 'var(--accent-border)' } as React.CSSProperties,

  // Combined card style
  card: {
    background: 'var(--card-glass)',
    border: '1px solid var(--border)',
    borderRadius: 12,
  } as React.CSSProperties,

  innerCard: {
    background: 'var(--bg-dark)',
    border: '1px solid var(--border)',
    borderRadius: 8,
  } as React.CSSProperties,

  input: {
    background: 'var(--input-bg)',
    border: '1px solid var(--border)',
    color: 'var(--text-primary)',
  } as React.CSSProperties,

  // Status badges
  badgeSuccess: {
    background: 'rgba(16,185,129,0.1)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.72rem',
    fontWeight: 600,
  } as React.CSSProperties,

  badgeWarning: {
    background: 'rgba(245,158,11,0.1)',
    border: '1px solid rgba(245,158,11,0.3)',
    color: '#f59e0b',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.72rem',
    fontWeight: 600,
  } as React.CSSProperties,

  badgeDanger: {
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.72rem',
    fontWeight: 600,
  } as React.CSSProperties,

  badgeAccent: {
    background: 'var(--accent-dim)',
    border: '1px solid var(--accent-border)',
    color: 'var(--accent)',
    borderRadius: 20,
    padding: '2px 10px',
    fontSize: '0.72rem',
    fontWeight: 600,
  } as React.CSSProperties,
}
