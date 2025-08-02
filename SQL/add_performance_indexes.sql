-- Add performance indexes for better query performance

-- Indexes for auth_submissions table
CREATE INDEX IF NOT EXISTS idx_auth_submissions_user_id ON public.auth_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_submissions_status ON public.auth_submissions(status);
CREATE INDEX IF NOT EXISTS idx_auth_submissions_created_at ON public.auth_submissions(created_at);

-- Indexes for authentication_requests table
CREATE INDEX IF NOT EXISTS idx_authentication_requests_user_id ON public.authentication_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_authentication_requests_submission_id ON public.authentication_requests(submission_id);
CREATE INDEX IF NOT EXISTS idx_authentication_requests_status ON public.authentication_requests(status);
CREATE INDEX IF NOT EXISTS idx_authentication_requests_created_at ON public.authentication_requests(created_at); 