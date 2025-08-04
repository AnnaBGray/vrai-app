import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the current highest human_readable_id
    const { data: maxRequest, error: maxError } = await supabase
      .from('authentication_requests')
      .select('human_readable_id')
      .not('human_readable_id', 'is', null)
      .order('human_readable_id', { ascending: false })
      .limit(1)
      .single()

    if (maxError && maxError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching max human_readable_id:', maxError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate ID' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Generate the next ID
    let nextNumber = 1
    if (maxRequest && maxRequest.human_readable_id) {
      // Extract number from existing ID (e.g., "Vrai#000007" -> 7)
      const match = maxRequest.human_readable_id.match(/Vrai#(\d+)/)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
      }
    }

    // Format the new ID with leading zeros (e.g., "Vrai#000008")
    const humanReadableId = `Vrai#${nextNumber.toString().padStart(6, '0')}`

    console.log(`Generated human_readable_id: ${humanReadableId}`)

    return new Response(
      JSON.stringify({ 
        human_readable_id: humanReadableId,
        success: true 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in generate-human-readable-id function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 