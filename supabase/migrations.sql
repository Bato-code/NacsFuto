-- ============================================================
-- NACS FUTO - Database Migrations
-- Run these in your Supabase SQL Editor
-- ============================================================

-- ─── 1. Leadership Table (NEW - for dynamic home page) ────────────────────────
CREATE TABLE IF NOT EXISTS public.leadership (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  role        text NOT NULL,
  image_url   text,
  type        text NOT NULL DEFAULT 'executive', -- 'dept' | 'executive'
  sort_order  int  NOT NULL DEFAULT 99,
  highlight   bool DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.leadership ENABLE ROW LEVEL SECURITY;

-- Anyone can read leadership
CREATE POLICY "Anyone can read leadership"
  ON public.leadership FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can manage leadership"
  ON public.leadership FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ─── 2. Seed Default Leadership Data ──────────────────────────────────────────
-- Run this after creating the table to pre-populate leadership
-- (replace image_url with actual URLs when available)

INSERT INTO public.leadership (name, role, type, sort_order, highlight) VALUES
  ('Prof. Engr. O. J Onojo',              'Head of Department',          'dept',      1,  false),
  ('Mr. Emeto Ifeanyi',                    'Staff Adviser',               'dept',      2,  false),
  ('Rtr. Comr. Onyegbule Sogineke Sameony','President',                   'executive', 3,  false),
  ('Amb. Comr. Ezeihekaibee Chiemerie Udochi','Vice President',           'executive', 4,  false),
  ('Comr. Izu-Chiedo Samuel',             'Secretary General',            'executive', 5,  true),
  ('Comr. Gervase Chelsea',               'Financial Secretary',          'executive', 6,  false),
  ('Amb. Comr. Okereke Jane Kalu',        'Assistant Secretary General',  'executive', 7,  false),
  ('Comr. Iwueze Annalisa',               'Treasurer',                    'executive', 8,  false),
  ('Comr. Nwokedi Chinedu',               'Director of Welfare',          'executive', 9,  false),
  ('Comr. Chinedu Bartholomew',           'Director of ICT/Research',     'executive', 10, false),
  ('Comr. Nkauru-Nwaokoro Munachi',       'Director of Socials',          'executive', 11, false),
  ('Comr. Ibe Obioma Lucky',              'Director of Protocol (PRO)',   'executive', 12, false),
  ('Comr. Kalu Victor',                   'Director of Sports',           'executive', 13, false),
  ('Hon. Samuel Success Akachukwu',       'MSRC',                         'executive', 14, false)
ON CONFLICT DO NOTHING;


-- ─── 3. Election Tables (already in schema, verify they exist) ────────────────

CREATE TABLE IF NOT EXISTS public.election_candidates (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  position   text NOT NULL,
  image_url  text,
  status     text NOT NULL DEFAULT 'active', -- 'active' | 'inactive'
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.election_settings (
  id               int  PRIMARY KEY DEFAULT 1,
  election_open    bool NOT NULL DEFAULT false,
  results_visible  bool NOT NULL DEFAULT false,
  allow_changes    bool NOT NULL DEFAULT true,
  updated_at       timestamptz DEFAULT now()
);

-- Insert default settings row (only one row needed)
INSERT INTO public.election_settings (id, election_open, results_visible, allow_changes)
VALUES (1, false, false, true)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.election_submissions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id     uuid UNIQUE NOT NULL REFERENCES auth.users(id),
  submitted_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.election_votes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id     uuid NOT NULL REFERENCES auth.users(id),
  position     text NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.election_candidates(id),
  voted_at     timestamptz DEFAULT now(),
  UNIQUE (voter_id, position)  -- one vote per position per voter
);

-- RLS for election tables
ALTER TABLE public.election_candidates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_votes       ENABLE ROW LEVEL SECURITY;

-- Candidates: anyone can read
CREATE POLICY "Anyone can read candidates"
  ON public.election_candidates FOR SELECT USING (true);

-- Settings: anyone can read
CREATE POLICY "Anyone can read election settings"
  ON public.election_settings FOR SELECT USING (true);

-- Submissions: voter can read own, admin can read all
CREATE POLICY "Voter can read own submission"
  ON public.election_submissions FOR SELECT
  USING (voter_id = auth.uid());

CREATE POLICY "Voter can insert own submission"
  ON public.election_submissions FOR INSERT
  WITH CHECK (voter_id = auth.uid());

-- Votes: voter can manage own votes
CREATE POLICY "Voter can read own votes"
  ON public.election_votes FOR SELECT
  USING (voter_id = auth.uid());

CREATE POLICY "Voter can insert own votes"
  ON public.election_votes FOR INSERT
  WITH CHECK (voter_id = auth.uid());

CREATE POLICY "Voter can update own votes"
  ON public.election_votes FOR UPDATE
  USING (voter_id = auth.uid());

-- Admin policies for election management
CREATE POLICY "Admins can manage candidates"
  ON public.election_candidates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can manage settings"
  ON public.election_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can read all submissions"
  ON public.election_submissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can read all votes"
  ON public.election_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));


-- ─── 4. RLS for existing tables (if not already set) ─────────────────────────

-- profiles: users read/update own, admins read all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- posts: anyone reads approved, admins manage all
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved posts" ON public.posts FOR SELECT USING (approved = true);
CREATE POLICY "Admins manage all posts" ON public.posts FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- comments: anyone reads, authenticated can insert/update/delete own
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users manage own comments" ON public.comments FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "Admins manage all comments" ON public.comments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- materials / lecture_notes: anyone reads, only admins write
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Admins manage materials" ON public.materials FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

ALTER TABLE public.lecture_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read lecture_notes" ON public.lecture_notes FOR SELECT USING (true);
CREATE POLICY "Admins manage lecture_notes" ON public.lecture_notes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- courses: anyone reads approved, authenticated submit, admins manage
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved courses" ON public.courses FOR SELECT USING (approved = true);
CREATE POLICY "Authenticated can submit courses" ON public.courses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage all courses" ON public.courses FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- anonymous_reports: authenticated insert, admins read
ALTER TABLE public.anonymous_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can submit reports" ON public.anonymous_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage reports" ON public.anonymous_reports FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- contact_messages: anyone insert, admins read
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can send message" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage messages" ON public.contact_messages FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- whitelisted_matric_numbers: anyone reads active, admins manage
ALTER TABLE public.whitelisted_matric_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can check whitelist" ON public.whitelisted_matric_numbers FOR SELECT USING (true);
CREATE POLICY "Admins manage whitelist" ON public.whitelisted_matric_numbers FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
