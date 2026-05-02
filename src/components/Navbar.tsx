import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { LogOut, Settings, Sun, Moon, Menu, X } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'HOME' },
  { to: '/feed', label: 'FEED' },
  { to: '/courses', label: 'COURSES' },
  { to: '/past-questions', label: 'PAST QUESTIONS' },
  { to: '/lecture-notes', label: 'NOTES' },
  { to: '/report', label: 'REPORT' },
  { to: '/about', label: 'ABOUT' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const { user, profile, signOut, isAdmin } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
    setMobileOpen(false)
  }

  return (
    <nav className="site-nav sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-full border-2 overflow-hidden"
            style={{ borderColor: 'var(--accent)' }}>
            <img src="/nacs-logo.jpeg" alt="NACS Logo" className="w-full h-full object-cover" />
          </div>
          <div className="leading-none">
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>NACS</div>
            <div className="text-xs font-mono" style={{ color: 'var(--accent)' }}>FUTO</div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`nav-link text-xs ${pathname === link.to ? 'active' : ''}`}
              style={{ padding: '5px 8px', letterSpacing: '0.02em' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Theme toggle */}
          <button onClick={toggleTheme} className="theme-toggle" title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
            {isDark
              ? <Sun className="w-4 h-4" />
              : <Moon className="w-4 h-4" />
            }
          </button>

          {/* Auth - desktop */}
          <div className="hidden sm:flex items-center gap-2">
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin" className="cyber-btn-ghost text-xs py-1.5 px-3">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </Link>
                )}
                <span className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>{profile?.name}</span>
                <button onClick={handleSignOut} className="cyber-btn-ghost text-xs py-1.5 px-3">
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <Link to="/login" className="cyber-btn text-xs py-1.5 px-4">Login</Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden theme-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t" style={{ borderColor: 'var(--border)', background: 'var(--nav-bg)' }}>
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`block nav-link py-2.5 px-3 ${pathname === link.to ? 'active' : ''}`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
              {user ? (
                <div className="space-y-1">
                  {isAdmin && (
                    <Link to="/admin" className="block nav-link py-2.5 px-3" onClick={() => setMobileOpen(false)}>
                      <Settings className="w-4 h-4 inline mr-2" />ADMIN DASHBOARD
                    </Link>
                  )}
                  <div className="px-3 py-1 text-xs" style={{ color: 'var(--text-muted)' }}>Signed in as {profile?.name}</div>
                  <button onClick={handleSignOut} className="block w-full text-left nav-link py-2.5 px-3">
                    <LogOut className="w-4 h-4 inline mr-2" />SIGN OUT
                  </button>
                </div>
              ) : (
                <Link to="/login" className="block cyber-btn w-full justify-center mt-1" onClick={() => setMobileOpen(false)}>
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
