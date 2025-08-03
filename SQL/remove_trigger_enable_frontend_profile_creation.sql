-- Remove trigger and enable frontend profile creation
-- Run this in the Supabase SQL Editor

-- 1. Remove the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Verify the trigger has been removed
SELECT tgname 
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass 
  AND tgname = 'on_auth_user_created';

-- 3. Ensure the RLS policy for inserting profiles exists and is correct
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.profiles;
CREATE POLICY "Allow authenticated insert access"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 4. Add a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Verify the profiles table structure
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'profiles'
ORDER BY 
    ordinal_position;

-- 6. Verify all RLS policies on the profiles table
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename = 'profiles'
ORDER BY
    policyname;

-- 7. Verify avatar_url column exists, add if it doesn't
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END
$$; 