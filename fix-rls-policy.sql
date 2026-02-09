-- Fix RLS Policy for Users Table
-- Run this in Supabase SQL Editor

-- Drop existing policies first (in case they're malformed)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;

-- Recreate policies with correct syntax
CREATE POLICY "Users can view their own profile" ON public.users FOR
SELECT USING (auth.uid () = id);

CREATE POLICY "Users can insert their own profile" ON public.users FOR
INSERT
WITH
    CHECK (auth.uid () = id);

CREATE POLICY "Users can update their own profile" ON public.users FOR
UPDATE USING (auth.uid () = id);

-- Verify RLS is enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Check if policies are created (should return 3 rows)
SELECT
    schemaname,
    tablename,
    policyname
FROM pg_policies
WHERE
    tablename = 'users';