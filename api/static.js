const path = require('path');
const fs = require('fs');

module.exports = (req, res) => {
  const { pathname } = req.url;
  
  // Handle root path
  if (pathname === '/') {
    const indexPath = path.join(__dirname, '..', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html');
      res.send(fs.readFileSync(indexPath, 'utf8'));
    } else {
      res.status(404).json({ error: 'index.html not found' });
    }
    return;
  }
  
  // Handle other static files
  const filePath = path.join(__dirname, '..', pathname);
  
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml'
    }[ext] || 'text/plain';
    
    res.setHeader('Content-Type', contentType);
    res.send(fs.readFileSync(filePath));
  } else {
    res.status(404).json({ error: 'File not found', path: pathname });
  }
}; 