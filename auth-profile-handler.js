/**
 * Profile creation handler for Vrai authentication
 * This script handles creating user profiles after successful authentication
 */

// Function to create a user profile if it doesn't exist
async function createProfileIfNeeded(supabase, user) {
  if (!supabase || !user) {
    console.error('❌ Missing required parameters for profile creation');
    return { error: 'Missing required parameters' };
  }

  try {
    console.log('🔍 Checking if profile exists for user:', user.id);
    
    // First check if the profile already exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
      
    if (fetchError) {
      console.error('❌ Error checking for existing profile:', fetchError);
      return { error: fetchError };
    }
    
    // If profile already exists, no need to create a new one
    if (existingProfile) {
      console.log('✅ Profile already exists for user:', user.id);
      return { data: existingProfile, created: false };
    }
    
    console.log('🆕 No profile found, creating new profile for user:', user.id);
    
    // Extract user metadata from the user object
    const metadata = user.user_metadata || {};
    
    // Create profile data object
    const profileData = {
      id: user.id,
      full_name: metadata.full_name || '',
      display_name: metadata.display_name || '',
      email: user.email,
      phone_number: metadata.phone_number || ''
    };
    
    console.log('📦 Profile data to insert:', profileData);
    
    // Insert the new profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select();
      
    if (insertError) {
      console.error('❌ Error creating profile:', insertError);
      return { error: insertError };
    }
    
    console.log('✅ Profile created successfully:', newProfile);
    return { data: newProfile, created: true };
    
  } catch (error) {
    console.error('❌ Unexpected error in profile creation:', error);
    return { error };
  }
}

// Initialize auth state change listener
function initAuthListener() {
  const supabase = window.supabaseClient;
  
  if (!supabase) {
    console.error('❌ Supabase client not available');
    return;
  }
  
  console.log('🔐 Setting up auth state change listener');
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔔 Auth state changed:', event);
    
    // Only proceed on SIGNED_IN event
    if (event === 'SIGNED_IN' && session?.user) {
      console.log('👤 User signed in:', session.user.id);
      
      // Create profile if needed
      createProfileIfNeeded(supabase, session.user)
        .then(({ data, error, created }) => {
          if (error) {
            console.error('❌ Profile creation failed:', error);
          } else if (created) {
            console.log('🎉 New profile created during login');
          } else {
            console.log('ℹ️ Using existing profile');
          }
        });
    }
  });
}

// Initialize when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Initializing auth profile handler');
  initAuthListener();
}); 