const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  try {
    // Set headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    // Debug information
    const debugInfo = {
      __dirname: __dirname,
      process_cwd: process.cwd(),
      current_working_directory: process.cwd(),
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      request_url: req.url,
      request_pathname: req.url,
      files_in_current_dir: [],
      files_in_parent_dir: [],
      files_in_root: []
    };
    
    try {
      debugInfo.files_in_current_dir = fs.readdirSync(__dirname);
    } catch (e) {
      debugInfo.files_in_current_dir_error = e.message;
    }
    
    try {
      debugInfo.files_in_parent_dir = fs.readdirSync(path.join(__dirname, '..'));
    } catch (e) {
      debugInfo.files_in_parent_dir_error = e.message;
    }
    
    try {
      debugInfo.files_in_root = fs.readdirSync(process.cwd());
    } catch (e) {
      debugInfo.files_in_root_error = e.message;
    }
    
    // Check if signup.html exists in different locations
    const possiblePaths = [
      path.join(__dirname, '..', 'signup.html'),
      path.join(process.cwd(), 'signup.html'),
      path.join(__dirname, 'signup.html'),
      '/var/task/signup.html',
      '/tmp/signup.html'
    ];
    
    debugInfo.signup_html_checks = {};
    possiblePaths.forEach(p => {
      try {
        debugInfo.signup_html_checks[p] = fs.existsSync(p);
      } catch (e) {
        debugInfo.signup_html_checks[p] = `Error: ${e.message}`;
      }
    });
    
    return res.end(JSON.stringify(debugInfo, null, 2));
  } catch (error) {
    res.statusCode = 500;
    return res.end(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2));
  }
}; 