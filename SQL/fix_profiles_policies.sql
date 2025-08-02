-- Fix for infinite recursion in profiles policies
-- Run this in the Supabase SQL Editor

-- First, drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON public.profiles;

-- Create a function to safely check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    -- Direct query without using RLS
    EXECUTE 'SELECT is_admin FROM public.profiles WHERE id = $1' 
    INTO admin_status
    USING user_id;
    
    RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a temporary admin flag in the users table to break the recursion
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create new policies that don't cause recursion
CREATE POLICY "Allow admins to read all profiles"
    ON public.profiles
    FOR SELECT
    USING (is_admin(auth.uid()));

CREATE POLICY "Allow admins to update all profiles"
    ON public.profiles
    FOR UPDATE
    USING (is_admin(auth.uid()));

-- Update the function that handles new user creation to use phone_number field
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

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 