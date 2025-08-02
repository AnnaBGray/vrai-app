# Vercel Deployment Configuration

## Changes Made for Vercel Deployment

### 1. **New API Structure**
- Created `api/index.js` - Main serverless function for Vercel
- Created `api/admin-service.js` - Admin routes for Vercel
- Updated `vercel.json` to use the new API structure

### 2. **Updated Configuration Files**

#### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    { "src": "api/**/*.js", "use": "@vercel/node" },
    { "src": "*.html", "use": "@vercel/static" },
    { "src": "*.css", "use": "@vercel/static" },
    { "src": "*.js", "use": "@vercel/static" },
    { "src": "assets/**/*", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/api/index.js" }
  ]
}
```

#### `package.json`
- Updated main entry point to `api/index.js`
- Updated scripts to use the new API structure
- Added proper build scripts for Vercel

### 3. **Environment Variables Required**
Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGIN`
- `NODE_ENV`
- `PORT`
- `HELMET_ENABLED`

### 4. **Build Settings in Vercel**
- **Framework Preset:** Other
- **Build Command:** `npm run vercel-build` (enabled)
- **Output Directory:** Default (disabled)
- **Install Command:** Default (disabled)

### 5. **How It Works**
- All requests are routed through `api/index.js`
- Static files (HTML, CSS, JS) are served directly
- API routes are handled by the Express.js server
- Admin functionality uses service role key for secure operations

## Deployment Steps
1. Push changes to GitHub
2. Vercel will automatically detect the new configuration
3. Build should complete successfully
4. Your app will be available at your Vercel domain

## Troubleshooting
- If deployment fails, check the build logs in Vercel
- Ensure all environment variables are set correctly
- Verify that the API routes are working by testing `/health` endpoint 