-- Fix handle_new_user function to correctly read phone field from raw_user_meta_data
-- Run this in the Supabase SQL Editor

-- Update the function to use the correct field mapping
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, display_name, email, phone)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'display_name',
        new.email,
        new.raw_user_meta_data->>'phone'  -- Fixed: now correctly reads 'phone' field
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the function was updated correctly
SELECT 
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'handle_new_user'; 