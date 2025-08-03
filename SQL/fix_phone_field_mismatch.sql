-- Fix phone field mismatch in profiles table and trigger function
-- Run this in the Supabase SQL Editor

-- First, check if the phone_number column exists
DO $$
BEGIN
    -- If phone_number column doesn't exist but phone does, we're good
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'phone_number') 
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'profiles' 
                  AND column_name = 'phone') THEN
        
        -- Update the handle_new_user function to use the correct column name (phone)
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.profiles (id, full_name, display_name, email, phone)
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
        
        RAISE NOTICE 'Updated handle_new_user function to use phone column';
        
    -- If phone column doesn't exist but phone_number does, add phone column
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'profiles' 
                    AND column_name = 'phone')
         AND EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'profiles' 
                    AND column_name = 'phone_number') THEN
        
        -- Rename phone_number to phone to match the rest of the code
        ALTER TABLE public.profiles RENAME COLUMN phone_number TO phone;
        
        RAISE NOTICE 'Renamed phone_number column to phone';
        
    -- If neither column exists, add the phone column
    ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'profiles' 
                    AND column_name = 'phone')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_schema = 'public' 
                    AND table_name = 'profiles' 
                    AND column_name = 'phone_number') THEN
        
        -- Add phone column
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        
        RAISE NOTICE 'Added phone column to profiles table';
        
    -- If both columns exist, migrate data and drop phone_number
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'phone')
         AND EXISTS (SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'profiles' 
                AND column_name = 'phone_number') THEN
        
        -- Update phone column with phone_number values where phone is null
        UPDATE public.profiles 
        SET phone = phone_number 
        WHERE phone IS NULL AND phone_number IS NOT NULL;
        
        -- Drop phone_number column
        ALTER TABLE public.profiles DROP COLUMN phone_number;
        
        RAISE NOTICE 'Migrated data from phone_number to phone and dropped phone_number column';
    END IF;
    
    -- Always update the function to use the correct field
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER AS $$
    BEGIN
        INSERT INTO public.profiles (id, full_name, display_name, email, phone)
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
    
    RAISE NOTICE 'Updated handle_new_user function and recreated trigger';
END$$; 