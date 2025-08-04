-- Check if the generate_human_readable_id function exists
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'generate_human_readable_id';

-- Test the function
SELECT generate_human_readable_id() as test_id; 