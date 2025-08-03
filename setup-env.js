/**
 * Setup Environment Variables for Vrai Authentication System
 * Run this script to set up your .env file with Supabase credentials
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default values
const defaults = {
  SUPABASE_URL: 'https://gyxakkxotjkdsjvbufiv.supabase.co',
  PORT: 3000,
  NODE_ENV: 'development',
  HELMET_ENABLED: false,
  CORS_ORIGIN: '*',
  UPLOAD_DIR: 'uploads',
  MAX_FILE_SIZE: 10485760,
  MAX_FILES_PER_UPLOAD: 10
};

console.log('\n🔐 Vrai Authentication System - Environment Setup\n');
console.log('This script will help you set up your .env file with the necessary Supabase credentials.\n');
console.log('You will need your Supabase service role key to proceed.\n');

rl.question('Enter your Supabase service role key: ', (serviceRoleKey) => {
  if (!serviceRoleKey) {
    console.error('\n❌ Error: Service role key is required. Please run the script again with a valid key.\n');
    rl.close();
    return;
  }

  // Create .env file content
  const envContent = `# Supabase Configuration
SUPABASE_URL=${defaults.SUPABASE_URL}
SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}

# Server Configuration
PORT=${defaults.PORT}
NODE_ENV=${defaults.NODE_ENV}
HELMET_ENABLED=${defaults.HELMET_ENABLED}
CORS_ORIGIN=${defaults.CORS_ORIGIN}
UPLOAD_DIR=${defaults.UPLOAD_DIR}
MAX_FILE_SIZE=${defaults.MAX_FILE_SIZE}
MAX_FILES_PER_UPLOAD=${defaults.MAX_FILES_PER_UPLOAD}
`;

  // Write .env file
  fs.writeFile(path.join(__dirname, '.env'), envContent, (err) => {
    if (err) {
      console.error('\n❌ Error creating .env file:', err);
      rl.close();
      return;
    }

    console.log('\n✅ .env file created successfully!');
    console.log('\n📋 Environment variables set:');
    console.log(`- SUPABASE_URL: ${defaults.SUPABASE_URL}`);
    console.log(`- SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey.substring(0, 5)}...${serviceRoleKey.substring(serviceRoleKey.length - 5)}`);
    console.log(`- PORT: ${defaults.PORT}`);
    console.log(`- NODE_ENV: ${defaults.NODE_ENV}`);
    
    console.log('\n🚀 You can now run the server with:');
    console.log('node server.js');
    
    rl.close();
  });
}); 
 
 
 
 
 
 
 
 
 
 
 