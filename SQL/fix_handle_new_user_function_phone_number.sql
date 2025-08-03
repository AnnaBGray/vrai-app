-- Fix handle_new_user function to use phone_number column
-- Run this in the Supabase SQL Editor

-- Update the function to use the correct column name (phone_number)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, display_name, email, phone_number)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'display_name',
        new.email,
        new.raw_user_meta_data->>'phone_number'  -- Fixed: now correctly reads 'phone_number' field
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the function was updated correctly
SELECT 
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user'; 