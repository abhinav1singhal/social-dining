-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create Sessions Table
create table public.sessions (
  id uuid primary key default uuid_generate_v4(),
  host_name text not null,
  location text not null,
  scheduled_time timestamp with time zone,
  status text default 'created',
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone,
  invite_link text
);

-- Create Participants Table
create table public.participants (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade,
  name text not null,
  dietary_restrictions text,
  cuisine_preferences text,
  budget_tier text,
  vibe text,
  is_host boolean default false
);

-- Create Recommendations Table
-- Create Recommendations Table
create table public.recommendations (
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

-- Create Votes Table
create table public.votes (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references public.sessions(id) on delete cascade,
  participant_id uuid references public.participants(id) on delete cascade,
  venue_id text not null,
  score int not null, -- 1, 0, -1
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.recommendations enable row level security;
alter table public.votes enable row level security;

-- Create policies
create policy "Public sessions access" on public.sessions for all using (true);
create policy "Public participants access" on public.participants for all using (true);
create policy "Public recommendations access" on public.recommendations for all using (true);
create policy "Public votes access" on public.votes for all using (true);
