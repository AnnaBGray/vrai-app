const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Import admin service routes
const adminServiceRoutes = require('./admin-service');

// Initialize Express app
const app = express();
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security middleware
if (process.env.HELMET_ENABLED === 'true') {
    app.use(helmet({
        contentSecurityPolicy: false,
        crossOriginEmbedderPolicy: false
    }));
}

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Use admin service routes
app.use('/api/admin', adminServiceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Serve static files
app.get('/*', (req, res) => {
    // For Vercel, we need to serve static files differently
    const filePath = path.join(__dirname, '..', req.path);
    
    // Handle HTML files
    if (req.path.endsWith('.html') || req.path === '/') {
        const htmlPath = req.path === '/' ? '/index.html' : req.path;
        res.sendFile(path.join(__dirname, '..', htmlPath));
    } else {
        // For other static files (CSS, JS, etc.)
        res.sendFile(filePath);
    }
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `API endpoint ${req.path} not found`,
        availableEndpoints: [
            'GET /api',
            'POST /register',
            'POST /login',
            'GET /user/stats',
            'GET /user/requests',
            'POST /api/requests/:id/upload',
            'POST /api/authentication-submission',
            'GET /api/submissions',
            'GET /health'
        ]
    });
});

// Global error handling middleware
app.use((error, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`\n💥 [${timestamp}] Unhandled Error:`, error.message);
    console.error('Error Stack:', error.stack);
    
    // Don't expose internal error details in production
    res.status(500).json({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

// Export for Vercel serverless function
module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Simple response for testing
  res.json({
    message: 'Vrai API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    environment: process.env.NODE_ENV || 'development'
  });
}; 