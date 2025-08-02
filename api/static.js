const path = require('path');
const fs = require('fs');
const { URL } = require('url');

module.exports = (req, res) => {
  try {
    // Safely parse the URL
    const url = new URL(req.url, 'http://localhost');
    const pathname = url.pathname;
    
    // Handle root path
    if (pathname === '/' || pathname === '') {
      try {
        const indexPath = path.join(__dirname, '..', 'index.html');
        if (fs.existsSync(indexPath)) {
          const content = fs.readFileSync(indexPath, 'utf8');
          res.setHeader('Content-Type', 'text/html');
          return res.end(content);
        } else {
          return res.end(`
            <html>
              <head><title>Vrai App</title></head>
              <body>
                <h1>Vrai App</h1>
                <p>Welcome to Vrai App. The index.html file was not found.</p>
                <p>Available HTML files:</p>
                <ul>
                  ${fs.readdirSync(path.join(__dirname, '..'))
                    .filter(f => f.endsWith('.html'))
                    .map(f => `<li>${f}</li>`)
                    .join('')}
                </ul>
              </body>
            </html>
          `);
        }
      } catch (err) {
        console.error('Error serving index:', err);
        return res.end(`
          <html>
            <head><title>Error</title></head>
            <body>
              <h1>Error serving index page</h1>
              <p>${err.message}</p>
            </body>
          </html>
        `);
      }
    }
    
    // Safety check - prevent path traversal
    const normalizedPath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, '..', normalizedPath);
    
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'application/javascript',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml'
        }[ext] || 'text/plain';
        
        const content = fs.readFileSync(filePath);
        res.setHeader('Content-Type', contentType);
        return res.end(content);
      } else {
        return res.end(`
          <html>
            <head><title>File Not Found</title></head>
            <body>
              <h1>File Not Found</h1>
              <p>The requested file ${pathname} was not found.</p>
              <p>Available files in root directory:</p>
              <ul>
                ${fs.readdirSync(path.join(__dirname, '..')).slice(0, 20).map(f => `<li>${f}</li>`).join('')}
              </ul>
            </body>
          </html>
        `);
      }
    } catch (err) {
      console.error('Error serving file:', err);
      return res.end(`
        <html>
          <head><title>Error</title></head>
          <body>
            <h1>Error serving file</h1>
            <p>${err.message}</p>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Static server error:', error);
    res.statusCode = 500;
    return res.end(`
      <html>
        <head><title>Server Error</title></head>
        <body>
          <h1>Server Error</h1>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
}; 