import { Link } from 'react-router-dom'
import { MapPin, Mail } from 'lucide-react'

export default function Footer() {
  const now = new Date()
  const lastUpdated = now.toLocaleDateString('en-GB', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  const year = now.getFullYear()

  const SOCIAL_LINKS = [
    {
      label: 'Discord',
      href: 'https://discord.gg/nacsfuto',
      hoverColor: '#5865F2',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.025.021.049.041.062a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
        </svg>
      ),
    },
    {
      label: 'Instagram',
      href: 'https://www.instagram.com/official_nacs?utm_source=qr&igsh=Z3MzMmw5MDU4b2Nj',
      hoverColor: '#ec4899',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      label: 'X (Twitter)',
      href: 'https://x.com/nacsfuto',
      hoverColor: '#38bdf8',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      label: 'WhatsApp',
      href: 'https://www.whatsapp.com/channel/0029VaO69XSLdQemYnqvAr02',
      hoverColor: '#25d366',
      icon: (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
    },
  ]

  const QUICK_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/feed', label: 'Feed' },
    { to: '/courses', label: 'Courses' },
    { to: '/past-questions', label: 'Past Questions' },
    { to: '/lecture-notes', label: 'Lecture Notes' },
    { to: '/about', label: 'About Us' },
    { to: '/election', label: 'Election Portal' },
  ]

  return (
    <footer className="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full border-2 overflow-hidden shrink-0"
                style={{ borderColor: 'var(--accent)', boxShadow: '0 0 12px var(--hero-glow)' }}>
                <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--footer-heading)' }}>NACS FUTO</div>
                <div className="text-xs font-mono" style={{ color: 'var(--accent)' }}>Securing Tomorrow</div>
              </div>
            </div>
            <p className="text-sm leading-relaxed mb-5 max-w-xs" style={{ color: 'var(--footer-text)' }}>
              Nurturing Nigeria's future cybersecurity professionals — from FUTO to the world. Empowering students through knowledge, collaboration, and innovation.
            </p>

            {/* Social icons */}
            <div className="flex gap-2 flex-wrap">
              {SOCIAL_LINKS.map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  title={s.label}
                  className="w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-200"
                  style={{ borderColor: 'var(--border)', color: 'var(--footer-muted)' }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = s.hoverColor
                    el.style.borderColor = s.hoverColor
                    el.style.background = `${s.hoverColor}15`
                    el.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement
                    el.style.color = 'var(--footer-muted)'
                    el.style.borderColor = 'var(--border)'
                    el.style.background = 'transparent'
                    el.style.transform = ''
                  }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--footer-heading)' }}>Quick Links</h4>
            <ul className="space-y-2">
              {QUICK_LINKS.map(l => (
                <li key={l.to}>
                  <Link to={l.to}
                    className="text-sm transition-colors flex items-center gap-1.5 group"
                    style={{ color: 'var(--footer-text)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-text)'}>
                    <span style={{ color: 'var(--accent)', opacity: 0.5 }} className="group-hover:opacity-100 transition-opacity">›</span>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4" style={{ color: 'var(--footer-heading)' }}>Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
                <span className="text-sm leading-relaxed" style={{ color: 'var(--footer-text)' }}>
                  <a
                    href="https://futo.edu.ng/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:underline"
                    style={{ color: 'var(--footer-text)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-text)'}>
                    Federal University of Technology
                  </a>
                  <br />Owerri, Imo State, Nigeria
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                <a href="mailto:nacsfuto@gmail.com"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--footer-text)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-text)'}>
                  nacsfuto@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="section-divider" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" style={{ color: 'var(--footer-muted)' }}>
          <span>© {year} CyberSecurity FUTO. All rights reserved.</span>
          <div className="flex gap-4 flex-wrap justify-center">
            <a href="#" className="transition-colors" style={{ color: 'var(--footer-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-heading)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-muted)'}>Privacy Policy</a>
            <a href="#" className="transition-colors" style={{ color: 'var(--footer-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-heading)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-muted)'}>Terms of Service</a>
            <a href="#" className="transition-colors" style={{ color: 'var(--footer-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-heading)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--footer-muted)'}>Security Policy</a>
          </div>
        </div>

        {/* ── Terminal status bar (live date) ── */}
        <div className="status-bar mt-4">
          <span>root@futo-cybersec:~$ </span>
          <span>System status: </span><span className="success-text">SECURE</span>
          <span> | Uptime: </span><span className="highlight">99.9%</span>
          <span> | Last updated: {lastUpdated}</span>
        </div>

        <div className="text-center mt-3 text-xs font-mono" style={{ color: 'var(--footer-muted)' }}>
          2026/2027 | Office of the Director of Research/ICT | Bato
        </div>
      </div>
    </footer>
  )
}
