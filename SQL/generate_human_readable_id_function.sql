-- Function to generate unique human_readable_id values
-- This function ensures thread-safe generation of sequential IDs

CREATE OR REPLACE FUNCTION generate_human_readable_id()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    result_id TEXT;
BEGIN
    -- Get the current highest number from existing human_readable_id values
    -- Use table alias to avoid column name conflicts
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN ar.human_readable_id ~ '^Vrai#[0-9]+$' 
                THEN CAST(SUBSTRING(ar.human_readable_id FROM 6) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1
    INTO next_number
    FROM authentication_requests ar
    WHERE ar.human_readable_id IS NOT NULL;
    
    -- Format the ID with leading zeros (e.g., "Vrai#000008")
    result_id := 'Vrai#' || LPAD(next_number::TEXT, 6, '0');
    
    RETURN result_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_human_readable_id() TO authenticated;

-- Test the function (optional - remove this in production)
-- SELECT generate_human_readable_id(); 