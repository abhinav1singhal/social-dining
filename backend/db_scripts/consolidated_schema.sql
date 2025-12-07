-- ============================================================
-- YelpTogether Database Schema
-- Consolidated schema for Supabase PostgreSQL database
-- ============================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SESSIONS TABLE
-- Stores dining session information created by hosts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_name text NOT NULL,
  location text NOT NULL,
  scheduled_time timestamp with time zone,
  status text DEFAULT 'created',
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  invite_link text
);

-- ============================================================
-- PARTICIPANTS TABLE
-- Stores users who join a dining session with their preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.participants (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  dietary_restrictions text,
  cuisine_preferences text,
  budget_tier text,
  vibe text,
  is_host boolean DEFAULT false
);

-- ============================================================
-- RECOMMENDATIONS TABLE
-- Stores AI-generated restaurant recommendations from Yelp
-- ============================================================
CREATE TABLE IF NOT EXISTS public.recommendations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id text NOT NULL,  -- Yelp business ID
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  name text NOT NULL,
  rating float,
  price text,
  image_url text,
  ai_reasoning text,
  categories text[]
);

-- ============================================================
-- VOTES TABLE
-- Stores user votes on restaurant recommendations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.participants(id) ON DELETE CASCADE,
  venue_id text NOT NULL,
  score int NOT NULL,  -- 1 = Like, 0 = Neutral, -1 = Dislike
  created_at timestamp with time zone DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS on all tables for Supabase security
-- ============================================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- POLICIES
-- Public access policies (adjust for production as needed)
-- ============================================================
CREATE POLICY "Public sessions access" ON public.sessions FOR ALL USING (true);
CREATE POLICY "Public participants access" ON public.participants FOR ALL USING (true);
CREATE POLICY "Public recommendations access" ON public.recommendations FOR ALL USING (true);
CREATE POLICY "Public votes access" ON public.votes FOR ALL USING (true);

-- ============================================================
-- INDEXES (Optional - for performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON public.participants(session_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_session_id ON public.recommendations(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_session_id ON public.votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_participant_id ON public.votes(participant_id);
