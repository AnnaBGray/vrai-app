# Deploying to Vercel

This guide explains how to deploy the Vrai Authentication System to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup)
2. A [Supabase account](https://supabase.com/) with your project set up
3. Your Supabase URL and API keys

## Setup

### 1. Environment Variables

Set up the following environment variables in your Vercel project:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep this secret!)

### 2. Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure the build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `.`
   - Install Command: `npm install`

3. Deploy!

## API Routes

The application uses Vercel's serverless functions for API routes:

- `/api/upload-pdf` - Handles PDF generation and uploading to Supabase Storage

## Important Notes

1. **File Storage**: Vercel doesn't support persistent file storage. All file operations are temporary and will be cleaned up after the function execution.

2. **PDF Generation**: The PDF generation happens in the `/api/upload-pdf.js` serverless function, which:
   - Accepts a POST request with the PDF file
   - Uploads it to Supabase Storage
   - Updates the database with the URL
   - Returns the public URL

3. **Environment Variables**: Make sure to set up all required environment variables in the Vercel dashboard.

## Troubleshooting

If you encounter issues with the PDF upload:

1. Check the Vercel function logs for errors
2. Verify that your Supabase service role key has the necessary permissions
3. Ensure your Supabase storage bucket is properly configured with public access

## Local Development

To test the API routes locally:

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel dev` to start the development server

This will simulate the Vercel environment locally, including the API routes. 