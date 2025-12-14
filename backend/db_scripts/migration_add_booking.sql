-- Add booking fields to sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS booking_status text DEFAULT 'none';
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS booking_reference text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS booking_message text;
