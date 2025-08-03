/**
 * Example of how to create a user profile from the frontend
 * This should be called after successful user registration
 */
async function createUserProfile(supabase, userData) {
  try {
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found');
      return { error: 'No authenticated user found' };
    }
    
    // Create profile record
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id, // Must match auth.uid() for RLS policy
        full_name: userData.fullName,
        display_name: userData.displayName,
        email: userData.email,
        phone_number: userData.phoneNumber,
        avatar_url: userData.avatarUrl || null,
        // No need to specify created_at or updated_at - they have defaults
      })
      .select();
    
    if (error) {
      console.error('Error creating profile:', error);
      return { error };
    }
    
    console.log('Profile created successfully:', data);
    return { data };
  } catch (error) {
    console.error('Unexpected error creating profile:', error);
    return { error };
  }
}

/**
 * Example usage in signup flow
 */
async function handleSignup(supabase, formData) {
  // 1. Register the user with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
  });
  
  if (authError) {
    console.error('Auth error:', authError);
    return { error: authError };
  }
  
  // 2. Create the user profile
  const profileData = {
    fullName: formData.fullName,
    displayName: formData.displayName,
    email: formData.email,
    phoneNumber: formData.phoneNumber,
    avatarUrl: formData.avatarUrl,
  };
  
  const { data, error } = await createUserProfile(supabase, profileData);
  
  if (error) {
    console.error('Profile creation error:', error);
    return { error };
  }
  
  return { 
    user: authData.user,
    profile: data
  };
} 