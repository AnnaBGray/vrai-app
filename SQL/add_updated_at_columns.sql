-- Add updated_at columns to both tables for better audit trails

-- Add updated_at to auth_submissions table
ALTER TABLE public.auth_submissions 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_auth_submissions_updated_at 
    BEFORE UPDATE ON public.auth_submissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at to authentication_requests table
ALTER TABLE public.authentication_requests 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

CREATE TRIGGER update_authentication_requests_updated_at 
    BEFORE UPDATE ON public.authentication_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 