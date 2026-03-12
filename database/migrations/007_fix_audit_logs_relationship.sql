-- Add foreign key relationship between audit_logs and public.users
-- This allows Supabase PostgREST to perform joins between these tables
-- Version: 1.0
-- Date: 2026-03-10

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_public_users_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.users(id)
ON DELETE SET NULL;
