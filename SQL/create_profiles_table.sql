-- Create profiles table with proper RLS policies
-- Run this in the Supabase SQL Editor

-- Create the profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name TEXT,
    display_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Allow users to read their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read access" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.profiles;

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies without recursive checks
CREATE POLICY "Allow users to read their own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow admins to read all profiles"
    ON public.profiles
    FOR SELECT
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Allow admins to update all profiles"
    ON public.profiles
    FOR UPDATE
    USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

CREATE POLICY "Allow public read access"
    ON public.profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated insert access"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create a function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, display_name, email)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'display_name',
        new.email
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to automatically create a profile when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.profiles TO postgres;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role; 