# Vrai Authentication System with Supabase

This document provides instructions on how to set up and use the authentication system for Vrai using Supabase.

## Setup Instructions

### 1. Supabase Configuration

1. **Create a Supabase Project**:
   - Go to [Supabase](https://supabase.com) and sign in or create an account
   - Create a new project with the following details:
     - Project ID: gyxakkxotjkdsjvbufiv
     - API Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eGFra3hvdGprZHNqdmJ1Zml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxMjc1MTMsImV4cCI6MjA2NzcwMzUxM30.RT0VJKgdYSUJXzA34diTOpCvenMT6qjMfHaLmCAvEpk

2. **Set Up Database Schema**:
   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL commands in the `supabase-schema.sql` file to create the necessary tables and functions

3. **Configure Authentication**:
   - In the Supabase dashboard, go to Authentication > Settings
   - Enable Email/Password sign-in method
   - Configure email templates for verification and password reset
   - Set up redirect URLs for your application

4. **Set Up Social Providers (Optional)**:
   - If you want to enable Google and Apple sign-in:
     - Go to Authentication > Providers
     - Configure Google OAuth credentials
     - Configure Apple Sign-in credentials

### 2. Application Setup

1. **Install Dependencies**:
   ```bash
   npm install @supabase/supabase-js
   ```

2. **Files Structure**:
   - `supabase.js`: Contains the Supabase client configuration
   - `script.js`: Handles login functionality
   - `signup.js`: Handles registration functionality
   - `index.html`: Login page with Supabase integration
   - `signup.html`: Registration page with Supabase integration

## How It Works

### Authentication Flow

1. **Sign Up**:
   - User fills out the registration form
   - Form data is validated client-side
   - User is registered using Supabase Auth
   - A profile record is created in the profiles table
   - User receives a confirmation email (if configured)
   - User is redirected to the login page

2. **Login**:
   - User enters email and password
   - Credentials are verified with Supabase Auth
   - User profile is retrieved from the profiles table
   - User is redirected to the appropriate dashboard based on admin status

3. **Social Login**:
   - User clicks on Google or Apple sign-in button
   - User is redirected to the provider's authentication page
   - After successful authentication, user is redirected back to the application
   - User profile is created or updated in the profiles table
   - User is redirected to the appropriate dashboard

### User Profiles

The application uses a `profiles` table to store additional user information:

- `id`: User ID (from Supabase Auth)
- `full_name`: User's full name
- `display_name`: User's display name
- `email`: User's email address
- `phone`: User's phone number
- `avatar_url`: URL to user's profile picture
- `is_admin`: Boolean indicating if user is an admin
- `created_at`: Timestamp of profile creation
- `updated_at`: Timestamp of last profile update

## Security Features

1. **Row Level Security (RLS)**:
   - Users can only access their own profile data
   - Admins can access all profile data

2. **Password Security**:
   - Passwords are hashed and stored securely by Supabase Auth
   - Password complexity requirements are enforced

3. **Email Verification**:
   - Users can be required to verify their email address (configurable)

4. **Session Management**:
   - Secure session tokens are used for authentication
   - Sessions can be revoked from the Supabase dashboard

## Troubleshooting

1. **Registration Issues**:
   - Check browser console for error messages
   - Verify that the Supabase API key is correct
   - Ensure the database schema is properly set up

2. **Login Issues**:
   - Verify user credentials in the Supabase dashboard
   - Check if email verification is required but not completed
   - Ensure the profiles table has a record for the user

3. **Social Login Issues**:
   - Verify OAuth configuration in the Supabase dashboard
   - Check redirect URLs are properly configured
   - Ensure the provider's API keys are valid

## Additional Resources

- [Supabase Documentation](https://supabase.io/docs)
- [Supabase Auth Documentation](https://supabase.io/docs/guides/auth)
- [Supabase JavaScript Client](https://supabase.io/docs/reference/javascript/installing) 