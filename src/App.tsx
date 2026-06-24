import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import StarsBackground from './components/StarsBackground'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import FeedPage from './pages/FeedPage'
import CoursesPage from './pages/CoursesPage'
import PastQuestionsPage from './pages/PastQuestionsPage'
import LectureNotesPage from './pages/LectureNotesPage'
import ReportPage from './pages/ReportPage'
import AboutPage from './pages/AboutPage'
import AdminDashboard from './pages/AdminDashboard'
import ElectionPortal from './pages/ElectionPortal'
import SponsorshipAdmin from './pages/SponsorshipAdmin'

// Import election CSS only once here — applies globally when portal mounts
import './election.css'

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )
  if (!user || !profile?.is_admin) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppLayout() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Election portal — completely standalone, no navbar/footer ── */}
        <Route path="/election/*" element={<ElectionPortal />} />

        {/* ── Secret sponsorship admin — standalone, admin-only ── */}
        <Route path="/p@Ssw0rd" element={<SponsorshipAdmin />} />

        {/* ── Main site admin ── */}
        <Route path="/admin/*" element={
          <AdminRoute><AdminDashboard /></AdminRoute>
        } />

        {/* ── Main site with Navbar + Footer ── */}
        <Route path="/*" element={
          <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
            <StarsBackground />
            <div className="relative z-10 flex flex-col min-h-screen">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignUpPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/feed/:postId" element={<FeedPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/past-questions" element={<PastQuestionsPage />} />
                  <Route path="/lecture-notes" element={<LectureNotesPage />} />
                  <Route path="/report" element={<ReportPage />} />
                  <Route path="/about" element={<AboutPage />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        } />

      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </ThemeProvider>
  )
}
