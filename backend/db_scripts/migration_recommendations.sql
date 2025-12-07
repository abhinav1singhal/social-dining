-- Migration script to update recommendations table
-- Run this in Supabase SQL Editor if the table already exists

-- Drop the existing recommendations table (WARNING: This will delete all data)
DROP TABLE IF EXISTS public.recommendations CASCADE;

-- Recreate with correct schema
CREATE TABLE public.recommendations (
  id text primary key,  -- Yelp business ID (not a UUID)
  session_id uuid references public.sessions(id) on delete cascade,
  name text not null,
  rating float,
  price text,
  image_url text,
  ai_reasoning text,
  categories text[]
);

-- Re-enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Recreate policy
CREATE POLICY "Public recommendations access" ON public.recommendations FOR ALL USING (true);
