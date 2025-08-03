-- Diagnose trigger issues and ensure phone_number is working
-- Run this in the Supabase SQL Editor

-- 1. Check if the trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name,
    CASE 
        WHEN tgenabled = 't' THEN 'ENABLED'
        WHEN tgenabled = 'f' THEN 'DISABLED'
        WHEN tgenabled = 'D' THEN 'DISABLED (REPLICA)'
        WHEN tgenabled = 'O' THEN 'ORIGINAL'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 2. Check the current function definition
SELECT 
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Check if phone_number column exists in profiles table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles' 
AND column_name = 'phone_number';

-- 4. Check recent profiles to see if phone_number is being populated
SELECT 
    id,
    full_name,
    display_name,
    email,
    phone_number,
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Enable the trigger if it's disabled
DO $$
BEGIN
    -- Check if trigger is disabled and enable it
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created' 
        AND tgenabled = 'f'
    ) THEN
        ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;
        RAISE NOTICE 'Trigger on_auth_user_created has been ENABLED';
    ELSE
        RAISE NOTICE 'Trigger on_auth_user_created is already ENABLED or does not exist';
    END IF;
END$$;

-- 6. Verify trigger is now enabled
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