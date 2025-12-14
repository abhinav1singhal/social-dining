-- Add conflict_analysis to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS conflict_analysis jsonb;

-- Add AI reasoning fields to recommendations table
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS why_picked text;
ALTER TABLE public.recommendations ADD COLUMN IF NOT EXISTS trade_offs text[];
