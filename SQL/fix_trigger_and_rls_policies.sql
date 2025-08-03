-- Fix trigger and RLS policies for profiles table
-- Run this in the Supabase SQL Editor

-- 1. Enable the trigger (this is the main issue!)
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- 2. Verify trigger is now enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE 
        WHEN tgenabled = 't' THEN 'ENABLED'
        WHEN tgenabled = 'f' THEN 'DISABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED (REPLICA)'
        WHEN tgenabled = 'O' THEN 'ORIGINAL'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 3. Check current RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Drop and recreate RLS policies to ensure they're correct
-- First, drop existing policies
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.profiles;

-- 5. Create correct RLS policies
-- INSERT policy - allow authenticated users to insert their own profile
CREATE POLICY "profiles_insert_policy"
ON public.profiles
FOR INSERT
TO authenticated, supabase_auth_admin
WITH CHECK (auth.uid() = id);

-- SELECT policy - allow users to read their own profile or if they're admin
CREATE POLICY "profiles_select_policy"
ON public.profiles
FOR SELECT
TO authenticated, authenticator
USING ((auth.uid() = id) OR (is_admin = true));

-- UPDATE policy - allow users to update their own profile or if they're admin
CREATE POLICY "profiles_update_policy"
ON public.profiles
FOR UPDATE
TO authenticated
USING ((auth.uid() = id) OR (is_admin = true));

-- 6. Verify the trigger function is correct
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, display_name, email, phone_number)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'display_name',
        new.email,
        new.raw_user_meta_data->>'phone_number'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Final verification
SELECT 
    'Trigger Status' as check_type,
    tgname as trigger_name,
    CASE 
        WHEN tgenabled = 't' THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'

UNION ALL

SELECT 
    'RLS Policies' as check_type,
    policyname as policy_name,
    cmd as command
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY check_type, trigger_name, policy_name; 