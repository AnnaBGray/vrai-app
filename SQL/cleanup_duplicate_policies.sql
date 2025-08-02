-- Clean up duplicate RLS policies for authentication_requests table
-- Run this in the Supabase SQL Editor

-- First, let's see what policies currently exist
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'authentication_requests';

-- Drop all existing policies for authentication_requests to start fresh
DROP POLICY IF EXISTS "User can read own request" ON public.authentication_requests;
DROP POLICY IF EXISTS "User can update own request" ON public.authentication_requests;
DROP POLICY IF EXISTS "User can insert own request" ON public.authentication_requests;
DROP POLICY IF EXISTS "Users can read own authentication requests" ON public.authentication_requests;
DROP POLICY IF EXISTS "Users can update own authentication requests" ON public.authentication_requests;
DROP POLICY IF EXISTS "Users can insert own authentication requests" ON public.authentication_requests;

-- Create clean, non-duplicate policies
-- Policy 1: Users can read their own authentication requests
CREATE POLICY "Users can read own authentication requests"
ON public.authentication_requests
FOR SELECT
TO authenticated
USING (
  auth.uid() = (
    SELECT auth_submissions.user_id
    FROM auth_submissions
    WHERE auth_submissions.id = authentication_requests.submission_id
  )
);

-- Policy 2: Users can update their own authentication requests
CREATE POLICY "Users can update own authentication requests"
ON public.authentication_requests
FOR UPDATE
TO authenticated
USING (
  auth.uid() = (
    SELECT auth_submissions.user_id
    FROM auth_submissions
    WHERE auth_submissions.id = authentication_requests.submission_id
  )
);

-- Policy 3: Users can insert their own authentication requests
CREATE POLICY "Users can insert own authentication requests"
ON public.authentication_requests
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = (
    SELECT auth_submissions.user_id
    FROM auth_submissions
    WHERE auth_submissions.id = authentication_requests.submission_id
  )
);

-- Policy 4: Admins can read all authentication requests
CREATE POLICY "Admins can read all authentication requests"
ON public.authentication_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Policy 5: Admins can update all authentication requests
CREATE POLICY "Admins can update all authentication requests"
ON public.authentication_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = TRUE
  )
);

-- Verify the policies were created correctly
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'authentication_requests'
-- ORDER BY policyname; 