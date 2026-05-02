# NACS FUTO — National Association of Cyber Security Students

A full-stack web application for the NACS FUTO department, built with **React + TypeScript + Tailwind CSS + Supabase**.

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in your Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

You can find these in your Supabase project under:
**Settings → API → Project URL & anon/public key**

### 3. Run the development server
```bash
npm run dev
```

### 4. Build for production
```bash
npm run build
```

---

## 🗄️ Supabase Setup

Make sure the following tables exist in your Supabase database (they match your existing schema):

- `profiles` — user profiles with `is_admin` flag
- `users` — extended user info
- `whitelisted_matric_numbers` — controls who can register
- `posts` — feed posts
- `comments` — post comments
- `post_likes` — like tracking
- `courses` — course submissions
- `materials` — past questions files
- `lecture_notes` — lecture note files
- `material_downloads` — download tracking
- `anonymous_reports` — anonymous reports
- `contact_messages` — about page contact form

### Enable Email Confirmation (optional)
In Supabase: **Authentication → Email → Enable email confirmations**

### Storage Buckets
For file uploads, create a public bucket called `files` in Supabase Storage, or use external URLs (Google Drive, etc.)

### Row Level Security (RLS) — Recommended Policies
- `profiles`: users can read/update their own row
- `posts`: anyone can read approved posts; admins can do everything
- `materials` / `lecture_notes`: anyone can read; only admins can insert/update/delete
- `anonymous_reports`: only admins can read; authenticated users can insert
- `contact_messages`: anyone can insert; only admins can read

---

## 👤 Making a User Admin

1. Register a user account normally
2. Go to your Supabase dashboard → **Table Editor → profiles**
3. Find the user's row and set `is_admin = true`
4. The user will now have access to `/admin` dashboard on next login

---

## 🔗 Pages & Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Home — hero, stats, leadership | Public |
| `/feed` | Department feed / announcements | Read: Public, Engage: Logged in |
| `/courses` | Course listings | Read: Public, Submit: Logged in |
| `/past-questions` | Past exam papers | Read: Public, Download: Logged in |
| `/lecture-notes` | Lecture notes by level/semester | Read: Public, Download: Logged in |
| `/report` | Anonymous report form | Logged in only |
| `/about` | About page + contact form | Public |
| `/login` | Login page | Public |
| `/signup` | 2-step registration | Public |
| `/admin/*` | Admin dashboard | Admin only |

---

## 🛡️ Admin Dashboard Features

Access at `/admin` — requires `is_admin = true` in profiles table.

- **Dashboard** — stats overview
- **Feed** — create/approve/delete posts
- **Courses** — approve/reject/delete course submissions
- **Past Questions** — upload/edit/delete files + view download counts
- **Lecture Notes** — upload/edit/delete files by level & semester
- **Reports** — view/mark-read/delete anonymous reports
- **Messages** — view/mark-read/delete contact messages
- **Users** — whitelist matric numbers, toggle admin status

---

## 🧱 Tech Stack

- **React 18** with TypeScript
- **React Router v6** — client-side routing
- **Tailwind CSS** — utility-first styling
- **Supabase** — auth, database, storage
- **Lucide React** — icons
- **Vite** — build tool

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.tsx
│   ├── Footer.tsx
│   └── StarsBackground.tsx
├── contexts/
│   └── AuthContext.tsx
├── lib/
│   └── supabase.ts
├── pages/
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── SignUpPage.tsx
│   ├── FeedPage.tsx
│   ├── CoursesPage.tsx
│   ├── PastQuestionsPage.tsx
│   ├── LectureNotesPage.tsx
│   ├── ReportPage.tsx
│   ├── AboutPage.tsx
│   └── AdminDashboard.tsx
├── App.tsx
├── main.tsx
└── index.css
```

---

## 🌐 Deployment

Deploy to **Vercel** (recommended):
1. Push to GitHub
2. Import repo in Vercel
3. Add environment variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Deploy

Or **Netlify**:
1. `npm run build` → output in `dist/`
2. Add `_redirects` file: `/* /index.html 200` (for SPA routing)

---

## ✅ Supabase Auth Redirect URL

Add your deployment URL to Supabase:
**Authentication → URL Configuration → Redirect URLs**

Example: `https://nacsfuto.online/*`

---

Built with ❤️ by the NACS FUTO ICT/Research Team
