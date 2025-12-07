-- Migration script to fix duplicate key error
-- This separates the internal ID (UUID) from the Yelp Business ID

-- 1. Drop the table again
DROP TABLE IF EXISTS public.recommendations CASCADE;

-- 2. Recreate with correct schema (Surrogate Key)
CREATE TABLE public.recommendations (
  id uuid primary key default uuid_generate_v4(),
  business_id text not null, -- Yelp business ID
  session_id uuid references public.sessions(id) on delete cascade,
  name text not null,
  rating float,
  price text,
  image_url text,
  ai_reasoning text,
  categories text[]
);

-- 3. Re-enable RLS
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- 4. Recreate policy
CREATE POLICY "Public recommendations access" ON public.recommendations FOR ALL USING (true);
