-- Fix profiles table schema and trigger function
-- Run this in the Supabase SQL Editor

-- First, check if the phone column exists in the profiles table
DO $$
BEGIN
    -- Check if phone column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone'
    ) THEN
        -- Add the phone column if it doesn't exist
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles table';
    ELSE
        RAISE NOTICE 'Phone column already exists in profiles table';
    END IF;
    
    -- Check if phone_number column exists and migrate data if needed
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'phone_number'
    ) THEN
        -- Migrate data from phone_number to phone
        UPDATE public.profiles 
        SET phone = phone_number 
        WHERE phone IS NULL AND phone_number IS NOT NULL;
        
        -- Drop the phone_number column
        ALTER TABLE public.profiles DROP COLUMN phone_number;
        RAISE NOTICE 'Migrated data from phone_number to phone and dropped phone_number column';
    END IF;
END$$;

-- Update the handle_new_user function to use the correct field mapping
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, display_name, email, phone)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'display_name',
        new.email,
        new.raw_user_meta_data->>'phone'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verify the trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created'; 